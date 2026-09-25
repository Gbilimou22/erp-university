<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Student;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Student::query()->with(['user', 'department.faculty', 'enrollments.academicYear', 'enrollments.program']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($students) use ($search) {
                $students->where('registration_number', 'ilike', "%{$search}%")
                    ->orWhere('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('faculty_id')) {
            $query->whereHas('department.faculty', fn ($faculty) => $faculty->whereKey($request->input('faculty_id')));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->input('department_id'));
        }

        if ($request->filled('academic_year_id')) {
            $query->whereHas('enrollments', fn ($enrollments) => $enrollments->where('academic_year_id', $request->input('academic_year_id')));
        }

        if ($request->filled('program_id')) {
            $query->whereHas('enrollments', fn ($enrollments) => $enrollments->where('program_id', $request->input('program_id')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return Inertia::render('Admin/Students/Index', [
            'students' => $query->orderByDesc('created_at')->paginate(15)->withQueryString(),
            'faculties' => Faculty::select('id', 'name', 'code')->orderBy('name')->get(),
            'departments' => Department::select('id', 'faculty_id', 'name', 'code')->orderBy('name')->get(),
            'academicYears' => AcademicYear::select('id', 'name')->orderByDesc('start_date')->get(),
            'programs' => Program::select('id', 'name', 'code', 'department_id')->orderBy('name')->get(),
            'filters' => $request->only(['search', 'faculty_id', 'department_id', 'program_id', 'academic_year_id', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Students/Create', [
            'departments' => Department::with(['faculty:id,name', 'programs:id,department_id,name,code'])->orderBy('name')->get(['id', 'faculty_id', 'name', 'code']),
            'academicYears' => AcademicYear::select('id', 'name', 'is_current')->orderByDesc('start_date')->get(),
            'currentYear' => AcademicYear::where('is_current', true)->first(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentYearId = AcademicYear::where('is_current', true)->value('id');
        if (!$request->filled('academic_year_id') && $currentYearId) {
            $request->merge(['academic_year_id' => $currentYearId]);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:students,email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:M,F'],
            'department_id' => ['required', 'exists:departments,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'level' => ['required', 'regex:/^(L[1-7]|M[1-2]|D[1-3])$/'],
        ]);

        $department = Department::with('faculty')->findOrFail($validated['department_id']);
        Program::whereKey($validated['program_id'])
            ->where('department_id', $department->id)
            ->firstOrFail();

        $temporaryPassword = Str::password(16, true, true, false);

        $student = DB::transaction(function () use ($validated, $department, $temporaryPassword) {
            $user = User::create([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make($temporaryPassword),
                'role' => 'student',
                'is_active' => true,
                'must_change_password' => true,
            ]);

            $year = now()->year;
            $lastNumber = Student::where('registration_number', 'like', "UNIV-{$year}-%")
                ->lockForUpdate()
                ->orderByDesc('registration_number')
                ->value('registration_number');
            $sequence = $lastNumber ? ((int) substr($lastNumber, -6)) + 1 : 1;

            $student = Student::create([
                'user_id' => $user->id,
                'department_id' => $department->id,
                'registration_number' => sprintf('UNIV-%d-%06d', $year, $sequence),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'gender' => $validated['gender'],
                'birth_date' => $validated['birth_date'],
                'status' => 'active',
            ]);

            Enrollment::create([
                'student_id' => $student->id,
                'faculty_id' => $department->faculty_id,
                'program_id' => $validated['program_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'level' => $validated['level'],
                'status' => 'active',
            ]);

            return $student;
        });

        return redirect()->route('admin.students.show', $student)
            ->with('success', "Étudiant inscrit. Matricule : {$student->registration_number}")
            ->with('temporaryCredentials', [
                'email' => $student->email,
                'password' => $temporaryPassword,
            ]);
    }

    public function show(Student $student): Response
    {
        $student->load(['user', 'department.faculty', 'enrollments.academicYear', 'enrollments.program']);

        return Inertia::render('Admin/Students/Show', ['student' => $student]);
    }
}
