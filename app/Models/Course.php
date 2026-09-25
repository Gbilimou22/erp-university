<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids; // À inclure si UUID

class Course extends Model
{
    use HasFactory, HasUuids; // Retirez HasUuids si vous utilisez des ID entiers

    protected $fillable = [
        'department_id',
        'code',
        'name',
        'description',
        'credits',
    ];

    /**
     * Un cours appartient à un département.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
