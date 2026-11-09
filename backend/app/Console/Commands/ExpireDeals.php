<?php
namespace App\Console\Commands;
use App\Models\Deal;
use Illuminate\Console\Command;

class ExpireDeals extends Command {
    protected $signature = 'kridaya:expire-deals';
    protected $description = 'Tandai minat yang melewati 24 jam sebagai kedaluwarsa';
    public function handle(): int {
        $n = Deal::where('status','pending')->where('expires_at','<',now())->update(['status'=>'expired']);
        $this->info("$n deal kedaluwarsa"); return self::SUCCESS;
    }
}
