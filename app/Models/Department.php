<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory; // <-- Assurez-vous de RETIRER HasUids ou HasUuids d'ici

    protected $fillable = [
        'faculty_id',
        'code',
        'name',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
