<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\Grade;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GradePublicationController extends Controller
{
    public function index(): Response
    {
        $assessments = Grade::query()
            ->join('enrollments', 'grades.enrollment_id', '=', 'enrollments.id')
            ->join('subjects', 'grades.subject_id', '=', 'subjects.id')
            ->join('academic_years', 'enrollments.academic_year_id', '=', 'academic_years.id')
            ->where('grades.status', 'draft')
            ->select([
                'grades.subject_id',
                'grades.type',
                'grades.assessment_label',
                'enrollments.academic_year_id',
                'subjects.code as subject_code',
                'subjects.name as subject_name',
                'academic_years.name as academic_year_name',
            ])
            ->selectRaw('COUNT(DISTINCT grades.enrollment_id) as student_count')
            ->groupBy([
                'grades.subject_id', 'grades.type', 'grades.assessment_label',
                'enrollments.academic_year_id', 'subjects.code', 'subjects.name', 'academic_years.name',
            ])
            ->orderBy('academic_years.name')
            ->orderBy('subjects.name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Grades/Index', [
            'assessments' => $assessments,
            'flash' => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    public function publish(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'academic_year_id' => ['required', 'integer', Rule::exists('academic_years', 'id')],
            'type' => ['required', Rule::in(['cc', 'exam', 'rattrapage'])],
            'assessment_label' => ['nullable', 'string', 'max:100'],
        ]);

        $count = DB::transaction(function () use ($data, $request) {
            $grades = Grade::query()
                ->where('subject_id', $data['subject_id'])
                ->where('type', $data['type'])
                ->where('status', 'draft')
                ->whereHas('enrollment', fn ($query) => $query->where('academic_year_id', $data['academic_year_id']))
                ->when(
                    $data['assessment_label'] === null,
                    fn ($query) => $query->whereNull('assessment_label'),
                    fn ($query) => $query->where('assessment_label', $data['assessment_label']),
                )
                ->lockForUpdate();

            $gradeIds = $grades->pluck('id');
            $count = $gradeIds->count();
            if ($count === 0) {
                return 0;
            }

            Grade::query()->whereIn('id', $gradeIds)->update([
                'status' => 'published',
                'published_by' => $request->user()->id,
                'published_at' => now(),
            ]);

            AuditEvent::create([
                'actor_id' => $request->user()->id,
                'action' => 'grades.assessment_published',
                'after' => [
                    'subject_id' => $data['subject_id'],
                    'academic_year_id' => $data['academic_year_id'],
                    'type' => $data['type'],
                    'assessment_label' => $data['assessment_label'],
                    'grade_count' => $count,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $count;
        });

        if ($count === 0) {
            return back()->with('error', 'Aucune note brouillon ne correspond à cette évaluation.');
        }

        return back()->with('success', "{$count} note(s) publiée(s). Les étudiants peuvent maintenant les consulter.");
    }
}
