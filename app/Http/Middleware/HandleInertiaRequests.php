<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\PlatformSetting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info'    => fn() => $request->session()->get('info'),
                'temporaryCredentials' => fn() => $request->session()->get('temporaryCredentials'),
            ],
            // Vos autres props partagées (auth, user, etc.)
            'auth' => [
                'user' => $request->user(),
            ],
            'platformSettings' => function () {
                $settings = PlatformSetting::query()
                    ->whereIn('key', ['platform_name', 'contact_email', 'contact_phone', 'address', 'website', 'platform_tagline', 'logo_path', 'emblem_path'])
                    ->pluck('value', 'key')
                    ->all();
                $settings['logo_url'] = !empty($settings['logo_path']) ? Storage::disk('public')->url($settings['logo_path']) : null;
                $settings['emblem_url'] = !empty($settings['emblem_path']) ? Storage::disk('public')->url($settings['emblem_path']) : null;

                return $settings;
            },
            'teacherNotifications' => fn () => $request->user()?->role === 'teacher'
                ? $request->user()->unreadNotifications()->latest()->limit(8)->get()->map(fn ($notification) => [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? 'Notification',
                    'message' => $notification->data['message'] ?? '',
                    'url' => $notification->data['url'] ?? route('teacher.grades.index'),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ])->values()
                : [],
        ]);
    }
}
