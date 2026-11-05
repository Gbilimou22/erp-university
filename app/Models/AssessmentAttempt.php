<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentAttempt extends Model
{
    protected $fillable = ['assessment_id', 'enrollment_id', 'started_at', 'submitted_at', 'score', 'status', 'submission_reason', 'focus_violations'];
    protected function casts(): array { return ['started_at' => 'datetime', 'submitted_at' => 'datetime', 'score' => 'decimal:2']; }
    public function assessment(): BelongsTo { return $this->belongsTo(Assessment::class); }
    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function answers(): HasMany { return $this->hasMany(AssessmentAnswer::class); }
}
