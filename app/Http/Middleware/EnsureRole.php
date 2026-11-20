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
        abort_unless($user, 403);

        $allowedRoles = array_map('strtolower', $roles);
        $allowed = false;

        foreach ($allowedRoles as $allowedRole) {
            if ($user->hasRole($allowedRole)) {
                $allowed = true;
                break;
            }
        }

        abort_unless($allowed, 403);

        return $next($request);
    }
}
