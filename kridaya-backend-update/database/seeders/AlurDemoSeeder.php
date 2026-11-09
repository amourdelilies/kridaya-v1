<?php
namespace Database\Seeders;
use App\Models\{Deal, User};
use Illuminate\Database\Seeder;

/** Jalankan SETELAH KriDayaSeeder. Menyiapkan kerja sama di tiap tahap agar alur bisa dicoba sampai selesai. */
class AlurDemoSeeder extends Seeder {
    private function u(string $id): User { return User::where('identifier', $id)->firstOrFail(); }
    private function code(Deal $d, string $side): string { return strtoupper(substr(hash_hmac('sha256', $d->id.'|'.$side.'|demo', config('app.key')), 0, 10)); }

    private function deal(int $e, int $s, array $o, array $items = [], array $msgs = []): void {
        $E = $this->u(sprintf('event%02d@dummy.id', $e)); $S = $this->u(sprintf('sponsor%02d@dummy.id', $s));
        $d = Deal::updateOrCreate(['event_user_id'=>$E->id,'sponsor_user_id'=>$S->id], $o + ['initiator_id'=>$E->id,'expires_at'=>now()->subDays(6),'deadline_at'=>now()->addDays(10)]);
        $up = [];
        if ($d->event_signed_at && !$d->event_sign_code) $up['event_sign_code'] = $this->code($d, 'event');
        if ($d->sponsor_signed_at && !$d->sponsor_sign_code) $up['sponsor_sign_code'] = $this->code($d, 'sponsor');
        if ($up) $d->update($up);
        $d->messages()->delete(); $d->fulfillments()->delete();
        foreach ($msgs as [$who, $b]) $d->messages()->create(['user_id'=>$who === 'e' ? $E->id : $S->id, 'body'=>$b]);
        foreach ($items as [$who, $title, $note, $val, $file, $ok]) $d->fulfillments()->create([
            'user_id'=>$who === 'e' ? $E->id : $S->id, 'kind'=>$who === 'e' ? 'proof' : 'material', 'title'=>$title, 'note'=>$note,
            'value'=>$val, 'file_name'=>$file, 'verified_at'=>$ok ? now()->subHours(5) : null,
        ]);
    }

    public function run(): void {
        $sign = ['mou_at'=>now()->subDays(4), 'event_signed_at'=>now()->subDays(4), 'sponsor_signed_at'=>now()->subDays(3)];
        $chat = [['e','Halo, terima kasih sudah tertarik dengan event kami.'],['s','Sama-sama! Kami siap mendukung. Mari lanjut ke MoU.'],['e','Siap. MoU sudah kami buat ya.']];

        // 1) Tahap AUDIT: event01 x sponsor01. Dua item menunggu verifikasi pihak lawan.
        $this->deal(1, 1, ['status'=>'active','stage'=>3] + $sign, [
            ['s','Logo vektor Kopi Senja','SVG dan PNG transparan',0,'kopi-senja-logo.svg',true],
            ['s','Adlibs dan narasi promosi','Naskah 60 detik untuk MC',2000000,null,false],
            ['e','Foto booth Kopi Senja','Booth di area registrasi',3000000,'booth-registrasi.jpg',true],
            ['e','Logo di banner utama','Banner 3x2 meter',5000000,'banner-utama.jpg',false],
        ], $chat);

        // 2) Tahap TANDA TANGAN: MoU sudah dibuat, belum ada yang menandatangani (event04 x sponsor06).
        $this->deal(4, 6, ['status'=>'active','stage'=>2,'mou_at'=>now()->subDay()], [], $chat);

        // 3) Siap DIAKHIRI: semua item terverifikasi (event05 x sponsor08).
        $this->deal(5, 8, ['status'=>'active','stage'=>3] + $sign, [
            ['s','Banner digital sponsor','1920x1080 untuk layar utama',4000000,'banner-tanilink.png',true],
            ['s','Voucher peserta','100 voucher potongan',3000000,null,true],
            ['e','Dokumentasi pemasangan banner','Foto hari-H',4000000,'dok-banner.jpg',true],
            ['e','Mention di sosial media','Tiga unggahan Instagram',3000000,'ig-mention.png',true],
        ], $chat);

        // 4) Sudah SELESAI: laporan dan riwayat bisa dilihat (event06 x sponsor09).
        $this->deal(6, 9, ['status'=>'done','stage'=>3,'ended_at'=>now()->subDays(2)] + $sign, [
            ['s','Produk jamu kemasan','200 botol untuk peserta',5000000,null,true],
            ['s','Logo dan materi promosi','Format vektor',0,'jamu-logo.svg',true],
            ['e','Booth sampling','Foto booth dan antrean peserta',6000000,'sampling.jpg',true],
            ['e','Laporan peserta','Rekap 400 peserta hadir',4000000,'laporan-peserta.pdf',true],
        ], $chat);

        $this->command?->info('Alur demo siap: audit (event01/sponsor01), tanda tangan (event04/sponsor06), siap diakhiri (event05/sponsor08), selesai (event06/sponsor09).');
    }
}
