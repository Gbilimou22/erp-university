<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->must_change_password && !$request->routeIs('first-login.password.*')) {
            return redirect()->route('first-login.password.edit');
        }

        return $next($request);
    }
}
