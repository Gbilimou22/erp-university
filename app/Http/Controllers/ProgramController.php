<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProgramController extends Controller
{
    //
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id'  => 'required|exists:departments,id',
            'code'           => 'required|string|max:20|unique:programs,code',
            'name'           => 'required|string|max:150',
            'degree_level'   => 'required|in:LICENCE,MASTER,DOCTORAT,DUT',
            'duration_years' => 'required|integer|min:1|max:8',
        ]);

        Program::create($validated);

        return redirect()->back();
    }
}
