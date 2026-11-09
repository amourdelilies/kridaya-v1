<?php
namespace App\Support;
use Illuminate\Support\Facades\{Log, Mail};

/** Kirim email jika identifier berupa email. Dengan MAIL_MAILER=log, isi email tercatat di storage/logs/laravel.log. */
class Notify {
    public static function to($user, string $subject, string $body): void {
        if (!filter_var($user->identifier, FILTER_VALIDATE_EMAIL)) { Log::info("[notif {$user->identifier}] $subject"); return; }
        try { Mail::raw($body, fn ($m) => $m->to($user->identifier)->subject("[KriDaya] $subject")); }
        catch (\Throwable $e) { Log::warning('Email gagal: '.$e->getMessage()); }
    }
}
