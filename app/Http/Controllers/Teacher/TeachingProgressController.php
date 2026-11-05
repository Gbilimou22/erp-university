<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SubjectTeacherAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeachingProgressController extends Controller
{
    public function storeSession(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'assignment_id' => ['required', 'integer'],
            'planned_hours' => ['nullable', 'numeric', 'min:1', 'max:5000'],
            'delivered_on' => ['required', 'date', 'before_or_equal:today'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:12'],
            'topic' => ['required', 'string', 'max:200'],
        ]);

        $year = AcademicYear::query()->where('is_current', true)->firstOrFail();
        $assignment = SubjectTeacherAssignment::query()
            ->whereKey($data['assignment_id'])
            ->where('teacher_id', $request->user()->id)
            ->where('academic_year_id', $year->id)
            ->firstOrFail();

        $completedHours = (float) $assignment->teachingSessions()->sum('hours');
        $plannedHours = array_key_exists('planned_hours', $data) && $data['planned_hours'] !== null
            ? (float) $data['planned_hours']
            : ($assignment->planned_hours === null ? null : (float) $assignment->planned_hours);

        if ($plannedHours === null) {
            throw ValidationException::withMessages([
                'planned_hours' => 'Indiquez le volume horaire total prévu pour cette matière.',
            ]);
        }

        if ($plannedHours < $completedHours + (float) $data['hours']) {
            throw ValidationException::withMessages([
                'planned_hours' => 'Le volume prévu doit couvrir les heures déjà dispensées et la séance enregistrée.',
            ]);
        }

        $assignment->update(['planned_hours' => $plannedHours]);
        $assignment->teachingSessions()->create([
            'recorded_by' => $request->user()->id,
            'delivered_on' => $data['delivered_on'],
            'hours' => $data['hours'],
            'topic' => $data['topic'],
        ]);

        return back()->with('success', 'Séance enregistrée. La progression du cours a été mise à jour.');
    }
}
