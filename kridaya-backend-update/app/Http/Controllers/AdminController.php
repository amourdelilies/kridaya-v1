<?php
namespace App\Http\Controllers;
use App\Models\Profile;
use App\Support\Notify;
use Illuminate\Http\Request;

class AdminController extends Controller {
    public function index(Request $r) {
        return Profile::with('user.documents')->where('status', $r->query('status','pending'))->oldest()->paginate(20);
    }
    public function decide(Request $r, Profile $profile) {
        $v = $r->validate(['status'=>'required|in:approved,rejected','note'=>'nullable|string|max:500']);
        $profile->update(['status'=>$v['status'],'note'=>$v['status']==='rejected' ? ($v['note'] ?? null) : null]);
        Notify::to($profile->user, $v['status']==='approved' ? 'Profilmu disetujui' : 'Profilmu perlu diperbaiki',
            $v['status']==='approved' ? 'Akunmu sudah aktif. Silakan masuk dan mulai mencari mitra.' : 'Profilmu belum disetujui. Alasan: '.($v['note'] ?: 'tidak dicantumkan').'. Perbaiki data lalu kirim ulang.');
        return $profile;
    }
}
