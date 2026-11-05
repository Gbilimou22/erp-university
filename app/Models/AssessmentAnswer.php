<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentAnswer extends Model
{
    protected $fillable = ['attempt_id', 'question_id', 'option_id', 'answer_text'];
    public function question(): BelongsTo { return $this->belongsTo(AssessmentQuestion::class); }
    public function option(): BelongsTo { return $this->belongsTo(AssessmentOption::class); }
}
