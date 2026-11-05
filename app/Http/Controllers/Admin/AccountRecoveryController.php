<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AccountRecoveryController extends Controller
{
    public function index(): Response
    {
        $search = trim((string) request('search', ''));
        $users = User::query()
            ->where('role', '!=', 'admin')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user) => $user->only(['id', 'name', 'email', 'role', 'is_active']));

        return Inertia::render('Admin/AccountRecovery/Index', [
            'users' => $users,
            'filters' => ['search' => $search],
            'temporaryPassword' => session('temporary_password'),
            'recoveredUser' => session('recovered_user'),
        ]);
    }

    public function reset(User $user): RedirectResponse
    {
        abort_if($user->isAdmin() || $user->is(auth()->user()), 403);

        $temporaryPassword = Str::password(20);

        DB::transaction(function () use ($user, $temporaryPassword) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            abort_if($lockedUser->isAdmin() || $lockedUser->is(auth()->user()), 403);

            $lockedUser->forceFill([
                'password' => Hash::make($temporaryPassword),
                'remember_token' => Str::random(60),
                'must_change_password' => true,
            ])->save();

            DB::table('sessions')->where('user_id', $lockedUser->id)->delete();

            AuditEvent::create([
                'actor_id' => auth()->id(),
                'action' => 'account.password_reset_by_admin',
                'auditable_type' => User::class,
                'auditable_id' => $lockedUser->id,
                'after' => ['must_change_password' => true],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return back()->with('temporary_password', $temporaryPassword)
            ->with('recovered_user', $user->name);
    }
}
