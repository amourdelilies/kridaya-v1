<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('identifier')->unique();          // email atau no. HP
            $t->enum('role', ['event', 'sponsor', 'admin'])->default('event');
            $t->enum('plan', ['free', 'premium'])->default('free');
            $t->unsignedSmallInteger('matches_used')->default(0);
            $t->timestamp('matches_reset_at')->nullable();
            $t->timestamps();
        });
        Schema::create('personal_access_tokens', function (Blueprint $t) {
            $t->id(); $t->morphs('tokenable'); $t->string('name');
            $t->string('token', 64)->unique(); $t->text('abilities')->nullable();
            $t->timestamp('last_used_at')->nullable(); $t->timestamp('expires_at')->nullable(); $t->timestamps();
        });
        Schema::create('profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('name'); $t->string('category')->index(); $t->string('location')->index();
            $t->text('description');
            $t->json('types')->nullable();               // Cash, Produk, Jasa, Voucher
            $t->json('extra')->nullable();               // event: penaung, sosmed, wa, email | sponsor: tahun, nib
            $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $t->timestamps();
        });
        Schema::create('documents', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type'); $t->string('path'); $t->timestamps();
        });
        Schema::create('deals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_user_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('sponsor_user_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('initiator_id')->constrained('users');
            $t->enum('status', ['pending', 'active', 'rejected', 'expired', 'done'])->default('pending')->index();
            $t->unsignedTinyInteger('stage')->default(0);   // 0 Kenalan .. 3 Deal
            $t->timestamp('expires_at')->nullable();        // batas approve 24 jam
            $t->timestamp('deadline_at')->nullable();       // tenggat pemenuhan
            $t->timestamp('event_signed_at')->nullable();
            $t->timestamp('sponsor_signed_at')->nullable();
            $t->timestamp('ended_at')->nullable();
            $t->timestamps();
        });
        Schema::create('messages', function (Blueprint $t) {
            $t->id(); $t->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained(); $t->text('body'); $t->timestamps();
        });
        Schema::create('fulfillments', function (Blueprint $t) {
            $t->id(); $t->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained();
            $t->enum('kind', ['material', 'proof']);        // sponsor: material, event: proof
            $t->string('title'); $t->text('note')->nullable(); $t->string('path')->nullable(); $t->timestamps();
        });
    }
    public function down(): void {
        foreach (['fulfillments','messages','deals','documents','profiles','personal_access_tokens','users'] as $x) Schema::dropIfExists($x);
    }
};
