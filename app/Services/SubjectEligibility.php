<?php

namespace App\Services;

use App\Models\Curriculum;
use App\Models\Subject;

class SubjectEligibility
{
    /** @return list<int|string> */
    public function programIds(Subject $subject, int $academicYearId): array
    {
        if (! $subject->courseUnit) {
            return [];
        }

        return Curriculum::query()
            ->where('academic_year_id', $academicYearId)
            ->whereHas('program.department', function ($query) use ($subject) {
                $query->where('faculty_id', $subject->courseUnit->faculty_id);
                if ($subject->department_id) $query->whereKey($subject->department_id);
            })
            ->whereHas('semesters.courseUnits', fn ($query) => $query->where('course_units.id', $subject->course_unit_id))
            ->distinct()
            ->pluck('program_id')
            ->all();
    }
}
