<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeachingSession extends Model
{
    protected $fillable = [
        'subject_teacher_assignment_id',
        'recorded_by',
        'delivered_on',
        'hours',
        'topic',
    ];

    protected function casts(): array
    {
        return [
            'delivered_on' => 'date',
            'hours' => 'decimal:2',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(SubjectTeacherAssignment::class, 'subject_teacher_assignment_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
