<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_unit_id',
        'code',
        'name',
        'coefficient',
        'hours_cm',
        'hours_td',
        'hours_tp',
    ];

    /**
     * La matière appartient à une Unité d'Enseignement.
     */
    public function courseUnit(): BelongsTo
    {
        return $this->belongsTo(CourseUnit::class);
    }

    /**
     * La matière possède plusieurs notes attribuées.
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'subject_teacher_assignments', 'subject_id', 'teacher_id')
            ->withPivot('academic_year_id')->withTimestamps();
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(SubjectTeacherAssignment::class);
    }
}
