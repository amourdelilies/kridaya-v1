<?php
namespace App\Http\Controllers;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller {
    /** Hanya pemilik dokumen atau admin. */
    public function download(Request $r, Document $document) {
        abort_unless($r->user()->id === $document->user_id || $r->user()->role === 'admin', 403);
        abort_unless(Storage::exists($document->path), 404, 'File tidak ditemukan di server');
        return Storage::download($document->path, basename($document->path));
    }
}
