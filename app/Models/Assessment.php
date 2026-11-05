<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    protected $fillable = [
        'teacher_id', 'subject_id', 'department_id', 'academic_year_id', 'title', 'instructions',
        'type', 'starts_at', 'ends_at', 'duration_minutes', 'anti_cheat_enabled', 'status', 'launched_at',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'launched_at' => 'datetime', 'anti_cheat_enabled' => 'boolean'];
    }

    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function questions(): HasMany { return $this->hasMany(AssessmentQuestion::class)->orderBy('position'); }
    public function attempts(): HasMany { return $this->hasMany(AssessmentAttempt::class); }
}
