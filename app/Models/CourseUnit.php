<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'code',
        'name',
        'credits',
    ];

    /**
     * L'UE appartient à une faculté.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Une UE est composée de plusieurs matières (ECUE).
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}
