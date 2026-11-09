<?php
namespace App\Http\Controllers;
use App\Models\{Deal, Fulfillment, User};
use Illuminate\Http\Request;

class DealController extends Controller {
    private function mine(Request $r, Deal $d): Deal {
        abort_unless(in_array($r->user()->id, [$d->event_user_id, $d->sponsor_user_id]), 403);
        return $d;
    }
    private function side(Request $r, Deal $d): string { return $r->user()->id === $d->event_user_id ? 'event' : 'sponsor'; }
    private function active(Request $r, Deal $d): Deal { abort_unless($this->mine($r,$d)->status === 'active', 422, 'Kerja sama belum aktif'); return $d; }

    public function index(Request $r) {
        return $r->user()->deals()->with(['event','sponsor','messages','fulfillments'])->latest()->get();
    }
    /** Kirim minat. Free: 5 pitch per bulan (dihitung di server). */
    public function store(Request $r) {
        $u = $r->user(); $u->refreshQuota();
        $v = $r->validate(['targets'=>'required|array|max:20','targets.*'=>'integer|exists:users,id']);
        abort_if($u->plan === 'free' && $u->matches_used + count($v['targets']) > 5, 429, 'Kuota pitch Free (5 per bulan) tidak cukup. Upgrade ke Premium.');
        $new = 0;
        foreach ($v['targets'] as $tid) {
            $o = User::findOrFail($tid); abort_if($o->role === $u->role || $o->role === 'admin', 422, 'Target tidak valid');
            [$e,$s] = $u->role === 'event' ? [$u->id,$o->id] : [$o->id,$u->id];
            $d = Deal::firstOrCreate(['event_user_id'=>$e,'sponsor_user_id'=>$s,'status'=>'pending'], ['initiator_id'=>$u->id,'expires_at'=>now()->addDay()]);
            $new += $d->wasRecentlyCreated ? 1 : 0; // TODO: queue Mail notifikasi minat masuk
        }
        $u->increment('matches_used', $new);
        return response()->json(['ok'=>true,'created'=>$new], 201);
    }
    public function respond(Request $r, Deal $deal) {
        $this->mine($r,$deal);
        abort_unless($deal->status === 'pending' && $deal->initiator_id !== $r->user()->id, 422);
        abort_if($deal->expires_at->isPast(), 410, 'Batas persetujuan sudah lewat');
        $ok = $r->validate(['accept'=>'required|boolean'])['accept'];
        $deal->update($ok ? ['status'=>'active','deadline_at'=>now()->addDays(14)] : ['status'=>'rejected']);
        return $deal;
    }
    public function sendMessage(Request $r, Deal $deal) {
        return $this->active($r,$deal)->messages()->create(['user_id'=>$r->user()->id,'body'=>$r->validate(['body'=>'required|string|max:2000'])['body']]);
    }
    public function mou(Request $r, Deal $deal) { $this->active($r,$deal)->update(['mou_at'=>now()]); return $deal; }
    public function sign(Request $r, Deal $deal) {
        abort_unless($this->active($r,$deal)->mou_at, 422, 'MoU belum dibuat');
        $deal->update([$this->side($r,$deal).'_signed_at' => now()]); return $deal; // TODO: TTE tersertifikasi
    }
    public function fulfil(Request $r, Deal $deal) {
        $this->active($r,$deal);
        abort_unless($deal->event_signed_at && $deal->sponsor_signed_at, 422, 'MoU belum ditandatangani kedua pihak');
        $v = $r->validate(['title'=>'required|string|max:150','note'=>'nullable|string|max:1000','value'=>'nullable|integer|min:0','file'=>'nullable|file|max:10240']);
        $f = $r->file('file');
        return $deal->fulfillments()->create([
            'user_id'=>$r->user()->id,'kind'=>$this->side($r,$deal)==='sponsor'?'material':'proof','title'=>$v['title'],
            'note'=>$v['note'] ?? null,'value'=>$v['value'] ?? 0,'path'=>$f?->store("deals/{$deal->id}"),'file_name'=>$f?->getClientOriginalName(),
        ]);
    }
    /** Hanya pihak lawan dari pengunggah yang boleh memverifikasi. */
    public function verify(Request $r, Deal $deal, Fulfillment $fulfillment) {
        $this->active($r,$deal);
        abort_unless($fulfillment->deal_id === $deal->id && $fulfillment->user_id !== $r->user()->id, 403, 'Hanya pihak lawan yang bisa memverifikasi');
        $fulfillment->update(['verified_at'=>now()]); return $fulfillment;
    }
    public function end(Request $r, Deal $deal) {
        $this->active($r,$deal);
        abort_unless($deal->fulfillments()->exists() && !$deal->fulfillments()->whereNull('verified_at')->exists(), 422, 'Semua deliverables harus terverifikasi');
        $deal->update(['status'=>'done','ended_at'=>now()]); return $deal;
    }
}
