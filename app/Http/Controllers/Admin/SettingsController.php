<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $platformSettings = PlatformSetting::query()->pluck('value', 'key')->all();
        $platformSettings['logo_url'] = !empty($platformSettings['logo_path'])
            ? Storage::disk('public')->url($platformSettings['logo_path'])
            : null;
        $platformSettings['emblem_url'] = !empty($platformSettings['emblem_path'])
            ? Storage::disk('public')->url($platformSettings['emblem_path'])
            : null;

        return Inertia::render('Admin/Settings/Index', [
            'platformSettings' => $platformSettings,
            'departments' => Department::query()
                ->with(['faculty:id,name', 'feeSchedules.academicYear:id,name'])
                ->orderBy('name')
                ->get(['id', 'faculty_id', 'code', 'name']),
            'academicYears' => AcademicYear::query()
                ->orderByDesc('is_current')
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'start_date', 'end_date', 'is_current']),
        ]);
    }

    public function updatePlatform(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'platform_name' => ['required', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'platform_tagline' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
            'emblem' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_emblem' => ['nullable', 'boolean'],
        ]);

        $previousPaths = [];
        $newPaths = [];
        try {
            foreach (['logo', 'emblem'] as $imageField) {
                if ($request->hasFile($imageField)) {
                    $path = $request->file($imageField)->storePublicly('platform', 'public');
                    if (!$path) {
                        throw new \RuntimeException("Le téléversement du fichier {$imageField} a échoué.");
                    }
                    $newPaths[] = $path;
                    $validated[$imageField.'_path'] = $path;
                    $previousPaths[$imageField] = PlatformSetting::query()
                        ->where('key', $imageField.'_path')
                        ->value('value');
                } elseif ($request->boolean('remove_'.$imageField)) {
                    $validated[$imageField.'_path'] = null;
                    $previousPaths[$imageField] = PlatformSetting::query()
                        ->where('key', $imageField.'_path')
                        ->value('value');
                }
            }

            DB::transaction(function () use ($validated): void {
                foreach (collect($validated)->except(['logo', 'emblem', 'remove_logo', 'remove_emblem'])->all() as $key => $value) {
                    PlatformSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
                }
            });
        } catch (Throwable $exception) {
            foreach ($newPaths as $newPath) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        foreach ($previousPaths as $previousPath) {
            if ($previousPath && Str::startsWith($previousPath, 'platform/') && !Storage::disk('public')->delete($previousPath)) {
                Log::warning('An old platform brand image could not be removed.', ['path' => $previousPath]);
            }
        }

        return back()->with('success', 'Informations de la plateforme mises à jour.');
    }

    public function saveDepartmentFeeSchedule(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'registration_amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'registration_due_date' => ['required', 'date_format:Y-m-d'],
            'tuition_installment_1_amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'tuition_installment_1_due_date' => ['required', 'date_format:Y-m-d', 'after:registration_due_date'],
            'tuition_installment_2_amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'tuition_installment_2_due_date' => ['required', 'date_format:Y-m-d', 'after:tuition_installment_1_due_date'],
            'tuition_installment_3_amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'tuition_installment_3_due_date' => ['required', 'date_format:Y-m-d', 'after:tuition_installment_2_due_date'],
        ]);

        $academicYear = AcademicYear::findOrFail($validated['academic_year_id']);
        foreach ([
            'registration_due_date',
            'tuition_installment_1_due_date',
            'tuition_installment_2_due_date',
            'tuition_installment_3_due_date',
        ] as $dateField) {
            if ($validated[$dateField] < $academicYear->start_date->toDateString()
                || $validated[$dateField] > $academicYear->end_date->toDateString()) {
                throw ValidationException::withMessages([
                    $dateField => 'La date doit être comprise dans l’année universitaire sélectionnée.',
                ]);
            }
        }

        $department->feeSchedules()->updateOrCreate(
            ['academic_year_id' => $academicYear->id],
            collect($validated)->except('academic_year_id')->all(),
        );

        return back()->with('success', 'Barème de scolarité du département enregistré.');
    }
}
