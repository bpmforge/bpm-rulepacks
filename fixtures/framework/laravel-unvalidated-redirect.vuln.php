<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RedirectController extends Controller
{
    public function go(Request $request)
    {
        return redirect($request->input('next'));
    }
}
