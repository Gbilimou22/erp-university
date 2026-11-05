<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentQuestion extends Model
{
    protected $fillable = ['assessment_id', 'question_text', 'type', 'points', 'position'];
    protected function casts(): array { return ['points' => 'decimal:2']; }
    public function assessment(): BelongsTo { return $this->belongsTo(Assessment::class); }
    public function options(): HasMany { return $this->hasMany(AssessmentOption::class)->orderBy('position'); }
}
