<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\Payment;
use App\Models\StudentFee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $query = StudentFee::query()->with([
            'enrollment.student:id,registration_number,first_name,last_name,email',
            'enrollment.academicYear:id,name',
            'payments:id,student_fee_id,reference_number,amount,payment_method,paid_at',
        ]);
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->whereHas('enrollment.student', fn ($q) => $q
                ->where('first_name', 'ilike', "%{$search}%")
                ->orWhere('last_name', 'ilike', "%{$search}%")
                ->orWhere('registration_number', 'ilike', "%{$search}%"));
        }
        $fees = $query->orderBy('due_date')->paginate(30)->withQueryString();
        $fees->getCollection()->transform(function (StudentFee $fee) {
            $fee->setAttribute('paid_amount', (float) $fee->payments->sum(fn (Payment $payment) => (float) $payment->amount));
            $fee->setAttribute('balance', max(0, (float) $fee->amount - $fee->paid_amount));
            $fee->setAttribute('computed_status', $fee->balance <= 0 ? 'paid' : ($fee->due_date?->lt(today()) ? 'overdue' : ($fee->paid_amount > 0 ? 'partial' : 'due')));
            return $fee;
        });

        return Inertia::render('Admin/Finance/Index', ['fees' => $fees, 'filters' => $request->only('search')]);
    }

    public function recordPayment(Request $request, StudentFee $fee): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'payment_method' => ['required', 'in:cash,bank_transfer,mobile_money,card,other'],
            'reference_number' => ['nullable', 'string', 'max:100', 'unique:payments,reference_number'],
        ]);

        DB::transaction(function () use ($request, $fee, $validated): void {
            $lockedFee = StudentFee::query()->lockForUpdate()->findOrFail($fee->id);
            $paid = (float) $lockedFee->payments()->sum('amount');
            $balance = max(0, (float) $lockedFee->amount - $paid);
            if ((float) $validated['amount'] > $balance) {
                throw ValidationException::withMessages(['amount' => 'Le règlement dépasse le solde restant de cette échéance.']);
            }

            $payment = $lockedFee->payments()->create([
                'reference_number' => $validated['reference_number'] ?: 'PAY-'.strtoupper(Str::random(12)),
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'paid_at' => now(),
            ]);

            if ($lockedFee->fee_type === 'registration'
                && (float) $lockedFee->payments()->sum('amount') >= (float) $lockedFee->amount
                && $lockedFee->enrollment()->where('status', 'pending')->exists()) {
                $enrollment = $lockedFee->enrollment()->firstOrFail();
                $enrollment->update(['status' => 'active']);
                AuditEvent::create([
                    'actor_id' => $request->user()->id,
                    'action' => 'student.enrollment_activated_after_registration_payment',
                    'auditable_type' => $enrollment::class,
                    'auditable_id' => $enrollment->id,
                    'before' => ['status' => 'pending'],
                    'after' => ['status' => 'active', 'student_fee_id' => $lockedFee->id],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            AuditEvent::create([
                'actor_id' => $request->user()->id,
                'action' => 'student_fee.payment_recorded',
                'auditable_type' => StudentFee::class,
                'auditable_id' => $lockedFee->id,
                'after' => ['payment_id' => $payment->id, 'amount' => $payment->amount, 'reference_number' => $payment->reference_number],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', 'Règlement enregistré. Le solde de l’échéance a été mis à jour.');
    }
}
