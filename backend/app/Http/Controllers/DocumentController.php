<?php
namespace App\Http\Controllers;
use App\Models\{Deal, Document};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller {
    private const SHARED = ['proposal','rab','panitia','dok']; // surat izin tidak dibagikan ke pihak lain

    /** Pemilik, admin, atau sponsor yang punya minat/kerja sama dengan event pemilik (hanya dokumen pendukung). ?inline=1 = pratinjau. */
    public function download(Request $r, Document $document) {
        $u = $r->user();
        $ok = $u->id === $document->user_id || $u->role === 'admin'
            || ($u->role === 'sponsor' && in_array($document->type, self::SHARED, true)
                && Deal::where('sponsor_user_id', $u->id)->where('event_user_id', $document->user_id)->whereIn('status', ['pending','active','done'])->exists());
        abort_unless($ok, 403);
        abort_unless(Storage::exists($document->path), 404, 'File tidak ditemukan di server');
        if ($r->boolean('inline')) return Storage::response($document->path, basename($document->path));
        return Storage::download($document->path, basename($document->path));
    }
}
