<?php
namespace App\Http\Controllers;
use App\Models\Profile;
use Illuminate\Http\Request;

class DiscoverController extends Controller {
    /** Semua profil terverifikasi dari peran lawan. Skor dan filter dihitung di klien. */
    public function index(Request $r) {
        $opp = $r->user()->role === 'event' ? 'sponsor' : 'event';
        return Profile::where('status','approved')->whereHas('user', fn($q) => $q->where('role',$opp))->latest()->get();
    }
}
