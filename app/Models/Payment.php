<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_fee_id',
        'transaction_reference',
        'amount',
        'payment_method', // CASH, MOBILE_MONEY, CARD, BANK_TRANSFER
        'payment_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'payment_date' => 'datetime',
    ];

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }
}
