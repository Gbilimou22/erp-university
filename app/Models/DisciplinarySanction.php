<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisciplinarySanction extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'sanction_type', 'reason', 'authority', 'imposed_at', 'effective_until', 'document_path', 'recorded_by'];

    protected function casts(): array
    {
        return ['imposed_at' => 'date', 'effective_until' => 'date'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
