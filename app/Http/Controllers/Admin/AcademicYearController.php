<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    /**
     * Liste des années académiques.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/AcademicYears/Index', [
            'academicYears' => AcademicYear::orderBy('start_date', 'desc')->get(),
        ]);
    }

    /**
     * Enregistrer une nouvelle année académique.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100|unique:academic_years,name',
            'code'       => 'required|string|max:50|unique:academic_years,code',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'is_current' => 'boolean',
        ]);

        DB::transaction(function () use ($validated) {
            // Si cette année est définie comme courante, désactiver les autres
            if (!empty($validated['is_current']) && $validated['is_current'] === true) {
                AcademicYear::query()->update(['is_current' => false]);
            }

            AcademicYear::create($validated);
        });

        return redirect()->back()->with('success', 'Année universitaire créée avec succès !');
    }

    /**
     * Définir une année comme l'année courante/active.
     */
    public function setCurrent(AcademicYear $academicYear): RedirectResponse
    {
        DB::transaction(function () use ($academicYear) {
            // Reinitialiser toutes les années
            AcademicYear::query()->update(['is_current' => false]);

            // Activer la sélectionnée
            $academicYear->update(['is_current' => true]);
        });

        return redirect()->back()->with('success', "L'année {$academicYear->name} est désormais l'année universitaire courante.");
    }

    public function destroy(AcademicYear $academicYear): RedirectResponse
    {
        if ($academicYear->enrollments()->exists() || $academicYear->grades()->exists()) {
            return redirect()->back()->withErrors([
                'academic_year' => 'Cette année est déjà utilisée par des inscriptions ou des notes et ne peut pas être supprimée.',
            ]);
        }

        $academicYear->delete();

        return redirect()->back()->with('success', 'Année académique supprimée.');
    }
}
