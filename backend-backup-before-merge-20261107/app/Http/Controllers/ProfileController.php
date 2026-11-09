<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;

class ProfileController extends Controller {
    public function store(Request $r) {
        $u = $r->user();
        $v = $r->validate([
            'name'=>'required|string|max:150','category'=>'required|string|max:60','location'=>'required|string|max:60',
            'description'=>'required|string|max:2000','types'=>'nullable|array','extra'=>'nullable|array',
            'docs'=>'nullable|array','docs.*'=>'file|max:5120|mimes:pdf,jpg,jpeg,png,docx',
        ]);
        $p = $u->profile()->updateOrCreate([], collect($v)->except('docs')->all() + ['status'=>'pending']);
        foreach ($r->file('docs', []) as $type => $f) {
            $u->documents()->create(['type'=>$type, 'path'=>$f->store("docs/{$u->id}")]);
        }
        return $p;
    }
}
