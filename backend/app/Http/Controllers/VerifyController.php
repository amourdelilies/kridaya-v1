<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class VerifyController extends Controller
{
    public function show($code)
    {
        return view('verify', compact('code'));
    }
}