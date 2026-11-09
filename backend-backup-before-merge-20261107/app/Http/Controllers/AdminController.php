<?php
namespace App\Http\Controllers;
use App\Models\Profile;
use Illuminate\Http\Request;

class AdminController extends Controller {
    public function index(Request $r) {
        return Profile::with('user.documents')->where('status', $r->query('status','pending'))->oldest()->paginate(20);
    }
    public function decide(Request $r, Profile $profile) {
        $profile->update(['status' => $r->validate(['status'=>'required|in:approved,rejected'])['status']]);
        return $profile; // TODO: notifikasi email hasil verifikasi
    }
}
