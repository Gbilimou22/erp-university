<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Student;
use App\Models\TimetableEntry;
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
                ->paginate(20)
                ->withQueryString(),
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

        $availableStudents = Enrollment::query()
            ->with('student:id,registration_number,first_name,last_name,email')
            ->where('program_id', $classGroup->program_id)
            ->where('academic_year_id', $classGroup->academic_year_id)
            ->where('level', $classGroup->level_code)
            ->where('status', 'active')
            ->whereNull('class_id')
            ->orderBy('id')
            ->get(['id', 'student_id'])
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->student?->id,
                'registration_number' => $enrollment->student?->registration_number,
                'name' => trim(($enrollment->student?->first_name ?? '') . ' ' . ($enrollment->student?->last_name ?? '')),
                'email' => $enrollment->student?->email,
            ])
            ->filter(fn (array $student) => $student['id'] !== null)
            ->values();

        $roomAssignments = TimetableEntry::query()
            ->with(['room:id,campus_id,code,name', 'room.campus:id,name', 'assignment.subject:id,code,name', 'assignment.teacher:id,name'])
            ->where('class_id', $classGroup->id)
            ->whereHas('assignment', fn ($query) => $query->where('academic_year_id', $classGroup->academic_year_id))
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Admin/AcademicGroups/Show', [
            'group' => $classGroup,
            'students' => $students,
            'matchingGroups' => $matchingGroups,
            'availableStudents' => $availableStudents,
            'roomAssignments' => $roomAssignments,
        ]);
    }

    public function assignStudent(Request $request, ClassGroup $classGroup, Student $student): RedirectResponse
    {
        DB::transaction(function () use ($classGroup, $student) {
            $group = ClassGroup::query()->whereKey($classGroup->id)->lockForUpdate()->firstOrFail();
            $enrollment = Enrollment::query()
                ->where('student_id', $student->id)
                ->where('program_id', $group->program_id)
                ->where('academic_year_id', $group->academic_year_id)
                ->where('level', $group->level_code)
                ->where('status', 'active')
                ->whereNull('class_id')
                ->lockForUpdate()
                ->first();

            if (! $enrollment) {
                throw ValidationException::withMessages([
                    'student_id' => 'Aucune inscription active sans groupe ne correspond à cette filière, année et niveau.',
                ]);
            }

            if ($group->enrollments()->count() >= $group->capacity) {
                throw ValidationException::withMessages([
                    'student_id' => 'Ce groupe a atteint sa capacité maximale.',
                ]);
            }

            $enrollment->update(['class_id' => $group->id]);
        });

        return redirect()->route('admin.academic-groups.show', $classGroup)
            ->with('success', 'L’étudiant a été affecté au groupe ' . $classGroup->code . '.');
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

        $newGroupId = $data['new_group_id'];
        $newGroup = DB::transaction(function () use ($classGroup, $student, $newGroupId) {
            $groups = ClassGroup::query()
                ->whereIn('id', [$classGroup->id, $newGroupId])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $sourceGroup = $groups->get($classGroup->id);
            $destinationGroup = $groups->get($newGroupId);
            abort_unless($sourceGroup && $destinationGroup, 404);

            $enrollment = $student->enrollments()
                ->where('class_id', $sourceGroup->id)
                ->where('academic_year_id', $sourceGroup->academic_year_id)
                ->latest('id')
                ->lockForUpdate()
                ->first();
            abort_unless($enrollment, 404, 'Cet étudiant n’est pas inscrit dans ce groupe pour cette année.');

            if ($destinationGroup->program_id !== $sourceGroup->program_id
                || (int) $destinationGroup->academic_year_id !== (int) $sourceGroup->academic_year_id
                || $destinationGroup->level_code !== $sourceGroup->level_code) {
                throw ValidationException::withMessages([
                    'new_group_id' => 'Le groupe de destination doit correspondre à la même filière, année et niveau.',
                ]);
            }

            if ($destinationGroup->enrollments()->whereKeyNot($enrollment->id)->count() >= $destinationGroup->capacity) {
                throw ValidationException::withMessages([
                    'new_group_id' => 'Ce groupe a atteint sa capacité maximale.',
                ]);
            }

            $enrollment->update(['class_id' => $destinationGroup->id]);

            return $destinationGroup;
        });

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
