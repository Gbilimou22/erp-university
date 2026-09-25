<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubjectTeacherAssignment extends Model
{
    protected $table = 'subject_teacher_assignments';
    protected $fillable = ['subject_id', 'teacher_id', 'academic_year_id'];

    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function timetableEntries(): HasMany { return $this->hasMany(TimetableEntry::class); }
}
