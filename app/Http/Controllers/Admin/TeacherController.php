<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => User::query()->where('role', 'teacher')->withCount('taughtSubjects')
                ->orderBy('name')->get(['id', 'name', 'email', 'is_active', 'created_at']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);
        $temporaryPassword = Str::password(16, true, true, false);

        $teacher = DB::transaction(fn () => User::create([
            'name' => trim($data['name']),
            'email' => strtolower($data['email']),
            'password' => $temporaryPassword,
            'role' => 'teacher',
            'is_active' => true,
            'must_change_password' => true,
            // The administrator provisions this account and delivers its credentials directly.
            'email_verified_at' => now(),
        ]));

        return redirect()->route('admin.teachers.index')
            ->with('success', 'Compte enseignant créé. Remettez les identifiants temporaires à son titulaire.')
            ->with('temporaryCredentials', ['email' => $teacher->email, 'password' => $temporaryPassword]);
    }
}
