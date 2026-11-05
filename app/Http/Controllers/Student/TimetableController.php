<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user?->student;

        // 1. Cas où l'utilisateur n'est pas associé à une fiche étudiant
        if (!$student) {
            return Inertia::render('Student/Timetable/Index', [
                'entries' => [],
                'program' => 'Non inscrit',
                'level' => 'N/A',
                'academicYear' => 'N/A',
                'currentWeek' => now()->weekOfYear,
                'currentYear' => now()->year,
                'weekDates' => [
                    'start' => now()->startOfWeek()->format('d/m/Y'),
                    'end' => now()->endOfWeek()->format('d/m/Y'),
                ],
            ]);
        }

        // 2. Récupérer la dernière inscription active
        $activeEnrollments = $student->enrollments()
            ->where('status', 'active')
            ->with(['program', 'academicYear', 'classGroup']);
        $currentAcademicYear = AcademicYear::query()->where('is_current', true)->first();
        $enrollment = $currentAcademicYear
            ? (clone $activeEnrollments)->where('academic_year_id', $currentAcademicYear->id)->latest('id')->first()
            : null;
        $enrollment ??= $activeEnrollments->latest('id')->first();

        if (!$enrollment) {
            return Inertia::render('Student/Timetable/Index', [
                'entries' => [],
                'program' => 'Aucune inscription active',
                'level' => 'N/A',
                'academicYear' => 'N/A',
                'currentWeek' => now()->weekOfYear,
                'currentYear' => now()->year,
                'weekDates' => [
                    'start' => now()->startOfWeek()->format('d/m/Y'),
                    'end' => now()->endOfWeek()->format('d/m/Y'),
                ],
            ]);
        }

        // 3. Récupérer ou définir la semaine et l'année demandées
        $week = (int) $request->input('week', now()->weekOfYear);
        $year = (int) $request->input('year', now()->year);

        $startOfWeek = now()->setISODate($year, $week)->startOfWeek();
        $endOfWeek = now()->setISODate($year, $week)->endOfWeek();

        // 4. Charger les cours communs et ceux réservés au groupe de l’étudiant.
        $query = TimetableEntry::query()
            ->with(['assignment.subject', 'assignment.teacher', 'room'])
            ->whereHas('assignment', fn ($assignment) => $assignment->where('academic_year_id', $enrollment->academic_year_id))
            ->where(function ($entries) use ($enrollment) {
                $entries->whereNull('class_id');
                if ($enrollment->class_id) {
                    $entries->orWhere('class_id', $enrollment->class_id);
                }
            })
            ->orderBy('weekday')
            ->orderBy('start_time');

        $entries = $query->get()->map(function ($entry) {
            $assignment = $entry->assignment;
            $subject = $assignment?->subject;
            $teacher = $assignment?->teacher;

            return [
                'id' => $entry->id,
                'day_of_week' => (int) $entry->weekday,
                'start_time' => isset($entry->start_time) ? Carbon::parse($entry->start_time)->format('H:i') : '08:00',
                'end_time' => isset($entry->end_time) ? Carbon::parse($entry->end_time)->format('H:i') : '10:00',
                'type' => $entry->type ?? 'CM',
                'subject' => [
                    'name' => $subject?->name ?? 'Matière non définie',
                    'code' => $subject?->code ?? '',
                ],
                'teacher' => [
                    'name' => $teacher?->name ?? 'Enseignant non désigné',
                    'title' => '',
                ],
                'room' => [
                    'name' => $entry->room?->name ?? 'Salle non attribuée',
                    'building' => $entry->room?->campus?->name ?? '',
                ],
            ];
        });

        // 7. Rendu Inertia avec toutes les props nécessaires
        return Inertia::render('Student/Timetable/Index', [
            'entries' => $entries,
            'program' => $enrollment->program?->name ?? 'Filière non définie',
            'level' => $enrollment->level ?? 'L3',
            'academicYear' => $enrollment->academicYear?->name ?? 'En cours',
            'classGroup' => $enrollment->classGroup?->only(['code', 'name', 'level_code']),
            'currentWeek' => $week,
            'currentYear' => $year,
            'weekDates' => [
                'start' => $startOfWeek->format('d/m/Y'),
                'end' => $endOfWeek->format('d/m/Y'),
            ],
        ]);
    }
}
