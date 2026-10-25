<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_teacher_assignment_id',
        'class_id',
        'program_id',
        'subject_id',
        'teacher_id',
        'room_id',
        'level',
        'academic_year_id',
        'weekday', // ou day_of_week selon votre migration
        'start_time',
        'end_time',
        'type',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(SubjectTeacherAssignment::class, 'subject_teacher_assignment_id');
    }

    public function classGroup(): BelongsTo
    {
        return $this->belongsTo(ClassGroup::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
