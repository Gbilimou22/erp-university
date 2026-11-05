<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function index(): Response
    {
        $student = request()->user()->student()->first();
        $grades = $student
            ? Grade::query()
                ->with(['subject:id,code,name', 'enrollment.academicYear:id,name'])
                ->where('status', 'published')
                ->whereHas('enrollment', fn ($query) => $query->where('student_id', $student->id))
                ->orderByDesc('published_at')
                ->get(['id', 'enrollment_id', 'subject_id', 'score', 'type', 'assessment_label', 'published_at'])
            : collect();

        return Inertia::render('Student/Grades/Index', ['grades' => $grades]);
    }
}
