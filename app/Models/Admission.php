<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\AdmissionDocument;

class Admission extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_first_name', 'candidate_last_name', 'email', 'phone',
        'birth_date', 'birth_place', 'desired_program_id', 'desired_level',
        'status', 'decision', 'decision_reason', 'decided_by', 'decided_at', 'student_id',
    ];

    protected function casts(): array
    {
        return ['birth_date' => 'date', 'decided_at' => 'datetime'];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'desired_program_id');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(AdmissionDocument::class);
    }
}
