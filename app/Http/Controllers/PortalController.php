<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\AcademicYear;

class PortalController extends Controller
{
    /**
     * Affiche le Portail d'Accueil Central de l'Université.
     */
    public function index(): Response
    {
        // Métriques rapides pour le portail public
        $stats = [
            'total_students' => Student::count(),
            'total_faculties' => Faculty::count(),
            'academic_year'   => AcademicYear::where('is_current', true)->value('name') ?? '2026-2027',
        ];

        return Inertia::render('Portal/Index', [
            'stats' => $stats
        ]);
    }
}


