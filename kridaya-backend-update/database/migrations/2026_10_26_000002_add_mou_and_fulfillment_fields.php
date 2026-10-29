<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('deals', fn (Blueprint $t) => $t->timestamp('mou_at')->nullable());
        Schema::table('fulfillments', function (Blueprint $t) {
            $t->unsignedBigInteger('value')->default(0);
            $t->string('file_name')->nullable();
            $t->timestamp('verified_at')->nullable();
        });
    }
    public function down(): void {
        Schema::table('deals', fn (Blueprint $t) => $t->dropColumn('mou_at'));
        Schema::table('fulfillments', fn (Blueprint $t) => $t->dropColumn(['value','file_name','verified_at']));
    }
};
