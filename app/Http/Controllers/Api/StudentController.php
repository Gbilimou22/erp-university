<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Student::query()
                ->with(['department.faculty', 'enrollments.academicYear'])
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->paginate(20),
        ]);
    }

    public function show(Student $student): JsonResponse
    {
        return response()->json([
            'data' => $student->load(['user', 'department.faculty', 'enrollments.academicYear']),
        ]);
    }
}
