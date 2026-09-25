<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\Admin\AcademicStructureController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\AcademicYearController;
use App\Http\Controllers\Admin\TeachingController;
use App\Http\Controllers\Admin\TeacherController;
use App\Http\Controllers\Admin\TimetableController;
use App\Http\Controllers\Auth\FirstLoginPasswordController;
use App\Http\Middleware\RequirePasswordChange;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Portail Unifié (Accueil)
Route::get('/', [PortalController::class, 'index'])->name('portal.index');

// 2. Espaces Sécurisés
Route::middleware('auth')->prefix('first-login')->name('first-login.')->group(function () {
    Route::get('/password', [FirstLoginPasswordController::class, 'edit'])->name('password.edit');
    Route::put('/password', [FirstLoginPasswordController::class, 'update'])->name('password.update');
});

Route::middleware(['auth', 'verified', RequirePasswordChange::class])->group(function () {

    // --- DASHBOARD GÉNÉRAL DE REDIRECTION (/dashboard) ---
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $role = strtoupper($user->role ?? $user->user_type ?? 'ADMIN');

        return match ($role) {
            'STUDENT' => redirect()->route('student.dashboard'),
            'TEACHER' => redirect()->route('teacher.dashboard'),
            'PARENT'  => redirect()->route('parent.dashboard'),
            default   => redirect()->route('admin.dashboard'),
        };
    })->name('dashboard');

    // --- ESPACE ADMIN (/admin/...) ---
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {

        // Tableau de bord Admin
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::controller(TimetableController::class)->prefix('timetable')->name('timetable.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/rooms', 'storeRoom')->name('rooms.store');
            Route::delete('/rooms/{room}', 'destroyRoom')->name('rooms.destroy');
            Route::post('/entries', 'storeEntry')->name('entries.store');
            Route::delete('/entries/{entry}', 'destroyEntry')->name('entries.destroy');
        });

        Route::prefix('teaching')->name('teaching.')->controller(TeachingController::class)->group(function () {
            Route::get('/course-units', 'index')->name('index');
            Route::get('/assignments', 'assignments')->name('assignments');
            Route::post('/assignments', 'storeAssignment')->name('assignments.store');
            Route::delete('/assignments/{subject}/{teacher}', 'destroyAssignment')->name('assignments.destroy');
            Route::post('/course-units', 'storeCourseUnit')->name('course-units.store');
            Route::put('/course-units/{courseUnit}', 'updateCourseUnit')->name('course-units.update');
            Route::delete('/course-units/{courseUnit}', 'destroyCourseUnit')->name('course-units.destroy');
            Route::post('/subjects', 'storeSubject')->name('subjects.store');
            Route::put('/subjects/{subject}', 'updateSubject')->name('subjects.update');
            Route::delete('/subjects/{subject}', 'destroySubject')->name('subjects.destroy');
        });

        // --- GESTION DES ÉTUDIANTS ---
        // Génère : admin.students.index, create, store, show, edit, update, destroy
        Route::resource('students', StudentController::class)->only(['index', 'create', 'store', 'show']);

        // --- GESTION DES ANNÉES UNIVERSITAIRES ---
        Route::prefix('academic-years')->name('academic-years.')->group(function () {
            Route::get('/', [AcademicYearController::class, 'index'])->name('index');
            Route::post('/', [AcademicYearController::class, 'store'])->name('store');
            Route::patch('/{academicYear}/set-current', [AcademicYearController::class, 'setCurrent'])->name('set-current');
            Route::delete('/{academicYear}', [AcademicYearController::class, 'destroy'])->name('destroy');
        });

        // --- STRUCTURE ACADÉMIQUE (Campus, Facultés, Départements, Cours) ---
        Route::prefix('academic-structure')->name('academic.')->group(function () {
            Route::get('/', [AcademicStructureController::class, 'index'])->name('index');

            // Campus
            Route::post('/campuses', [AcademicStructureController::class, 'storeCampus'])->name('campuses.store');
            Route::put('/campuses/{campus}', [AcademicStructureController::class, 'updateCampus'])->name('campuses.update');
            Route::delete('/campuses/{campus}', [AcademicStructureController::class, 'destroyCampus'])->name('campuses.destroy');

            // Facultés
            Route::post('/faculties', [AcademicStructureController::class, 'storeFaculty'])->name('faculties.store');
            Route::put('/faculties/{faculty}', [AcademicStructureController::class, 'updateFaculty'])->name('faculties.update');
            Route::delete('/faculties/{faculty}', [AcademicStructureController::class, 'destroyFaculty'])->name('faculties.destroy');

            // Départements
            Route::post('/departments', [AcademicStructureController::class, 'storeDepartment'])->name('departments.store');
            Route::put('/departments/{department}', [AcademicStructureController::class, 'updateDepartment'])->name('departments.update');
            Route::delete('/departments/{department}', [AcademicStructureController::class, 'destroyDepartment'])->name('departments.destroy');

            // Cours
            Route::post('/courses', [AcademicStructureController::class, 'storeCourse'])->name('courses.store');
            Route::delete('/courses/{course}', [AcademicStructureController::class, 'destroyCourse'])->name('courses.destroy');
            Route::post('/programs', [AcademicStructureController::class, 'storeProgram'])->name('programs.store');
            Route::delete('/programs/{program}', [AcademicStructureController::class, 'destroyProgram'])->name('programs.destroy');
        });
    });

    // --- ESPACE ÉTUDIANT ---
    Route::prefix('student')->name('student.')->middleware('role:student')->group(function () {
        Route::get('/dashboard', function () {
            $student = auth()->user()->student()
                ->with(['department.faculty', 'enrollments.academicYear', 'enrollments.program'])
                ->first();

            return Inertia::render('Student/Dashboard', ['student' => $student]);
        })->name('dashboard');
    });

    // --- ESPACE ENSEIGNANT ---
    Route::prefix('teacher')->name('teacher.')->middleware('role:teacher')->group(function () {
        Route::get('/dashboard', function () {
            $user = request()->user();
            $currentYear = \App\Models\AcademicYear::where('is_current', true)->first();
            $subjects = $currentYear
                ? $user->taughtSubjects()
                    ->wherePivot('academic_year_id', $currentYear->id)
                    ->with('courseUnit:id,code,name')
                    ->orderBy('name')
                    ->get(['subjects.id', 'subjects.course_unit_id', 'subjects.code', 'subjects.name', 'subjects.coefficient'])
                : collect();

            return Inertia::render('Teacher/Dashboard', [
                'academicYear' => $currentYear?->only(['id', 'name']),
                'subjects' => $subjects,
            ]);
        })->name('dashboard');
    });

    // --- ESPACE PARENT ---
    Route::prefix('parent')->name('parent.')->middleware('role:parent')->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Parent/Dashboard');
        })->name('dashboard');
    });

    // --- PROFIL UTILISATEUR ---
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
