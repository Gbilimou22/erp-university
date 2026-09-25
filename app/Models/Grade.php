<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'subject_id',
        'academic_year_id',
        'score',
        'type', // CC, TP, EXAM, RATTRAPAGE
        'entered_by',
    ];

    protected $casts = [
        'score' => 'float',
    ];

    /**
     * La note appartient à un étudiant.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * La note concerne une matière spécifique.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * La note s'inscrit dans une année académique.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /**
     * Utilisateur (enseignant/admin) ayant saisi la note.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
