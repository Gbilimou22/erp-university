<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentFeeSchedule extends Model
{
    protected $fillable = [
        'department_id',
        'academic_year_id',
        'registration_amount',
        'registration_due_date',
        'tuition_installment_1_amount',
        'tuition_installment_1_due_date',
        'tuition_installment_2_amount',
        'tuition_installment_2_due_date',
        'tuition_installment_3_amount',
        'tuition_installment_3_due_date',
    ];

    protected $casts = [
        'registration_amount' => 'decimal:2',
        'registration_due_date' => 'date:Y-m-d',
        'tuition_installment_1_amount' => 'decimal:2',
        'tuition_installment_1_due_date' => 'date:Y-m-d',
        'tuition_installment_2_amount' => 'decimal:2',
        'tuition_installment_2_due_date' => 'date:Y-m-d',
        'tuition_installment_3_amount' => 'decimal:2',
        'tuition_installment_3_due_date' => 'date:Y-m-d',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
