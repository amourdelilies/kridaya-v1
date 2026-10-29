<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Fulfillment extends Model {
    protected $fillable = ['deal_id','user_id','kind','title','note','path','value','file_name','verified_at'];
    protected $casts = ['verified_at' => 'datetime'];
}
