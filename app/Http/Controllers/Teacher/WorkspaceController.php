<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\SubjectTeacherAssignment;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function subjects(Request $request): Response
    {
        $year = AcademicYear::where('is_current', true)->first();
        $subjects = $year
            ? $request->user()->taughtSubjects()->wherePivot('academic_year_id', $year->id)
                ->with('courseUnit:id,code,name')->withCount('grades')->orderBy('name')
                ->get(['subjects.id', 'subjects.course_unit_id', 'subjects.code', 'subjects.name', 'subjects.coefficient'])
            : collect();

        return Inertia::render('Teacher/Subjects/Index', [
            'academicYear' => $year?->only(['id', 'name']),
            'subjects' => $subjects,
        ]);
    }

    public function groups(Request $request): Response
    {
        $year = AcademicYear::where('is_current', true)->first();
        $groups = $year
            ? ClassGroup::query()->with(['program:id,name', 'enrollments' => fn ($query) => $query
                ->where('academic_year_id', $year->id)->where('status', 'active')
                ->with('student:id,registration_number,first_name,last_name,email')])
                ->where('academic_year_id', $year->id)
                ->whereIn('id', TimetableEntry::query()->whereHas('assignment', fn ($query) => $query
                    ->where('teacher_id', $request->user()->id)->where('academic_year_id', $year->id))
                    ->whereNotNull('class_id')->select('class_id'))
                ->orderBy('name')->get()
                ->map(fn (ClassGroup $group) => [
                    'id' => $group->id,
                    'code' => $group->code,
                    'name' => $group->name,
                    'level_code' => $group->level_code,
                    'program' => $group->program?->name,
                    'students' => $group->enrollments->map(fn ($enrollment) => $enrollment->student?->only(['registration_number', 'first_name', 'last_name', 'email']))->filter()->values(),
                ])
            : collect();

        return Inertia::render('Teacher/Groups/Index', [
            'academicYear' => $year?->only(['id', 'name']),
            'groups' => $groups,
        ]);
    }
}
