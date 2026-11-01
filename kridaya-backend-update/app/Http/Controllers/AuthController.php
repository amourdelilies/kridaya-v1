<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Cache, Log};

class AuthController extends Controller {
    private const LABEL = ['event'=>'Pihak Event','sponsor'=>'Pihak Sponsor','admin'=>'Admin'];

    public function otp(Request $r) {
        $v = $r->validate(['identifier'=>'required|string|max:120','name'=>'nullable|string|max:100','role'=>'nullable|in:event,sponsor']);
        $ex = User::where('identifier', $v['identifier'])->first();
        abort_if($ex && !empty($v['role']) && $ex->role !== $v['role'], 422,
            'Nomor/email ini sudah terdaftar sebagai '.self::LABEL[$ex->role].'. Gunakan nomor/email lain untuk mendaftar sebagai '.self::LABEL[$v['role']].', atau masuk ke akun yang ada.');
        abort_if(!$ex && empty($v['role']), 422, 'Akun belum terdaftar. Pilih peran untuk mendaftar.');
        $code = app()->isProduction() ? (string) random_int(100000, 999999) : '123456';
        Cache::put('otp:'.$v['identifier'], ['code'=>$code,'name'=>$v['name']??null,'role'=>$v['role']??null], 300);
        Log::info("OTP {$v['identifier']}: $code"); // TODO produksi: kirim via Mail/WhatsApp
        return ['ok' => true];
    }
    public function verify(Request $r) {
        $v = $r->validate(['identifier'=>'required','code'=>'required|digits:6']);
        $o = Cache::get('otp:'.$v['identifier']);
        abort_unless($o && hash_equals($o['code'], $v['code']), 422, 'Kode OTP salah atau kedaluwarsa');
        Cache::forget('otp:'.$v['identifier']);
        $u = User::firstOrCreate(['identifier'=>$v['identifier']], ['name'=>$o['name'] ?? 'Pengguna','role'=>$o['role'] ?? 'event']);
        return ['token' => $u->createToken('web', ['*'], now()->addDays(7))->plainTextToken, 'user' => $u];
    }
    public function me(Request $r) { $r->user()->refreshQuota(); return $r->user()->fresh()->load('profile','documents'); }
    /** Hanya demo lokal. Produksi: ganti dengan webhook payment gateway. */
    public function setPlan(Request $r) {
        abort_unless(app()->environment('local'), 404);
        $r->user()->update(['plan' => $r->validate(['plan'=>'in:free,premium'])['plan']]); return $r->user();
    }
}
