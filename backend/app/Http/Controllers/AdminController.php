<?php
namespace App\Http\Controllers;
use App\Models\Profile;
use App\Models\Deal;
use App\Models\User;
use App\Support\Notify;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller {

    public function stats()
{
    $today = now()->startOfDay();
    $tomorrow = now()->addDay()->startOfDay();
    $since = now()->subDays(13)->startOfDay();

    // Jumlah profil yang masih menunggu verifikasi
    $pending = Profile::where('status', 'pending')->count();

    // Profil pending yang sudah menunggu lebih dari 24 jam
    $overdue = Profile::where('status', 'pending')
        ->where('created_at', '<=', now()->subHours(24))
        ->count();

    // Jumlah profil yang disetujui hari ini
    $approvedToday = Profile::where('status', 'approved')
        ->where('updated_at', '>=', $today)
        ->where('updated_at', '<', $tomorrow)
        ->count();

    // Jumlah profil yang ditolak hari ini
    $rejectedToday = Profile::where('status', 'rejected')
        ->where('updated_at', '>=', $today)
        ->where('updated_at', '<', $tomorrow)
        ->count();

    // Statistik keputusan selama 14 hari terakhir
    $daily = Profile::whereIn('status', ['approved', 'rejected'])
        ->where('updated_at', '>=', $since)
        ->selectRaw('DATE(updated_at) as day, COUNT(*) as total')
        ->groupBy('day')
        ->pluck('total', 'day');

    // Jumlah kerja sama berdasarkan status
    $deals = Deal::selectRaw('status, COUNT(*) as total')
        ->groupBy('status')
        ->pluck('total', 'status');

    // Jumlah pengguna berdasarkan peran
    $users = User::selectRaw('role, COUNT(*) as total')
        ->groupBy('role')
        ->pluck('total', 'role');

    return response()->json([
        'pending' => $pending,
        'overdue' => $overdue,
        'approved_today' => $approvedToday,
        'rejected_today' => $rejectedToday,
        'avg_hours' => null,
        'daily' => $daily,
        'deals' => $deals,
        'users' => $users,
    ]);
}


public function deals()
{
    $deals = Deal::with([
        'event.profile',
        'sponsor.profile',
        'fulfillments'
    ])
    ->latest()
    ->get();

    return $deals->map(function ($deal) {
        $flags = [];

        // Periksa kerja sama pending yang sudah melewati batas waktu
        if (
            $deal->status === 'pending' &&
            $deal->expires_at &&
            $deal->expires_at->isPast()
        ) {
            $flags[] = 'Batas persetujuan terlewat';
        }

        // Periksa kerja sama aktif yang melewati tenggat
        if (
            $deal->status === 'active' &&
            $deal->deadline_at &&
            $deal->deadline_at->isPast()
        ) {
            $flags[] = 'Melewati tenggat kerja sama';
        }

        // Periksa deliverables yang belum diverifikasi
        $unverified = $deal->fulfillments
            ->whereNull('verified_at')
            ->count();

        if ($unverified > 0 && $deal->status === 'active') {
            $flags[] = $unverified . ' item belum diverifikasi';
        }

        return [
            'id' => $deal->id,

            'event' => $deal->event?->profile?->name
                ?? $deal->event?->name
                ?? 'Event tidak ditemukan',

            'sponsor' => $deal->sponsor?->profile?->name
                ?? $deal->sponsor?->name
                ?? 'Sponsor tidak ditemukan',

            'status' => $deal->status,

            'created_at' => $deal->created_at,

            'items' => $deal->fulfillments->count(),

            'flags' => $flags,
        ];
    })->values();
}


public function users()
{
    return User::with('profile')
        ->latest()
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'identifier' => $user->identifier,
                'role' => $user->role,
                'profile' => $user->profile?->category ?? '-',
                'status' => $user->profile?->status ?? '-',
                'plan' => $user->plan,
                'created_at' => $user->created_at,
            ];
        })
        ->values();
}

public function setPlan(Request $r, User $user)
{
    $v = $r->validate([
        'plan' => 'required|in:free,premium',
    ]);

    // Simpan perubahan paket pengguna
    $user->update([
        'plan' => $v['plan'],
    ]);

    // Catat aktivitas admin ke audit log
    DB::table('audit_logs')->insert([
        'admin_id' => $r->user()->id,
        'action' => 'plan',
        'target_type' => 'user',
        'target_id' => $user->id,
        'label' => $user->name,
        'note' => 'Paket diubah menjadi ' . ucfirst($v['plan']),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json([
        'message' => 'Paket pengguna berhasil diperbarui.',
        'user' => $user->fresh(),
    ]);
}

public function index(Request $r)
{
    return Profile::with('user.documents')
        ->where('status', $r->query('status', 'pending'))
        ->oldest()
        ->get()
        ->map(function ($profile) {
            $documents = $profile->user?->documents ?? collect();

            return [
                'id' => $profile->id,
                'user_id' => $profile->user_id,
                'name' => $profile->name,
                'role' => $profile->user?->role,
                'identifier' => $profile->user?->identifier,
                'category' => $profile->category,
                'location' => $profile->location,
                'description' => $profile->description,
                'types' => $profile->types ?? [],
                'extra' => $profile->extra ?? [],
                'status' => $profile->status,
                'note' => $profile->note,
                'submitted_at' => $profile->created_at,
                'decided_at' => null,
                'flags' => [],
                'docs' => $documents->map(function ($document) {
                    return [
                        'id' => $document->id,
                        'type' => $document->type,
                        'name' => basename($document->path),
                    ];
                })->values(),
            ];
        })
        ->values();
}

    public function decide(Request $r, Profile $profile) {
        $v = $r->validate(['status'=>'required|in:approved,rejected','note'=>'nullable|string|max:500']);
        $profile->update(['status'=>$v['status'],'note'=>$v['status']==='rejected' ? ($v['note'] ?? null) : null]);
        Notify::to($profile->user, $v['status']==='approved' ? 'Profilmu disetujui' : 'Profilmu perlu diperbaiki',
            $v['status']==='approved' ? 'Akunmu sudah aktif. Silakan masuk dan mulai mencari mitra.' : 'Profilmu belum disetujui. Alasan: '.($v['note'] ?: 'tidak dicantumkan').'. Perbaiki data lalu kirim ulang.');
        return $profile;
    }
}
