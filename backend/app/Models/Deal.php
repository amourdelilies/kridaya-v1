<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Deal extends Model {
    protected $fillable = ['event_user_id','sponsor_user_id','initiator_id','status','stage','expires_at','deadline_at','mou_at','event_signed_at','sponsor_signed_at','ended_at'];
    protected $casts = ['expires_at'=>'datetime','deadline_at'=>'datetime','mou_at'=>'datetime','event_signed_at'=>'datetime','sponsor_signed_at'=>'datetime','ended_at'=>'datetime'];
    public function event() { return $this->belongsTo(User::class, 'event_user_id')->with('profile'); }
    public function sponsor() { return $this->belongsTo(User::class, 'sponsor_user_id')->with('profile'); }
    public function messages() { return $this->hasMany(Message::class)->oldest(); }
    public function fulfillments() { return $this->hasMany(Fulfillment::class)->oldest(); }
}
