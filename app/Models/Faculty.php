<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Faculty extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'code',
        'name',
        'description',
    ];

    /**
     * La faculté appartient à un campus.
     */
    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    /**
     * Une faculté possède plusieurs départements.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * La faculté possède plusieurs inscriptions d'étudiants.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Les étudiants rattachés à la faculté via leurs inscriptions.
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(Student::class, Enrollment::class, 'faculty_id', 'id', 'id', 'student_id');
    }

    /**
     * La faculté possède plusieurs unités d'enseignement (UE).
     */
    public function courseUnits(): HasMany
    {
        return $this->hasMany(CourseUnit::class);
    }

    public function faculties()
{
    return $this->hasMany(Faculty::class);
}
}
