<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Room;
use App\Models\SubjectTeacherAssignment;
use App\Models\TimetableEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    public function index(): Response
    {
        $assignments = SubjectTeacherAssignment::query()->with(['subject:id,course_unit_id,code,name', 'subject.courseUnit:id,code,name', 'teacher:id,name', 'academicYear:id,name,is_current'])
            ->whereHas('teacher', fn (Builder $query) => $query->where('is_active', true))
            ->orderByDesc('academic_year_id')->get();

        return Inertia::render('Admin/Teachers/Timetable', [
            'campuses' => Campus::query()->orderBy('name')->get(['id', 'name', 'code']),
            'rooms' => Room::query()->with('campus:id,name')->withCount('timetableEntries')->orderBy('name')->get(),
            'assignments' => $assignments,
            'currentYearId' => $assignments->first(fn ($assignment) => $assignment->academicYear->is_current)?->academic_year_id
                ?? $assignments->first()?->academic_year_id,
            'entries' => TimetableEntry::query()->with([
                'assignment.subject:id,course_unit_id,code,name',
                'assignment.subject.courseUnit:id,code,name',
                'assignment.teacher:id,name',
                'assignment.academicYear:id,name,is_current',
                'room:id,campus_id,code,name',
                'room.campus:id,name',
            ])->orderBy('weekday')->orderBy('start_time')->get(),
        ]);
    }

    public function storeRoom(Request $request): RedirectResponse
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);
        $data = $request->validate([
            'campus_id' => ['required', 'exists:campuses,id'],
            'code' => ['required', 'string', 'max:30', 'alpha_dash'],
            'name' => ['required', 'string', 'max:150'],
            'capacity' => ['required', 'integer', 'min:1', 'max:10000'],
            'type' => ['required', Rule::in(['classroom', 'amphitheatre', 'laboratory', 'other'])],
        ]);
        $request->validate(['code' => [Rule::unique('rooms', 'code')->where('campus_id', $data['campus_id'])]]);
        Room::create($data);

        return back()->with('success', 'Salle créée.');
    }

    public function destroyRoom(Room $room): RedirectResponse
    {
        if ($room->timetableEntries()->exists()) {
            return back()->withErrors(['room' => 'Cette salle contient des créneaux planifiés et ne peut pas être supprimée.']);
        }
        $room->delete();

        return back()->with('success', 'Salle supprimée.');
    }

    public function storeEntry(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject_teacher_assignment_id' => ['required', 'exists:subject_teacher_assignments,id'],
            'room_id' => ['required', Rule::exists('rooms', 'id')->where('is_active', true)],
            'weekday' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        DB::transaction(function () use ($data) {
            $assignment = SubjectTeacherAssignment::query()->with('teacher')->findOrFail($data['subject_teacher_assignment_id']);
            if (!$assignment->teacher->is_active) {
                throw ValidationException::withMessages(['subject_teacher_assignment_id' => 'Cet enseignant est désactivé.']);
            }

            // Serializing reservations on both resources prevents concurrent requests from booking conflicts.
            User::query()->whereKey($assignment->teacher_id)->lockForUpdate()->firstOrFail();
            Room::query()->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();

            $overlappingEntries = TimetableEntry::query()
                ->where('weekday', $data['weekday'])
                ->where('start_time', '<', $data['end_time'])
                ->where('end_time', '>', $data['start_time'])
                ->whereHas('assignment', fn (Builder $query) => $query->where('academic_year_id', $assignment->academic_year_id));

            $roomConflict = (clone $overlappingEntries)->where('room_id', $data['room_id'])->exists();
            if ($roomConflict) {
                throw ValidationException::withMessages(['room_id' => 'Cette salle est déjà réservée sur tout ou partie de ce créneau.']);
            }

            $teacherConflict = (clone $overlappingEntries)->whereHas(
                'assignment', fn (Builder $query) => $query->where('teacher_id', $assignment->teacher_id)
            )->exists();
            if ($teacherConflict) {
                throw ValidationException::withMessages(['subject_teacher_assignment_id' => 'Cet enseignant a déjà un cours sur tout ou partie de ce créneau.']);
            }

            TimetableEntry::create($data);
        });

        return back()->with('success', 'Créneau ajouté à l’emploi du temps.');
    }

    public function destroyEntry(TimetableEntry $entry): RedirectResponse
    {
        $entry->delete();

        return back()->with('success', 'Créneau supprimé.');
    }
}
