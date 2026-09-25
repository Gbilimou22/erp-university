<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Student;
use App\Models\User;
use App\Models\Faculty;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_students'    => Student::count(),
            'total_users'       => User::count(),
            'total_faculties'   => Faculty::count(),
            'total_departments' => Department::count(),
            'active_students'   => Student::where('status', 'active')->count(),
            'pending_students'  => Student::where('status', 'pending')->count(),
        ];

        // 1. Répartition par faculté pour le graphique Doughnut
        $studentsByFaculty = Faculty::withCount('enrollments')
            ->get()
            ->map(fn($faculty) => [
                'name'  => $faculty->name,
                'count' => $faculty->enrollments_count,
            ]);

        // 2. Évolution mensuelle des inscriptions pour le graphique Line
        $monthlyRegistrations = Student::select(
            DB::raw("TO_CHAR(created_at, 'Mon YYYY') as month"),
            DB::raw("COUNT(*) as count"),
            DB::raw("MIN(created_at) as min_date")
        )
            ->groupBy('month')
            ->orderBy('min_date', 'asc')
            ->take(6)
            ->get();

        // 3. Chargement des étudiants récents avec leurs relations
        $recentStudents = Student::with(['user', 'department', 'enrollments.faculty'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $recentUsers = User::orderBy('created_at', 'desc')->take(5)->get();

        return Inertia::render('Admin/Dashboard', [
            'stats'                => $stats,
            'studentsByFaculty'    => $studentsByFaculty,
            'monthlyRegistrations' => $monthlyRegistrations,
            'recentStudents'       => $recentStudents,
            'recentUsers'          => $recentUsers,
        ]);
    }
}
