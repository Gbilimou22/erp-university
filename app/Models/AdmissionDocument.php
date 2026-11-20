<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionDocument extends Model
{
    use HasFactory;

    protected $fillable = ['admission_id', 'document_type', 'storage_path', 'original_name', 'checksum', 'is_required', 'verification_status', 'verified_by', 'verified_at'];

    protected function casts(): array
    {
        return ['is_required' => 'boolean', 'verified_at' => 'datetime'];
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
