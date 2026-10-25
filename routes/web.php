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
use App\Http\Controllers\Admin\CurriculumController;
use App\Http\Controllers\Admin\ClassGroupController;
use App\Http\Controllers\Auth\FirstLoginPasswordController;
use App\Http\Controllers\Student\TimetableController as StudentTimetableController;
use App\Http\Controllers\Student\GroupController as StudentGroupController;
use App\Http\Middleware\RequirePasswordChange;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Portail Unifié (Accueil)
Route::get('/', [PortalController::class, 'index'])->name('portal.index');

// 2. Première Connexion (Changement de mot de passe obligatoire)
Route::middleware(['auth', 'active'])->prefix('first-login')->name('first-login.')->group(function () {
    Route::get('/password', [FirstLoginPasswordController::class, 'edit'])->name('password.edit');
    Route::put('/password', [FirstLoginPasswordController::class, 'update'])->name('password.update');
});

// 3. Espaces Sécurisés
Route::middleware(['auth', 'active', 'verified', RequirePasswordChange::class])->group(function () {

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

        // Enseignants
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');

        // Maquette Pédagogique
        Route::controller(CurriculumController::class)->prefix('curricula')->name('curricula.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::delete('/{curriculum}', 'destroy')->name('destroy');
            Route::post('/{curriculum}/semesters', 'storeSemester')->name('semesters.store');
            Route::delete('/semesters/{semester}', 'destroySemester')->name('semesters.destroy');
            Route::post('/semesters/{semester}/course-units', 'attachCourseUnit')->name('course-units.attach');
            Route::delete('/semesters/{semester}/course-units/{courseUnit}', 'detachCourseUnit')->name('course-units.detach');
        });

        Route::controller(ClassGroupController::class)->prefix('academic-groups')->name('academic-groups.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{classGroup}', 'show')->name('show');
            Route::post('/', 'store')->name('store');
            Route::post('/{classGroup}/students/{student}/move', 'moveStudent')->name('students.move');
            Route::delete('/{classGroup}', 'destroy')->name('destroy');
        });

        // Emploi du temps (Admin)
        Route::controller(TimetableController::class)->prefix('timetable')->name('timetable.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/rooms', 'rooms')->name('rooms.index');
            Route::get('/entries', 'entries')->name('entries.index');
            Route::post('/rooms', 'storeRoom')->name('rooms.store');
            Route::delete('/rooms/{room}', 'destroyRoom')->name('rooms.destroy');
            Route::post('/entries', 'storeEntry')->name('entries.store');
            Route::delete('/entries/{entry}', 'destroyEntry')->name('entries.destroy');
        });

        // Enseignements
        Route::prefix('teaching')->name('teaching.')->controller(TeachingController::class)->group(function () {
            Route::get('/course-units', 'index')->name('index');
            Route::get('/subjects', 'subjects')->name('subjects.index');
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

        // Gestion des Étudiants
        Route::resource('students', StudentController::class)->only(['index', 'create', 'store', 'show']);
            Route::resource('students', StudentController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);

        // Années Académiques
        Route::prefix('academic-years')->name('academic-years.')->group(function () {
            Route::get('/', [AcademicYearController::class, 'index'])->name('index');
            Route::post('/', [AcademicYearController::class, 'store'])->name('store');
            Route::patch('/{academicYear}/set-current', [AcademicYearController::class, 'setCurrent'])->name('set-current');
            Route::delete('/{academicYear}', [AcademicYearController::class, 'destroy'])->name('destroy');
        });

        // Structure Académique
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

            // Cours / Programmes
            Route::post('/courses', [AcademicStructureController::class, 'storeCourse'])->name('courses.store');
            Route::delete('/courses/{course}', [AcademicStructureController::class, 'destroyCourse'])->name('courses.destroy');
            Route::post('/programs', [AcademicStructureController::class, 'storeProgram'])->name('programs.store');
            Route::delete('/programs/{program}', [AcademicStructureController::class, 'destroyProgram'])->name('programs.destroy');
        });
    });

    // --- ESPACE ÉTUDIANT (/student/...) ---
    Route::prefix('student')->name('student.')->middleware('role:student')->group(function () {
        Route::get('/dashboard', function () {
            $student = auth()->user()->student()
                ->with(['department.faculty', 'enrollments.academicYear', 'enrollments.program', 'enrollments.classGroup'])
                ->first();

            return Inertia::render('Student/Dashboard', ['student' => $student]);
        })->name('dashboard');

        // Emploi du Temps Étudiant
        Route::get('/timetable', [StudentTimetableController::class, 'index'])->name('timetable');
        Route::get('/group', [StudentGroupController::class, 'show'])->name('group');
    });

    // --- ESPACE ENSEIGNANT (/teacher/...) ---
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

    // --- ESPACE PARENT (/parent/...) ---
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
