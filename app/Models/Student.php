<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany; // <-- Ajouter HasMany

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'registration_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'birth_date',
        'birth_place',
        'nationality',
        'address',
        'photo_path',
        'status',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    /**
     * Relation avec le modèle User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le département
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Relation avec les inscriptions (Enrollments)
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function sanctions(): HasMany
    {
        return $this->hasMany(DisciplinarySanction::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(StudentCertificate::class);
    }
}
