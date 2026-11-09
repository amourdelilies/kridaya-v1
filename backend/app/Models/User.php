<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens;
    protected $fillable = ['name', 'identifier', 'role', 'plan'];
    protected $casts = ['matches_reset_at' => 'datetime'];
    public function profile(): HasOne { return $this->hasOne(Profile::class); }
    public function documents(): HasMany { return $this->hasMany(Document::class); }
    public function deals() {
        return Deal::where('event_user_id', $this->id)->orWhere('sponsor_user_id', $this->id);
    }
    /** Kuota matching Free direset tiap bulan. */
    public function refreshQuota(): void {
        if (!$this->matches_reset_at || $this->matches_reset_at->lt(now()->startOfMonth())) {
            $this->update(['matches_used' => 0, 'matches_reset_at' => now()]);
        }
    }
}
