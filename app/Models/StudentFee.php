<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'total_amount',
        'paid_amount',
        'due_date',
        'status', // PENDING, PARTIAL, PAID, OVERDUE
    ];

    protected $casts = [
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'due_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /**
     * Un échéancier a plusieurs versements/paiements enregistrés.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
