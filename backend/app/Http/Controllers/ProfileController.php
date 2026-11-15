<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;

class ProfileController extends Controller {
    private const DOCS = ['izin','panitia','rab','proposal','dok','nib'];
    public function store(Request $r) {
        $u = $r->user();
        abort_if($u->profile?->status === 'approved', 422, 'Profil yang sudah disetujui tidak bisa dikirim ulang.');
        $v = $r->validate([
            'name'=>'required|string|max:150','category'=>'required|string|max:60','location'=>'required|string|max:60','description'=>'required|string|max:2000',
            'types'=>'nullable|array|max:4','types.*'=>'in:Cash,Produk,Jasa,Voucher',
            'extra'=>'nullable|array','extra.m'=>'nullable|string|max:120','extra.w'=>'nullable|string|max:30','extra.s'=>'nullable|string|max:80',
            'extra.y'=>'nullable|integer|between:1950,2026','extra.nib'=>'nullable|string|max:40','extra.badan'=>'nullable|string|max:150',
            'extra.bmin'=>'nullable|integer|min:0','extra.bmax'=>'nullable|integer|min:0',
            'extra.want'=>'nullable|array|max:6','extra.want.*'=>'in:F&B,Fashion,Teknologi,Jasa,Kecantikan,Webinar,Lomba,Seminar,Lainnya',
            'docs'=>'nullable|array','docs.*'=>'file|max:5120|mimes:pdf,jpg,jpeg,png,docx',
        ]);
        $extra = collect($v['extra'] ?? [])->only(['m','w','s','y','nib','badan','bmin','bmax','want'])->all();
        if ($logo = $u->profile?->extra['logo'] ?? null) $extra['logo'] = $logo;
        $p = $u->profile()->updateOrCreate([], ['name'=>$v['name'],'category'=>$v['category'],'location'=>$v['location'],'description'=>$v['description'],
            'types'=>$v['types'] ?? [],'extra'=>$extra,'status'=>'pending','note'=>null,'submitted_at'=>now(),'decided_at'=>null]);
        foreach ($r->file('docs', []) as $type => $f) {
            if (in_array($type, self::DOCS, true)) $u->documents()->updateOrCreate(['type'=>$type], ['path'=>$f->store("docs/{$u->id}")]);
        }
        return $p;
    }
    /** Edit data non-legal setelah disetujui (tanpa verifikasi ulang). Nama, kategori, lokasi, NIB, dan dokumen tidak bisa diubah di sini. */
    public function update(Request $r) {
        $p = $r->user()->profile; abort_unless($p, 422, 'Isi profil dulu.');
        $v = $r->validate([
            'description'=>'required|string|max:2000','types'=>'nullable|array|max:4','types.*'=>'in:Cash,Produk,Jasa,Voucher',
            'extra'=>'nullable|array','extra.m'=>'nullable|string|max:120','extra.w'=>'nullable|string|max:30','extra.s'=>'nullable|string|max:80',
            'extra.badan'=>'nullable|string|max:150','extra.bmin'=>'nullable|integer|min:0','extra.bmax'=>'nullable|integer|min:0',
            'extra.want'=>'nullable|array|max:6','extra.want.*'=>'in:F&B,Fashion,Teknologi,Jasa,Kecantikan,Webinar,Lomba,Seminar,Lainnya',
        ]);
        $x = $p->extra ?? [];
        foreach (['m','w','s','badan','bmin','bmax','want'] as $k) if (array_key_exists($k, $v['extra'] ?? [])) $x[$k] = $v['extra'][$k];
        $p->update(['description'=>$v['description'],'types'=>$v['types'] ?? [],'extra'=>$x]);
        return $p;
    }
    public function logo(Request $r) {
        $p = $r->user()->profile; abort_unless($p, 422, 'Isi profil dulu.');
        $r->validate(['logo'=>'required|image|mimes:jpg,jpeg,png,webp|max:2048']);
        $x = $p->extra ?? []; $x['logo'] = $r->file('logo')->store('logos', 'public');
        $p->update(['extra'=>$x]); return $p;
    }
}
