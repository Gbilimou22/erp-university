<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\AuditEvent;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Student;
use App\Models\StudentFee;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Student::class);

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
        $this->authorize('create', Student::class);

        return Inertia::render('Admin/Students/Create', [
            'departments' => Department::with(['faculty:id,name', 'programs:id,department_id,name,code'])->orderBy('name')->get(['id', 'faculty_id', 'name', 'code']),
            'academicYears' => AcademicYear::select('id', 'name', 'is_current')->orderByDesc('start_date')->get(),
            'currentYear' => AcademicYear::where('is_current', true)->first(['id', 'name']),
            'groups' => ClassGroup::query()->withCount('enrollments')->orderBy('code')->get(['id', 'program_id', 'academic_year_id', 'level_code', 'code', 'name', 'capacity']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Student::class);

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
            'class_id' => ['nullable', 'exists:classes,id'],
            'fees.registration.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'fees.registration.due_date' => ['required', 'date', 'after_or_equal:today'],
            'fees.tuition.0.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'fees.tuition.0.due_date' => ['required', 'date', 'after_or_equal:today'],
            'fees.tuition.1.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'fees.tuition.1.due_date' => ['required', 'date', 'after:fees.tuition.0.due_date'],
            'fees.tuition.2.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'fees.tuition.2.due_date' => ['required', 'date', 'after:fees.tuition.1.due_date'],
        ]);

        $department = Department::with('faculty')->findOrFail($validated['department_id']);
        Program::whereKey($validated['program_id'])
            ->where('department_id', $department->id)
            ->firstOrFail();

        $temporaryPassword = Str::password(16, true, true, false);

        $student = DB::transaction(function () use ($validated, $department, $temporaryPassword) {
            $classGroup = null;
            if (!empty($validated['class_id'])) {
                $classGroup = ClassGroup::query()->lockForUpdate()->findOrFail($validated['class_id']);
                    if (!(
                    (string) $classGroup->program_id === (string) $validated['program_id']
                    && (int) $classGroup->academic_year_id === (int) $validated['academic_year_id']
                        && $classGroup->level_code === strtoupper($validated['level'])
                    )) {
                        throw ValidationException::withMessages(['class_id' => 'Le groupe ne correspond pas à la filière, l’année et au niveau sélectionnés.']);
                    }
                if ($classGroup->enrollments()->count() >= $classGroup->capacity) {
                        throw ValidationException::withMessages(['class_id' => 'Ce groupe a atteint sa capacité maximale.']);
                }
            }
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

            $enrollment = Enrollment::create([
                'student_id' => $student->id,
                'faculty_id' => $department->faculty_id,
                'program_id' => $validated['program_id'],
                'class_id' => $classGroup?->id,
                'academic_year_id' => $validated['academic_year_id'],
                'level' => $validated['level'],
                'status' => 'pending',
            ]);

            StudentFee::create([
                'enrollment_id' => $enrollment->id,
                'title' => 'Frais d’inscription',
                'fee_type' => 'registration',
                'amount' => $validated['fees']['registration']['amount'],
                'due_date' => $validated['fees']['registration']['due_date'],
            ]);
            foreach ($validated['fees']['tuition'] as $index => $installment) {
                StudentFee::create([
                    'enrollment_id' => $enrollment->id,
                    'title' => 'Frais de scolarité — Tranche '.($index + 1),
                    'fee_type' => 'tuition',
                    'installment_number' => $index + 1,
                    'amount' => $installment['amount'],
                    'due_date' => $installment['due_date'],
                ]);
            }

            AuditEvent::create([
                'actor_id' => request()->user()?->id,
                'action' => 'student.enrolled',
                'auditable_type' => Student::class,
                'auditable_id' => $student->id,
                'after' => [
                    'registration_number' => $student->registration_number,
                    'department_id' => $department->id,
                    'program_id' => $validated['program_id'],
                    'academic_year_id' => $validated['academic_year_id'],
                    'level' => $validated['level'],
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
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
        $this->authorize('view', $student);

        $student->load(['user', 'department.faculty', 'enrollments.academicYear', 'enrollments.program']);
        return Inertia::render('Admin/Students/Show', ['student' => $student]);
    }

    public function edit(Student $student): Response
    {
        $this->authorize('update', $student);

        $student->load(['department', 'enrollments' => fn ($query) => $query->latest('id')->limit(1), 'enrollments.program', 'enrollments.academicYear', 'enrollments.classGroup']);

        return Inertia::render('Admin/Students/Edit', [
            'student' => $student,
            'departments' => Department::with(['faculty:id,name', 'programs:id,department_id,name,code'])->orderBy('name')->get(['id', 'faculty_id', 'name', 'code']),
            'academicYears' => AcademicYear::select('id', 'name', 'is_current')->orderByDesc('start_date')->get(),
            'groups' => ClassGroup::query()->withCount('enrollments')->orderBy('code')->get(['id', 'program_id', 'academic_year_id', 'level_code', 'code', 'name', 'capacity']),
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $this->authorize('update', $student);
        $enrollment = $student->enrollments()->latest('id')->firstOrFail();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('students', 'email')->ignore($student->id), Rule::unique('users', 'email')->ignore($student->user_id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:M,F'],
            'department_id' => ['required', 'exists:departments,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'level' => ['required', 'regex:/^(L[1-7]|M[1-2]|D[1-3])$/'],
            'class_id' => ['nullable', 'exists:classes,id'],
        ]);

        $department = Department::with('faculty')->findOrFail($validated['department_id']);
        $program = Program::whereKey($validated['program_id'])->where('department_id', $department->id)->firstOrFail();

        DB::transaction(function () use ($validated, $student, $enrollment, $department, $program): void {
            $classGroup = null;
            if (!empty($validated['class_id'])) {
                $classGroup = ClassGroup::query()->lockForUpdate()->findOrFail($validated['class_id']);
                if ((string) $classGroup->program_id !== (string) $program->id
                    || (int) $classGroup->academic_year_id !== (int) $validated['academic_year_id']
                    || $classGroup->level_code !== strtoupper($validated['level'])) {
                    throw ValidationException::withMessages(['class_id' => 'Le groupe ne correspond pas à la filière, l’année et au niveau sélectionnés.']);
                }
                $currentGroupOccupancy = $classGroup->enrollments()->whereKeyNot($enrollment->id)->count();
                if ($currentGroupOccupancy >= $classGroup->capacity) {
                    throw ValidationException::withMessages(['class_id' => 'Ce groupe a atteint sa capacité maximale.']);
                }
            }

            $before = ['student' => $student->only(['first_name', 'last_name', 'email', 'phone', 'department_id', 'status']), 'enrollment' => $enrollment->only(['program_id', 'academic_year_id', 'level', 'class_id'])];
            $student->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'department_id' => $department->id,
            ]);
            $student->user?->update(['name' => trim($validated['first_name'].' '.$validated['last_name']), 'email' => $validated['email']]);
            $enrollment->update([
                'faculty_id' => $department->faculty_id,
                'program_id' => $program->id,
                'academic_year_id' => $validated['academic_year_id'],
                'level' => strtoupper($validated['level']),
                'class_id' => $classGroup?->id,
            ]);

            AuditEvent::create([
                'actor_id' => request()->user()?->id,
                'action' => 'student.updated',
                'auditable_type' => Student::class,
                'auditable_id' => $student->id,
                'before' => $before,
                'after' => ['student' => $student->fresh()->only(['first_name', 'last_name', 'email', 'phone', 'department_id', 'status']), 'enrollment' => $enrollment->fresh()->only(['program_id', 'academic_year_id', 'level', 'class_id'])],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return redirect()->route('admin.students.show', $student)->with('success', 'Dossier étudiant modifié.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $this->authorize('delete', $student);

        DB::transaction(function () use ($student): void {
            $student->update(['status' => 'archived']);
            $student->user?->update(['is_active' => false]);

            AuditEvent::create([
                'actor_id' => request()->user()?->id,
                'action' => 'student.archived',
                'auditable_type' => Student::class,
                'auditable_id' => $student->id,
                'before' => ['status' => 'active'],
                'after' => ['status' => 'archived', 'account_disabled' => true],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return redirect()->route('admin.students.index')->with('success', 'Étudiant archivé; son historique académique est conservé.');
    }
}
