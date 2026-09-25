<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $role = strtolower((string) ($user?->role ?? $user?->user_type ?? ''));
        $allowedRoles = array_map('strtolower', $roles);

        abort_unless($user && in_array($role, $allowedRoles, true), 403);

        return $next($request);
    }
}
