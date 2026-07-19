<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function search(Request $request)
    {
        $name = $request->input('name');

        $results = DB::table('users')
            ->whereRaw('name = ' . $name)
            ->get();

        return response()->json($results);
    }
}
