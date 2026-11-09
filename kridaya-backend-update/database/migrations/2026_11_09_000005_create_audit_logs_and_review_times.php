<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('admin_id')->constrained('users');
            $t->string('action', 30)->index();           // approve | reject | plan
            $t->string('target_type', 20);
            $t->unsignedBigInteger('target_id');
            $t->string('label')->nullable();             // nama profil/akun saat kejadian
            $t->text('note')->nullable();
            $t->timestamps();
        });
        Schema::table('profiles', function (Blueprint $t) {
            $t->timestamp('submitted_at')->nullable();   // dasar hitungan SLA 1x24 jam
            $t->timestamp('decided_at')->nullable();
        });
    }
    public function down(): void {
        Schema::dropIfExists('audit_logs');
        Schema::table('profiles', function (Blueprint $t) { $t->dropColumn(['submitted_at', 'decided_at']); });
    }
};
