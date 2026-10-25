<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CurriculumSemester extends Model
{
    protected $fillable = ['curriculum_id', 'code', 'name', 'position', 'target_credits'];

    protected function casts(): array
    {
        return ['position' => 'integer', 'target_credits' => 'integer'];
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function courseUnits(): BelongsToMany
    {
        return $this->belongsToMany(CourseUnit::class, 'curriculum_course_units')
            ->withPivot('is_required')->withTimestamps()->orderBy('course_units.code');
    }
}
