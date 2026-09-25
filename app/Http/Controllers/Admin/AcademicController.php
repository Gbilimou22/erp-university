<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class AcademicController extends Controller
{
    public function index(): Response
    {
        $campuses = DB::table('campuses')->orderBy('name')->get();
        $faculties = DB::table('faculties')
            ->join('campuses', 'faculties.campus_id', '=', 'campuses.id')
            ->select('faculties.*', 'campuses.name as campus_name')
            ->orderBy('faculties.name')
            ->get();

        $departments = DB::table('departments')
            ->join('faculties', 'departments.faculty_id', '=', 'faculties.id')
            ->select('departments.*', 'faculties.name as faculty_name')
            ->orderBy('departments.name')
            ->get();

        $programs = DB::table('programs')
            ->join('departments', 'programs.department_id', '=', 'departments.id')
            ->select('programs.*', 'departments.name as department_name')
            ->orderBy('programs.name')
            ->get();

        return Inertia::render('Admin/Academic/Index', [
            'campuses' => $campuses,
            'faculties' => $faculties,
            'departments' => $departments,
            'programs' => $programs,
        ]);
    }

    public function storeCampus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:campuses,code',
            'name' => 'required|string|max:150',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string',
        ]);

        DB::table('campuses')->insert([
            'id' => Str::uuid(),
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'city' => $validated['city'],
            'address' => $validated['address'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Campus créé avec succès.');
    }

    public function storeFaculty(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'campus_id' => 'required|uuid|exists:campuses,id',
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:150',
        ]);

        DB::table('faculties')->insert([
            'id' => Str::uuid(),
            'campus_id' => $validated['campus_id'],
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Faculté créée avec succès.');
    }

    public function storeDepartment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'required|uuid|exists:faculties,id',
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:150',
        ]);

        DB::table('departments')->insert([
            'id' => Str::uuid(),
            'faculty_id' => $validated['faculty_id'],
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Département créé avec succès.');
    }

    public function storeProgram(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => 'required|uuid|exists:departments,id',
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:150',
            'degree_level' => 'required|in:LICENCE,MASTER,DOCTORAT,DUT',
            'duration_years' => 'required|integer|min:1|max:7',
        ]);

        DB::table('programs')->insert([
            'id' => Str::uuid(),
            'department_id' => $validated['department_id'],
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'degree_level' => $validated['degree_level'],
            'duration_years' => $validated['duration_years'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Filière créée avec succès.');
    }
}
