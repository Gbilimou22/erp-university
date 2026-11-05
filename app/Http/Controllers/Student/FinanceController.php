<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentFee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student()->first();
        $fees = $student
            ? StudentFee::query()
                ->with([
                    'enrollment.academicYear:id,name',
                    'payments:id,student_fee_id,reference_number,amount,payment_method,paid_at',
                ])
                ->whereHas('enrollment', fn ($query) => $query->where('student_id', $student->id))
                ->orderByDesc('due_date')
                ->get()
            : collect();

        $items = $fees->map(function (StudentFee $fee) {
            $amount = (float) $fee->amount;
            $paid = (float) $fee->payments->sum(fn ($payment) => (float) $payment->amount);
            $balance = max(0, $amount - $paid);
            $status = match (true) {
                $balance <= 0 => 'paid',
                $fee->due_date?->lt(today()) => 'overdue',
                $paid > 0 => 'partial',
                default => 'due',
            };

            return [
                'id' => $fee->id,
                'title' => $fee->title,
                'amount' => $amount,
                'paid_amount' => $paid,
                'balance' => $balance,
                'due_date' => $fee->due_date?->toDateString(),
                'status' => $status,
                'academic_year' => $fee->enrollment->academicYear?->name,
                'payments' => $fee->payments->sortByDesc('paid_at')->map(fn ($payment) => [
                    'reference_number' => $payment->reference_number,
                    'amount' => (float) $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                ])->values(),
            ];
        })->values();

        return Inertia::render('Student/Finance/Index', [
            'fees' => $items,
            'summary' => [
                'total_amount' => round((float) $items->sum('amount'), 2),
                'total_paid' => round((float) $items->sum('paid_amount'), 2),
                'balance' => round((float) $items->sum('balance'), 2),
            ],
        ]);
    }
}
