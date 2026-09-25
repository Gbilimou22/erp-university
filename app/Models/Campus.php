<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campus extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'address',
    ];

    /**
     * Un campus héberge plusieurs facultés.
     */
    public function faculties(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
