<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SubjectTeacherAssignment;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    public function index(Request $request): Response
    {
        $teacherId = $request->user()->id;
        $yearIds = SubjectTeacherAssignment::query()
            ->where('teacher_id', $teacherId)
            ->select('academic_year_id');
        $academicYears = AcademicYear::query()
            ->whereIn('id', $yearIds)
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'is_current']);

        $selectedYear = $academicYears->firstWhere('id', $request->integer('academic_year_id'))
            ?? $academicYears->firstWhere('is_current', true)
            ?? $academicYears->first();

        $entries = $selectedYear
            ? TimetableEntry::query()
                ->with([
                    'assignment.subject:id,course_unit_id,code,name',
                    'assignment.subject.courseUnit:id,code,name',
                    'assignment.teacher:id,name',
                    'classGroup:id,code,name,level_code',
                    'room:id,campus_id,code,name',
                    'room.campus:id,name',
                ])
                ->whereHas('assignment', fn ($query) => $query
                    ->where('teacher_id', $teacherId)
                    ->where('academic_year_id', $selectedYear->id))
                ->orderBy('weekday')
                ->orderBy('start_time')
                ->get()
                ->map(fn (TimetableEntry $entry) => [
                    'id' => $entry->id,
                    'weekday' => (int) $entry->weekday,
                    'start_time' => substr((string) $entry->start_time, 0, 5),
                    'end_time' => substr((string) $entry->end_time, 0, 5),
                    'subject' => $entry->assignment?->subject?->only(['code', 'name']),
                    'courseUnit' => $entry->assignment?->subject?->courseUnit?->only(['code', 'name']),
                    'group' => $entry->classGroup?->only(['code', 'name', 'level_code']),
                    'room' => $entry->room ? [
                        'code' => $entry->room->code,
                        'name' => $entry->room->name,
                        'campus' => $entry->room->campus?->name,
                    ] : null,
                ])
                ->values()
            : collect();

        return Inertia::render('Teacher/Timetable/Index', [
            'academicYears' => $academicYears,
            'selectedYearId' => $selectedYear?->id,
            'entries' => $entries,
        ]);
    }
}
