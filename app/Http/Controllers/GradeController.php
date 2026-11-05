<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Curriculum;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $teacher = $request->user();
        $academicYear = AcademicYear::where('is_current', true)->first();

        if (! $academicYear) {
            return Inertia::render('Teacher/Grades/Index', [
                'academicYear' => null,
                'subjects' => [],
                'departments' => [],
                'selectedSubjectId' => null,
                'selectedDepartmentId' => null,
                'students' => [],
                'grades' => [],
            ]);
        }

        $subjects = $teacher->taughtSubjects()
            ->wherePivot('academic_year_id', $academicYear->id)
            ->with('courseUnit:id,faculty_id,code,name')
            ->orderBy('name')
            ->get(['subjects.id', 'subjects.course_unit_id', 'subjects.department_id', 'subjects.code', 'subjects.name']);

        $subjectId = $request->integer('subject_id') ?: null;
        $selectedSubject = $subjectId
            ? $subjects->firstWhere('id', $subjectId)
            : $subjects->first();

        $eligibleProgramIds = $selectedSubject
            ? $this->eligibleProgramIds($selectedSubject, (int) $academicYear->id)
            : [];
        $departments = $eligibleProgramIds === []
            ? collect()
            : Department::query()
                ->whereHas('programs', fn ($query) => $query->whereIn('programs.id', $eligibleProgramIds))
                ->orderBy('name')
                ->get(['id', 'code', 'name']);
        $requestedDepartmentId = $request->integer('department_id') ?: null;
        $selectedDepartmentId = $departments->contains('id', $requestedDepartmentId)
            ? $requestedDepartmentId
            : $departments->first()?->id;

        $students = $selectedSubject
            ? Enrollment::query()
                ->with('student:id,registration_number,first_name,last_name')
                ->where('academic_year_id', $academicYear->id)
                ->where('status', 'active')
                ->whereIn('program_id', $eligibleProgramIds)
                ->whereHas('program', fn ($query) => $query->where('department_id', $selectedDepartmentId))
                ->whereHas('student')
                ->orderBy('id')
                ->get(['id', 'student_id', 'program_id', 'class_id', 'level'])
                ->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'level' => $enrollment->level,
                    'student' => $enrollment->student,
                ])
            : collect();

        $grades = $selectedSubject
            ? Grade::query()
                ->with('enrollment.student:id,registration_number,first_name,last_name', 'enteredBy:id,name')
                ->where('subject_id', $selectedSubject->id)
                ->whereHas('enrollment', fn ($query) => $query
                    ->where('academic_year_id', $academicYear->id)
                    ->where('status', 'active')
                    ->whereIn('program_id', $eligibleProgramIds)
                    ->whereHas('program', fn ($query) => $query->where('department_id', $selectedDepartmentId)))
                ->latest('updated_at')
                ->get()
            : collect();

        return Inertia::render('Teacher/Grades/Index', [
            'academicYear' => $academicYear->only(['id', 'name']),
            'subjects' => $subjects,
            'departments' => $departments,
            'selectedSubjectId' => $selectedSubject?->id,
            'selectedDepartmentId' => $selectedDepartmentId,
            'students' => $students,
            'grades' => $grades,
        ]);
    }

    public function store(Request $request)
    {
        $teacher = $request->user();
        $academicYear = AcademicYear::where('is_current', true)->firstOrFail();

        $subject = Subject::query()
            ->whereKey($request->integer('subject_id'))
            ->whereHas('teacherAssignments', fn ($query) => $query
                ->where('teacher_id', $teacher->id)
                ->where('academic_year_id', $academicYear->id))
            ->with('courseUnit:id,faculty_id')
            ->firstOrFail();
        $eligibleProgramIds = $this->eligibleProgramIds($subject, (int) $academicYear->id);
        $eligibleDepartmentIds = $eligibleProgramIds === []
            ? []
            : Department::query()
                ->whereHas('programs', fn ($query) => $query->whereIn('programs.id', $eligibleProgramIds))
                ->pluck('id')
                ->all();

        $validated = $request->validate([
            'subject_id' => ['required', 'integer', Rule::in([$subject->id])],
            'department_id' => ['required', 'integer', Rule::in($eligibleDepartmentIds)],
            'enrollment_id' => ['required', 'integer', Rule::exists('enrollments', 'id')->where(fn ($query) => $query
                ->where('academic_year_id', $academicYear->id)
                ->where('status', 'active')
                ->whereIn('program_id', $eligibleProgramIds))],
            'assessment_label' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['cc', 'exam', 'rattrapage'])],
            'score' => ['required', 'numeric', 'min:0', 'max:10'],
        ]);

        $enrollmentBelongsToDepartment = Enrollment::query()
            ->whereKey($validated['enrollment_id'])
            ->whereHas('program', fn ($query) => $query->where('department_id', $validated['department_id']))
            ->exists();

        if (! $enrollmentBelongsToDepartment) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'enrollment_id' => 'Choisissez un étudiant inscrit dans le département sélectionné.',
            ]);
        }

        $assessmentLabel = trim($validated['assessment_label']);
        if ($assessmentLabel === '') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'assessment_label' => 'Le nom de l’évaluation est obligatoire.',
            ]);
        }

        $existingGrade = Grade::query()
            ->where('enrollment_id', $validated['enrollment_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('type', $validated['type'])
            ->where('assessment_label', $assessmentLabel)
            ->first();

        if ($existingGrade?->status === 'published') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'score' => 'Cette note est publiée. Contactez l’administration pour demander une rectification.',
            ]);
        }

        $grade = Grade::updateOrCreate(
            [
                'enrollment_id' => $validated['enrollment_id'],
                'subject_id' => $validated['subject_id'],
                'type' => $validated['type'],
                'assessment_label' => $assessmentLabel,
            ],
            [
                'score' => $validated['score'],
                'entered_by' => $teacher->id,
                'status' => 'draft',
            ]
        );

        return back()->with('success', 'Note enregistrée.')->with('grade_id', $grade->id);
    }

    /** @return list<int|string> */
    private function eligibleProgramIds(Subject $subject, int $academicYearId): array
    {
        if (! $subject->courseUnit) {
            return [];
        }

        return Curriculum::query()
            ->where('academic_year_id', $academicYearId)
            ->whereHas('program.department', function ($query) use ($subject) {
                $query->where('faculty_id', $subject->courseUnit->faculty_id);
                if ($subject->department_id) {
                    $query->whereKey($subject->department_id);
                }
            })
            ->whereHas('semesters.courseUnits', fn ($query) => $query->where('course_units.id', $subject->course_unit_id))
            ->distinct()
            ->pluck('program_id')
            ->all();
    }
}
