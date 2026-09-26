<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Student;
use App\Models\User;
use App\Models\Faculty;
use App\Models\Department;

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
        ];

        // 1. Répartition par faculté pour le graphique Doughnut
        $studentsByFaculty = Faculty::withCount('enrollments')
            ->get()
            ->map(fn($faculty) => [
                'name'  => $faculty->name,
                'count' => $faculty->enrollments_count,
            ]);

        // 2. Six derniers mois, y compris les mois sans inscription.
        // Les bornes par mois gardent la requête compatible avec PostgreSQL et SQLite.
        $monthlyRegistrations = collect(range(5, 0))
            ->map(function (int $monthsAgo) {
                $monthStart = now()->startOfMonth()->subMonths($monthsAgo);

                return [
                    'month' => $monthStart->copy()->locale('fr')->translatedFormat('M Y'),
                    'count' => Student::query()
                        ->where('created_at', '>=', $monthStart)
                        ->where('created_at', '<', $monthStart->copy()->addMonth())
                        ->count(),
                ];
            })
            ->values();

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
