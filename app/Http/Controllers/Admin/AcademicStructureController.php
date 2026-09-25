<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Faculty;
use App\Models\Department;
use App\Models\Course;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class AcademicStructureController extends Controller
{
    /**
     * Vue d'ensemble de la structure académique.
     */
    public function index()
    {
        $campuses = Campus::with(['faculties.departments.courses', 'faculties.departments.programs'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Academic/Index', [
            'campuses' => $campuses,
        ]);
    }

    // ==========================================
    // CAMPUS
    // ==========================================

    public function storeCampus(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:campuses,code',
            'name' => 'required|string|max:150',
            'address' => 'nullable|string|max:255',
        ]);

        Campus::create($validated);

        return back()->with('success', 'Campus ajouté avec succès.');
    }

    public function updateCampus(Request $request, Campus $campus)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('campuses', 'code')->ignore($campus->id)],
            'name' => 'required|string|max:150',
            'address' => 'nullable|string|max:255',
        ]);

        $campus->update($validated);

        return back()->with('success', 'Campus mis à jour.');
    }

    public function destroyCampus(Campus $campus)
    {
        if ($campus->faculties()->exists()) {
            return back()->withErrors(['campus' => 'Déplacez ou archivez d’abord les facultés de ce campus.']);
        }

        $campus->delete();

        return back()->with('success', 'Campus supprimé.');
    }

    // ==========================================
    // FACULTÉS / UFR
    // ==========================================

    public function storeFaculty(Request $request)
    {
        $validated = $request->validate([
            'campus_id' => 'required|exists:campuses,id',
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('faculties', 'code')->where('campus_id', $request->campus_id)
            ],
            'name' => 'required|string|max:150',
        ]);

        Faculty::create($validated);

        return back()->with('success', 'Faculté ajoutée avec succès.');
    }

    public function updateFaculty(Request $request, Faculty $faculty)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('faculties', 'code')->where('campus_id', $faculty->campus_id)->ignore($faculty->id)
            ],
            'name' => 'required|string|max:150',
        ]);

        $faculty->update($validated);

        return back()->with('success', 'Faculté mise à jour.');
    }

    public function destroyFaculty(Faculty $faculty)
    {
        if ($faculty->departments()->exists() || $faculty->enrollments()->exists() || $faculty->courseUnits()->exists()) {
            return back()->withErrors(['faculty' => 'Cette faculté contient des données académiques et ne peut pas être supprimée.']);
        }

        $faculty->delete();

        return back()->with('success', 'Faculté supprimée.');
    }

    // ==========================================
    // DÉPARTEMENTS
    // ==========================================

    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'faculty_id' => 'required|exists:faculties,id',
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('departments', 'code')->where('faculty_id', $request->faculty_id)
            ],
            'name' => 'required|string|max:150',
        ]);

        Department::create($validated);

        return back()->with('success', 'Département ajouté avec succès.');
    }

    public function updateDepartment(Request $request, Department $department)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('departments', 'code')->where('faculty_id', $department->faculty_id)->ignore($department->id)
            ],
            'name' => 'required|string|max:150',
        ]);

        $department->update($validated);

        return back()->with('success', 'Département mis à jour.');
    }

    public function destroyDepartment(Department $department)
    {
        if ($department->courses()->exists() || $department->programs()->exists() || $department->students()->exists()) {
            return back()->withErrors(['department' => 'Ce département contient des cours, filières ou étudiants et ne peut pas être supprimé.']);
        }

        $department->delete();

        return back()->with('success', 'Département supprimé.');
    }

    // ==========================================
    // FILIÈRES / COURS
    // ==========================================

    public function storeCourse(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('courses', 'code')->where('department_id', $request->department_id)
            ],
            'name' => 'required|string|max:150',
        ]);

        Course::create($validated);

        return back()->with('success', 'Filière/Cours ajouté avec succès.');
    }

    public function destroyCourse(Course $course)
    {
        $course->delete();

        return back()->with('success', 'Filière/Cours supprimé.');
    }

    public function storeProgram(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', Rule::unique('programs', 'code')->where('department_id', $request->input('department_id'))],
            'name' => ['required', 'string', 'max:150'],
            'degree_level' => ['required', 'in:LICENCE,MASTER,DOCTORAT,DUT'],
            'duration_years' => ['required', 'integer', 'min:1', 'max:8'],
        ]);

        Program::create([...$validated, 'code' => strtoupper($validated['code'])]);

        return back()->with('success', 'Filière ajoutée avec succès.');
    }

    public function destroyProgram(Program $program)
    {
        if (DB::table('classes')->where('program_id', $program->id)->exists()
            || DB::table('enrollments')->where('program_id', $program->id)->exists()) {
            return back()->withErrors(['program' => 'Cette filière est utilisée par des classes ou des inscriptions et ne peut pas être supprimée.']);
        }

        $program->delete();

        return back()->with('success', 'Filière supprimée.');
    }
}
