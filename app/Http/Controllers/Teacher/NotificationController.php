<?php

namespace App\Http\Controllers\Teacher;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController
{
    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->markAsRead();

        return back();
    }
}
