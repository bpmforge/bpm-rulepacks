<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RedirectController extends Controller
{
    private const ALLOWED_ROUTES = ['dashboard', 'profile', 'settings'];

    public function go(Request $request)
    {
        $target = $request->input('next');

        if (!in_array($target, self::ALLOWED_ROUTES, true)) {
            $target = 'dashboard';
        }

        return redirect()->route($target);
    }
}
