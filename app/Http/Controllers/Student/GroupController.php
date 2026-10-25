<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function show(): Response
    {
        $student = request()->user()?->student;
        $enrollment = $student?->enrollments()
            ->with(['program:id,code,name,degree_level', 'academicYear:id,name', 'classGroup:id,program_id,academic_year_id,level_code,code,name,capacity'])
            ->latest('id')
            ->first();

        return Inertia::render('Student/Group', [
            'studentName' => $student ? trim($student->first_name.' '.$student->last_name) : null,
            'enrollment' => $enrollment ? [
                'level' => $enrollment->level,
                'program' => $enrollment->program?->only(['code', 'name', 'degree_level']),
                'academicYear' => $enrollment->academicYear?->only(['name']),
                'group' => $enrollment->classGroup?->only(['code', 'name', 'level_code', 'capacity']),
            ] : null,
        ]);
    }
}
