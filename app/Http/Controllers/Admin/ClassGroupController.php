<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClassGroupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/AcademicGroups/Index', [
            'programs' => Program::query()->orderBy('name')->get(['id', 'code', 'name', 'degree_level', 'duration_years']),
            'academicYears' => AcademicYear::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'groups' => ClassGroup::query()
                ->with(['program:id,code,name', 'academicYear:id,name'])
                ->withCount('enrollments')
                ->orderByDesc('academic_year_id')
                ->orderBy('level_code')
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function show(ClassGroup $classGroup): Response
    {
        $classGroup->load(['program:id,code,name', 'academicYear:id,name']);

        $students = $classGroup->enrollments()
            ->with(['student.user'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Enrollment $enrollment) {
                $student = $enrollment->student;

                return [
                    'id' => $student?->id,
                    'name' => trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')),
                    'registration_number' => $student?->registration_number,
                    'email' => $student?->email,
                ];
            })
            ->values();

        $matchingGroups = ClassGroup::query()
            ->where('program_id', $classGroup->program_id)
            ->where('academic_year_id', $classGroup->academic_year_id)
            ->where('level_code', $classGroup->level_code)
            ->whereKeyNot($classGroup->id)
            ->withCount('enrollments')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'capacity', 'level_code']);

        return Inertia::render('Admin/AcademicGroups/Show', [
            'group' => $classGroup,
            'students' => $students,
            'matchingGroups' => $matchingGroups,
        ]);
    }

    public function moveStudent(Request $request, ClassGroup $classGroup, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'new_group_id' => ['required', 'exists:classes,id'],
        ]);

        if ($data['new_group_id'] === $classGroup->id) {
            throw ValidationException::withMessages([
                'new_group_id' => 'Le groupe de destination doit être différent du groupe actuel.',
            ]);
        }

        $newGroup = ClassGroup::query()->lockForUpdate()->findOrFail($data['new_group_id']);
        $enrollment = $student->enrollments()->where('class_id', $classGroup->id)->latest('id')->first();

        abort_unless($enrollment, 404, 'Cet étudiant n’est pas inscrit dans ce groupe.');

        if ($newGroup->program_id !== $classGroup->program_id
            || (int) $newGroup->academic_year_id !== (int) $classGroup->academic_year_id
            || $newGroup->level_code !== $classGroup->level_code) {
            throw ValidationException::withMessages([
                'new_group_id' => 'Le groupe de destination doit correspondre à la même filière, année et niveau.',
            ]);
        }

        $occupiedSeats = $newGroup->enrollments()->whereKeyNot($enrollment->id)->count();
        if ($occupiedSeats >= $newGroup->capacity) {
            throw ValidationException::withMessages([
                'new_group_id' => 'Ce groupe a atteint sa capacité maximale.',
            ]);
        }

        $enrollment->update(['class_id' => $newGroup->id]);

        return redirect()->route('admin.academic-groups.show', $classGroup)
            ->with('success', 'L’étudiant a été déplacé vers le groupe ' . $newGroup->code . '.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'level_code' => ['required', 'regex:/^(L[1-7]|M[1-2]|D[1-3])$/'],
            'code' => ['required', 'string', 'max:20', 'alpha_dash'],
            'name' => ['required', 'string', 'max:100'],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
        ]);

        $request->validate([
            'code' => [Rule::unique('classes', 'code')
                ->where('program_id', $data['program_id'])
                ->where('academic_year_id', $data['academic_year_id'])
                ->where('level_code', strtoupper($data['level_code']))],
        ]);

        $program = Program::findOrFail($data['program_id']);
        abort_unless($this->levelMatchesProgram($data['level_code'], $program->degree_level, $program->duration_years), 422, 'Le niveau choisi ne correspond pas au diplôme de la filière.');

        ClassGroup::create([
            ...$data,
            'code' => strtoupper($data['code']),
            'level_code' => strtoupper($data['level_code']),
            'level' => (int) preg_replace('/\D/', '', $data['level_code']),
        ]);

        return redirect()->route('admin.academic-groups.index')->with('success', 'Groupe pédagogique créé.');
    }

    public function destroy(ClassGroup $classGroup): RedirectResponse
    {
        if ($classGroup->enrollments()->exists()) {
            return back()->withErrors(['group' => 'Ce groupe contient des étudiants inscrits et ne peut pas être supprimé.']);
        }

        $classGroup->delete();

        return back()->with('success', 'Groupe pédagogique supprimé.');
    }

    private function levelMatchesProgram(string $level, string $degree, int $duration): bool
    {
        $prefix = match ($degree) {
            'LICENCE' => 'L',
            'MASTER' => 'M',
            'DOCTORAT' => 'D',
            'DUT' => 'L',
            default => '',
        };

        return $prefix !== ''
            && str_starts_with(strtoupper($level), $prefix)
            && (int) substr($level, 1) <= $duration;
    }
}
