<?php
namespace Database\Seeders;

use App\Models\{Deal, Document, Message, Profile, User};
use Illuminate\Database\Seeder;

/** Data contoh KriDaya. Aman dijalankan berulang (tidak menggandakan data). */
class KriDayaSeeder extends Seeder
{
    private function make(string $id, string $role, array $p, string $status = 'approved'): User
    {
        $u = User::firstOrCreate(['identifier' => $id], ['name' => $p['pic'], 'role' => $role]);
        Profile::updateOrCreate(['user_id' => $u->id], [
            'name' => $p['n'], 'category' => $p['c'], 'location' => $p['l'], 'description' => $p['d'],
            'types' => $p['t'], 'status' => $status,
            'extra' => $p['x'] + ['m' => $id, 'w' => '+62 812-'.random_int(1000, 9999).'-'.random_int(1000, 9999), 's' => '@'.str_replace(' ', '', strtolower($p['n']))],
        ]);
        return $u;
    }

    public function run(): void
    {
        $sponsors = [
            ['n'=>'Kopi Senja','c'=>'F&B','l'=>'Bandung','t'=>['Produk','Cash'],'d'=>'Kedai kopi lokal dengan 4 cabang. Terbuka untuk barter produk dan sponsor cash untuk acara kampus.','x'=>['y'=>2019,'nib'=>'1203220011223','bmin'=>5000000,'bmax'=>15000000],'pic'=>'Rina Kusuma'],
            ['n'=>'Rumah Batik Laras','c'=>'Fashion','l'=>'Yogyakarta','t'=>['Cash'],'d'=>'Brand batik kontemporer yang menyasar mahasiswa dan pekerja muda.','x'=>['y'=>2016,'nib'=>'1203220011224','bmin'=>10000000,'bmax'=>30000000],'pic'=>'Laras Wulandari'],
            ['n'=>'Nusa Digital','c'=>'Teknologi','l'=>'Jakarta','t'=>['Cash','Jasa'],'d'=>'Software house yang aktif mendukung seminar dan lomba teknologi.','x'=>['y'=>2021,'nib'=>'1203220011225','bmin'=>15000000,'bmax'=>50000000],'pic'=>'Dimas Pratama'],
            ['n'=>'Warung Sehat','c'=>'F&B','l'=>'Bandung','t'=>['Produk','Voucher'],'d'=>'Katering sehat untuk konsumsi peserta dan voucher makan.','x'=>['y'=>2022,'nib'=>'1203220011226','bmin'=>2000000,'bmax'=>8000000],'pic'=>'Sari Dewi'],
            ['n'=>'Cetak Kilat','c'=>'Jasa','l'=>'Jakarta','t'=>['Jasa'],'d'=>'Percetakan spanduk, ID card, dan merchandise dengan harga komunitas.','x'=>['y'=>2018,'nib'=>'1203220011227','bmin'=>3000000,'bmax'=>10000000],'pic'=>'Budi Santoso'],
            ['n'=>'Langkah Outdoor','c'=>'Fashion','l'=>'Bandung','t'=>['Produk','Cash'],'d'=>'Perlengkapan outdoor, cocok untuk event olahraga dan alam.','x'=>['y'=>2020,'nib'=>'1203220011228','bmin'=>8000000,'bmax'=>25000000],'pic'=>'Fajar Nugroho'],
            ['n'=>'Bumi Skincare','c'=>'Kecantikan','l'=>'Surabaya','t'=>['Produk','Cash'],'d'=>'Skincare lokal dengan program kolaborasi kampus.','x'=>['y'=>2020,'nib'=>'1203220011229','bmin'=>6000000,'bmax'=>20000000],'pic'=>'Maya Anggraini'],
            ['n'=>'Tanilink','c'=>'Teknologi','l'=>'Bandung','t'=>['Cash','Voucher'],'d'=>'Startup agritech yang mencari eksposur ke komunitas mahasiswa.','x'=>['y'=>2023,'nib'=>'1203220011230','bmin'=>10000000,'bmax'=>35000000],'pic'=>'Raka Aditya'],
            ['n'=>'Jamu Nusantara','c'=>'F&B','l'=>'Yogyakarta','t'=>['Produk','Cash'],'d'=>'Minuman herbal kemasan yang rutin mensponsori event kesehatan dan budaya.','x'=>['y'=>2015,'nib'=>'1203220011231','bmin'=>4000000,'bmax'=>12000000],'pic'=>'Sri Rahayu'],
            ['n'=>'Pixel Studio','c'=>'Jasa','l'=>'Surabaya','t'=>['Jasa','Cash'],'d'=>'Studio desain dan dokumentasi foto-video untuk event kampus.','x'=>['y'=>2021,'nib'=>'1203220011232','bmin'=>5000000,'bmax'=>18000000],'pic'=>'Kevin Halim'],
        ];
        $events = [
            ['n'=>'Seminar Teknologi UMKM','c'=>'Seminar','l'=>'Bandung','t'=>['Cash'],'d'=>'Seminar transformasi digital UMKM. Target 300 peserta mahasiswa dan pelaku usaha.','b'=>2000000,'badan'=>'BEM Fakultas Ilmu Komputer','pic'=>'Panitia Seminar'],
            ['n'=>'Lomba Desain Poster Nasional','c'=>'Lomba','l'=>'Jakarta','t'=>['Cash','Jasa'],'d'=>'Lomba poster tingkat nasional. Target 500 peserta dari 40 kampus.','b'=>8000000,'badan'=>'HIMA Desain Komunikasi Visual','pic'=>'Panitia Lomba'],
            ['n'=>'Webinar Karier Muda','c'=>'Webinar','l'=>'Yogyakarta','t'=>['Voucher'],'d'=>'Webinar persiapan karier, dua pembicara industri. Target 800 peserta online.','b'=>3000000,'badan'=>'UKM Pengembangan Karier','pic'=>'Panitia Webinar'],
            ['n'=>'Festival Olahraga Fakultas','c'=>'Lomba','l'=>'Bandung','t'=>['Produk','Cash'],'d'=>'Festival olahraga tiga hari antar-jurusan. Target 1.200 pengunjung.','b'=>15000000,'badan'=>'BEM Fakultas Ilmu Keolahragaan','pic'=>'Panitia Festival'],
            ['n'=>'Hackathon Kampus 2026','c'=>'Lomba','l'=>'Jakarta','t'=>['Cash','Jasa'],'d'=>'Hackathon 36 jam, target 200 peserta dari 25 universitas.','b'=>20000000,'badan'=>'HMIF dan Komunitas Developer','pic'=>'Panitia Hackathon'],
            ['n'=>'Seminar Kewirausahaan Sosial','c'=>'Seminar','l'=>'Surabaya','t'=>['Cash','Produk'],'d'=>'Seminar dan pameran produk usaha sosial. Target 400 peserta.','b'=>5000000,'badan'=>'Himpunan Mahasiswa Manajemen','pic'=>'Panitia Seminar'],
            ['n'=>'Webinar Kesehatan Mental Mahasiswa','c'=>'Webinar','l'=>'Bandung','t'=>['Voucher','Produk'],'d'=>'Webinar bersama psikolog, target 600 peserta online.','b'=>2500000,'badan'=>'UKM Peduli Kesehatan','pic'=>'Panitia Webinar'],
            ['n'=>'Pekan Seni dan Budaya','c'=>'Lainnya','l'=>'Yogyakarta','t'=>['Cash','Produk','Jasa'],'d'=>'Pekan pertunjukan seni lima hari, target 2.000 pengunjung.','b'=>12000000,'badan'=>'BEM Universitas','pic'=>'Panitia Pekan Seni'],
        ];

        $S = $E = [];
        foreach ($sponsors as $i => $p) $S[] = $this->make(sprintf('sponsor%02d@dummy.id', $i + 1), 'sponsor', $p);
        foreach ($events as $i => $p) {
            $p['x'] = ['badan'=>$p['badan'],'bmin'=>$p['b'],'bmax'=>$p['b']];
            $E[] = $this->make(sprintf('event%02d@dummy.id', $i + 1), 'event', $p);
        }

        // Dua profil yang masih menunggu, untuk mencoba antrean admin.
        $pe = $this->make('event99@dummy.id', 'event', ['n'=>'Lomba Karya Tulis Ilmiah','c'=>'Lomba','l'=>'Jakarta','t'=>[],'d'=>'Lomba karya tulis tingkat nasional. Target 300 peserta.','x'=>['badan'=>'HIMA Sastra'],'pic'=>'Panitia LKTI'], 'pending');
        $ps = $this->make('sponsor99@dummy.id', 'sponsor', ['n'=>'Toko Buku Pelangi','c'=>'Jasa','l'=>'Bandung','t'=>['Produk','Voucher'],'d'=>'Toko buku independen, tertarik mendukung event literasi.','x'=>['y'=>2017,'nib'=>'1203220011299','bmin'=>2000000,'bmax'=>6000000],'pic'=>'Anita Putri'], 'pending');
        foreach ([[$pe, ['izin','panitia','rab','proposal']], [$ps, ['nib','izin']]] as [$u, $types]) {
            foreach ($types as $t) Document::firstOrCreate(['user_id'=>$u->id,'type'=>$t], ['path'=>"docs/{$u->id}/{$t}-contoh.pdf"]);
        }

        // 1) Kerja sama aktif lengkap: event01 x sponsor01 (MoU sudah TTD, ada deliverables).
        $d = Deal::updateOrCreate(['event_user_id'=>$E[0]->id,'sponsor_user_id'=>$S[0]->id], [
            'initiator_id'=>$E[0]->id,'status'=>'active','stage'=>3,'expires_at'=>now()->subDays(4),'deadline_at'=>now()->addDays(9),
            'mou_at'=>now()->subDays(3),'event_signed_at'=>now()->subDays(3),'sponsor_signed_at'=>now()->subDays(2),
        ]);
        $d->messages()->delete(); $d->fulfillments()->delete();
        foreach ([[$E[0],'Halo Kak, terima kasih sudah tertarik dengan Seminar Teknologi UMKM kami.'],[$S[0],'Sama-sama! Boleh kirim RAB dan proposalnya?'],[$E[0],'Sudah kami lampirkan. Untuk sponsor 20 kopi kemasan dan Rp2 juta, bagaimana?'],[$S[0],'Setuju. Kami siapkan logo dan materi promosinya.']] as [$u, $b])
            Message::create(['deal_id'=>$d->id,'user_id'=>$u->id,'body'=>$b]);
        foreach ([
            [$S[0],'material','Logo vektor Kopi Senja','Format SVG dan PNG transparan',0,'kopi-senja-logo.svg',true],
            [$S[0],'material','Adlibs dan narasi promosi','Naskah 60 detik untuk MC',2000000,null,false],
            [$E[0],'proof','Foto booth Kopi Senja','Booth di area registrasi',3000000,'booth-registrasi.jpg',true],
            [$E[0],'proof','Logo di banner utama','Banner 3x2 meter, posisi tengah atas',5000000,'banner-utama.jpg',false],
        ] as [$u,$k,$t,$n,$v,$f,$ok])
            $d->fulfillments()->create(['user_id'=>$u->id,'kind'=>$k,'title'=>$t,'note'=>$n,'value'=>$v,'file_name'=>$f,'verified_at'=>$ok ? now()->subDay() : null]);

        // 2) Minat masuk yang belum dijawab: event02 -> sponsor03, sponsor05 -> event03.
        Deal::updateOrCreate(['event_user_id'=>$E[1]->id,'sponsor_user_id'=>$S[2]->id], ['initiator_id'=>$E[1]->id,'status'=>'pending','expires_at'=>now()->addHours(20)]);
        Deal::updateOrCreate(['event_user_id'=>$E[2]->id,'sponsor_user_id'=>$S[4]->id], ['initiator_id'=>$S[4]->id,'status'=>'pending','expires_at'=>now()->addHours(12)]);

        $this->command?->info('Seeder KriDaya selesai: 10 sponsor, 8 event, 2 profil menunggu, 3 kerja sama.');
    }
}