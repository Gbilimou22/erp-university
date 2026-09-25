<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableEntry extends Model
{
    protected $fillable = ['subject_teacher_assignment_id', 'room_id', 'weekday', 'start_time', 'end_time'];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(SubjectTeacherAssignment::class, 'subject_teacher_assignment_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
