<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FirstLoginPasswordController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        if (!$request->user()->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/FirstLoginPassword');
    }

    public function update(Request $request): RedirectResponse
    {
        if (!$request->user()->must_change_password) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        if (Hash::check($validated['password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => 'Choisissez un mot de passe différent du mot de passe temporaire.',
            ]);
        }

        $request->user()->forceFill([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ])->save();

        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', 'Votre nouveau mot de passe est enregistré.');
    }
}
