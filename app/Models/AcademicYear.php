<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'start_date',
        'end_date',
        'is_current',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    /**
     * Une année académique regroupe plusieurs inscriptions.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Une année académique contient plusieurs notes enregistrées.
     */
    public function grades(): HasManyThrough
    {
        return $this->hasManyThrough(Grade::class, Enrollment::class, 'academic_year_id', 'enrollment_id', 'id', 'id');
    }

    public function curricula(): HasMany
    {
        return $this->hasMany(Curriculum::class);
    }
}
