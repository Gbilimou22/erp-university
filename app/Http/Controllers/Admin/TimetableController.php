<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Curriculum;
use App\Models\Program;
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
        $assignments = SubjectTeacherAssignment::query()->with(['subject:id,course_unit_id,code,name', 'subject.courseUnit:id,faculty_id,code,name', 'teacher:id,name', 'academicYear:id,name,is_current'])
            ->whereHas('teacher', fn(Builder $query) => $query->where('is_active', true))
            ->orderByDesc('academic_year_id')->get();

        return Inertia::render('Admin/Teachers/Timetable', [
            'campuses' => Campus::query()->orderBy('name')->get(['id', 'name', 'code']),
            'rooms' => Room::query()->with('campus:id,name')->withCount('timetableEntries')->orderBy('name')->get(),
            'assignments' => $assignments,
            'groups' => ClassGroup::query()
                ->with([
                    'program:id,department_id,name,code',
                    'program.department:id,faculty_id',
                    'program.curricula:id,program_id,academic_year_id',
                    'program.curricula.semesters.courseUnits:id',
                ])
                ->orderBy('code')
                ->get(['id', 'program_id', 'academic_year_id', 'level_code', 'code', 'name']),
            'currentYearId' => $assignments->first(fn($assignment) => $assignment->academicYear->is_current)?->academic_year_id
                ?? $assignments->first()?->academic_year_id,
        ]);
    }

    public function rooms(): Response
    {
        return Inertia::render('Admin/Teachers/Rooms', [
            'rooms' => Room::query()->with('campus:id,name')->withCount('timetableEntries')->orderBy('name')->paginate(20)->withQueryString(),
        ]);
    }

    public function entries(): Response
    {
        $entries = TimetableEntry::query()->with([
            'assignment:id,subject_id,teacher_id,academic_year_id',
            'assignment.subject:id,course_unit_id,code,name',
            'assignment.subject.courseUnit:id,code,name',
            'assignment.teacher:id,name',
            'assignment.academicYear:id,name,is_current',
            'classGroup:id,code,name,level_code',
            'room:id,campus_id,code,name',
            'room.campus:id,name',
        ])->orderBy('weekday')->orderBy('start_time')->get();

        $currentEntry = $entries->first(fn($entry) => $entry->assignment?->academicYear?->is_current);

        return Inertia::render('Admin/Teachers/Entries', [
            'entries' => $entries,
            'academicYears' => AcademicYear::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'currentYearId' => $currentEntry?->assignment?->academic_year_id
                ?? $entries->first()?->assignment?->academic_year_id,
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

        return redirect()->route('admin.timetable.rooms.index')->with('success', 'Salle créée.');
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
            'class_id' => ['nullable', 'exists:classes,id'],
            'room_id' => ['required', Rule::exists('rooms', 'id')->where('is_active', true)],
            'weekday' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        DB::transaction(function () use ($data) {
            $assignment = SubjectTeacherAssignment::query()->with('teacher')->findOrFail($data['subject_teacher_assignment_id']);
            $assignment->loadMissing('subject.courseUnit');
            if (!$assignment->teacher->is_active) {
                throw ValidationException::withMessages(['subject_teacher_assignment_id' => 'Cet enseignant est désactivé.']);
            }

            $classGroup = null;
            if (!empty($data['class_id'])) {
                $classGroup = ClassGroup::query()->with('program.department')->findOrFail($data['class_id']);
                if ((int) $classGroup->academic_year_id !== (int) $assignment->academic_year_id
                    || (int) $classGroup->program->department->faculty_id !== (int) $assignment->subject->courseUnit->faculty_id
                    || !$this->levelMatchesProgram($classGroup->level_code, $classGroup->program)
                    || !Curriculum::query()->where('program_id', $classGroup->program_id)
                        ->where('academic_year_id', $assignment->academic_year_id)
                        ->whereHas('semesters.courseUnits', fn (Builder $query) => $query->whereKey($assignment->subject->courseUnit->id))
                        ->exists()) {
                    throw ValidationException::withMessages(['class_id' => 'Le groupe doit correspondre à l’année et à la filière de l’affectation.']);
                }
            }

            // Verrouillage pour éviter les réservations concurrentes
            User::query()->whereKey($assignment->teacher_id)->lockForUpdate()->firstOrFail();
            Room::query()->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();

            // Récupérer les créneaux existants pour le même jour et chevauchant les horaires
            $overlappingEntries = TimetableEntry::query()
                ->where('weekday', $data['weekday'])
                ->where('start_time', '<', $data['end_time'])
                ->where('end_time', '>', $data['start_time']);

            // 1. Vérifier le conflit de salle
            $roomConflict = (clone $overlappingEntries)->where('room_id', $data['room_id'])->exists();
            if ($roomConflict) {
                throw ValidationException::withMessages(['room_id' => 'Cette salle est déjà réservée sur tout ou partie de ce créneau.']);
            }

            // 2. Vérifier le conflit d'enseignant en recoupant via les autres affectations du même professeur
            $teacherAssignmentIds = SubjectTeacherAssignment::where('teacher_id', $assignment->teacher_id)->pluck('id');
            $teacherConflict = (clone $overlappingEntries)->whereIn('subject_teacher_assignment_id', $teacherAssignmentIds)->exists();

            if ($teacherConflict) {
                throw ValidationException::withMessages(['subject_teacher_assignment_id' => 'Cet enseignant a déjà un cours sur tout ou partie de ce créneau.']);
            }

            $matchingGroupIds = ClassGroup::query()
                ->where('academic_year_id', $assignment->academic_year_id)
                ->whereHas('program.curricula', fn (Builder $query) => $query
                    ->where('academic_year_id', $assignment->academic_year_id)
                    ->whereHas('semesters.courseUnits', fn (Builder $units) => $units->whereKey($assignment->subject->courseUnit->id)))
                ->pluck('id');

            $groupConflict = (clone $overlappingEntries)
                ->where(function ($query) use ($classGroup, $matchingGroupIds) {
                    if ($classGroup) {
                        $query->whereNull('class_id')->orWhere('class_id', $classGroup->id);
                    } else {
                        $query->whereNull('class_id')->orWhereIn('class_id', $matchingGroupIds);
                    }
                })
                ->exists();

            if ($groupConflict) {
                throw ValidationException::withMessages(['class_id' => 'Ce groupe a déjà un cours sur tout ou partie de ce créneau.']);
            }

            // Enregistrement direct avec la structure réelle de la table
            TimetableEntry::create([
                'subject_teacher_assignment_id' => $data['subject_teacher_assignment_id'],
                'class_id'                     => $classGroup?->id,
                'room_id'                       => $data['room_id'],
                'weekday'                       => $data['weekday'],
                'start_time'                    => $data['start_time'],
                'end_time'                      => $data['end_time'],
            ]);
        });

        return redirect()->route('admin.timetable.entries.index')->with('success', 'Créneau ajouté à l’emploi du temps.');
    }
    public function destroyEntry(TimetableEntry $entry): RedirectResponse
    {
        $entry->delete();

        return back()->with('success', 'Créneau supprimé.');
    }

    private function levelMatchesProgram(string $levelCode, Program $program): bool
    {
        $prefix = match ($program->degree_level) {
            'LICENCE', 'DUT' => 'L',
            'MASTER' => 'M',
            'DOCTORAT' => 'D',
            default => '',
        };

        return $prefix !== ''
            && str_starts_with($levelCode, $prefix)
            && (int) substr($levelCode, 1) <= $program->duration_years;
    }
}
