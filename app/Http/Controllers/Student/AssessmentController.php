<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Services\AssessmentSubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student()->first();
        $enrollments = $student?->enrollments()->with('program.department')->where('status', 'active')->get() ?? collect();
        $eligiblePairs = [];

        foreach ($enrollments as $enrollment) {
            $facultyId = $enrollment->program?->department?->faculty_id;
            if (! $facultyId) continue;
            $subjectIds = Subject::query()
                ->whereHas('courseUnit', fn ($query) => $query->where('faculty_id', $facultyId))
                ->where(fn ($query) => $query->whereNull('department_id')->orWhere('department_id', $enrollment->program->department_id))
                ->whereHas('courseUnit.curriculumSemesters.curriculum', fn ($query) => $query->where('academic_year_id', $enrollment->academic_year_id)->where('program_id', $enrollment->program_id))
                ->pluck('subjects.id');
            foreach ($subjectIds as $subjectId) {
                $eligiblePairs[] = ['year_id' => $enrollment->academic_year_id, 'subject_id' => $subjectId, 'department_id' => $enrollment->program->department_id];
            }
        }

        $assessments = Assessment::query()->with('subject:id,code,name')
            ->where(function ($query) use ($enrollments) {
                $query->where(fn ($open) => $open->where('status', 'launched')->where('starts_at', '<=', now())->where('ends_at', '>', now()))
                    ->orWhereHas('attempts', fn ($attempts) => $attempts->whereIn('enrollment_id', $enrollments->pluck('id')));
            })
            ->when($eligiblePairs === [], fn ($query) => $query->whereRaw('1 = 0'))
            ->when($eligiblePairs !== [], fn ($query) => $query->where(function ($query) use ($eligiblePairs) {
                foreach ($eligiblePairs as $pair) {
                    $query->orWhere(fn ($pairQuery) => $pairQuery->where('academic_year_id', $pair['year_id'])->where('subject_id', $pair['subject_id'])->where(fn ($department) => $department->whereNull('department_id')->orWhere('department_id', $pair['department_id'])));
                }
            }))->orderBy('ends_at')->get();

        $attempts = AssessmentAttempt::query()->whereIn('enrollment_id', $enrollments->pluck('id'))->whereIn('assessment_id', $assessments->pluck('id'))->get()->keyBy('assessment_id');

        return Inertia::render('Student/Assessments/Index', ['assessments' => $assessments->map(fn (Assessment $assessment) => [
            'id' => $assessment->id,
            'title' => $assessment->title,
            'type' => $assessment->type,
            'anti_cheat_enabled' => $assessment->anti_cheat_enabled,
            'ends_at' => $assessment->ends_at->toIso8601String(),
            'duration_minutes' => $assessment->duration_minutes,
            'subject' => $assessment->subject,
            'attempt' => $attempts->get($assessment->id)?->only(['id', 'status', 'score', 'submission_reason']),
        ])]);
    }

    public function show(Request $request, Assessment $assessment, AssessmentSubmissionService $submission): Response
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()->where('assessment_id', $assessment->id)->where('enrollment_id', $enrollment->id)->first();
        if ($attempt && $attempt->status === 'in_progress' && now()->gt($submission->deadlineFor($attempt, $assessment))) {
            $submission->submit($attempt, $assessment, $submission->savedAnswers($attempt), 'timeout', $request->user()->id, $request->ip(), $request->userAgent());
            $attempt->refresh();
        }
        abort_unless($this->isOpen($assessment) || $attempt !== null, 404);
        $deadline = $attempt ? $submission->deadlineFor($attempt, $assessment) : $assessment->ends_at;

        return Inertia::render('Student/Assessments/Show', [
            'assessment' => ['id' => $assessment->id, 'title' => $assessment->title, 'instructions' => $assessment->instructions, 'type' => $assessment->type, 'anti_cheat_enabled' => $assessment->anti_cheat_enabled, 'duration_minutes' => $assessment->duration_minutes, 'deadline' => $deadline->toIso8601String(), 'subject' => $assessment->subject()->first(['id', 'code', 'name'])],
            'attempt' => $attempt?->only(['id', 'status', 'score', 'submitted_at', 'submission_reason']),
            'savedAnswers' => $attempt?->answers()->get(['question_id', 'option_id', 'answer_text'])->keyBy('question_id') ?? [],
            'questions' => $attempt && $attempt->status === 'in_progress' && $this->isOpen($assessment) ? $assessment->questions()->with('options:id,question_id,option_text,position')->get(['id', 'assessment_id', 'question_text', 'type', 'points', 'position']) : [],
        ]);
    }

    public function start(Request $request, Assessment $assessment): RedirectResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        abort_unless($this->isOpen($assessment), 404);
        AssessmentAttempt::firstOrCreate(['assessment_id' => $assessment->id, 'enrollment_id' => $enrollment->id], ['started_at' => now(), 'status' => 'in_progress']);
        return redirect()->route('student.assessments.show', $assessment);
    }

    public function submit(Request $request, Assessment $assessment, AssessmentSubmissionService $submission): RedirectResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()->where('assessment_id', $assessment->id)->where('enrollment_id', $enrollment->id)->firstOrFail();
        $reason = $request->input('reason', 'student');
        if (! in_array($reason, ['student', 'focus_lost', 'tab_hidden', 'navigation'], true)) {
            throw ValidationException::withMessages(['reason' => 'Motif de remise invalide.']);
        }
        abort_if($reason !== 'student' && ! $assessment->anti_cheat_enabled, 422, 'La remise automatique anti-triche n’est pas activée pour cette évaluation.');
        $submission->submit($attempt, $assessment, $this->validatedAnswers($request, $assessment), $reason, $request->user()->id, $request->ip(), $request->userAgent());
        return redirect()->route('student.assessments.show', $assessment)->with('success', 'Votre évaluation a été remise.');
    }

    public function saveAnswers(Request $request, Assessment $assessment, AssessmentSubmissionService $submission): RedirectResponse|HttpResponse|JsonResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()->where('assessment_id', $assessment->id)->where('enrollment_id', $enrollment->id)->firstOrFail();
        $answers = $this->validatedAnswers($request, $assessment);
        if (now()->gt($submission->deadlineFor($attempt, $assessment))) {
            $attempt = $submission->submit($attempt, $assessment, $answers, 'timeout', $request->user()->id, $request->ip(), $request->userAgent());
            if ($request->expectsJson()) return response()->json(['submitted' => true, 'status' => $attempt->status]);
            return redirect()->route('student.assessments.show', $assessment)->with('success', 'Le délai est écoulé : votre copie a été remise automatiquement.');
        }
        DB::transaction(function () use ($attempt, $answers) {
            $lockedAttempt = AssessmentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_if($lockedAttempt->status !== 'in_progress', 409, 'Cette tentative est déjà remise.');
            foreach ($answers as $answer) {
                $answerText = trim((string) ($answer['answer_text'] ?? ''));
                $lockedAttempt->answers()->updateOrCreate(['question_id' => $answer['question_id']], ['option_id' => $answer['option_id'] ?? null, 'answer_text' => $answerText === '' ? null : $answerText]);
            }
        });
        return $request->expectsJson() ? response()->noContent() : back();
    }

    /** @return array<int, array{question_id: int|string, option_id?: int|string|null, answer_text?: string|null}> */
    private function validatedAnswers(Request $request, Assessment $assessment): array
    {
        $data = $request->validate(['answers' => ['nullable', 'array', 'max:100']]);
        $questions = $assessment->questions()->with('options')->get()->keyBy('id');
        $seenQuestionIds = [];
        foreach ($data['answers'] ?? [] as $index => $answer) {
            if (! is_array($answer)) throw ValidationException::withMessages(["answers.{$index}" => 'La réponse envoyée est invalide.']);
            $validatedAnswer = validator($answer, ['question_id' => ['required', 'integer'], 'option_id' => ['nullable', 'integer'], 'answer_text' => ['nullable', 'string', 'max:10000']])->validate();
            $question = $questions->get($validatedAnswer['question_id']);
            if (! $question || in_array((int) $question->id, $seenQuestionIds, true)) throw ValidationException::withMessages(["answers.{$index}.question_id" => 'La question est invalide ou répétée.']);
            $seenQuestionIds[] = (int) $question->id;
            if ($question->type === 'qcm' && ! empty($validatedAnswer['option_id']) && ! $question->options->contains('id', $validatedAnswer['option_id'])) throw ValidationException::withMessages(["answers.{$index}.option_id" => 'Choisissez une réponse proposée pour ce QCM.']);
            if ($question->type === 'direct' && ! empty($validatedAnswer['option_id'])) throw ValidationException::withMessages(["answers.{$index}.option_id" => 'Cette question attend une réponse écrite.']);
        }
        return $data['answers'] ?? [];
    }

    private function isOpen(Assessment $assessment): bool
    {
        return $assessment->status === 'launched' && now()->gte($assessment->starts_at) && now()->lt($assessment->ends_at);
    }

    private function eligibleEnrollment(Request $request, Assessment $assessment): Enrollment
    {
        $student = $request->user()->student()->firstOrFail();
        $enrollments = $student->enrollments()->with('program.department')->where('academic_year_id', $assessment->academic_year_id)->where('status', 'active')->get();
        foreach ($enrollments as $enrollment) {
            $facultyId = $enrollment->program?->department?->faculty_id;
            if (! $facultyId || ($assessment->department_id && (int) $assessment->department_id !== (int) $enrollment->program->department_id)) continue;
            $subject = Subject::query()->whereKey($assessment->subject_id)->where(fn ($query) => $query->whereNull('department_id')->orWhere('department_id', $enrollment->program->department_id))->whereHas('courseUnit', fn ($query) => $query->where('faculty_id', $facultyId))->first();
            if (! $subject) continue;
            $hasCurriculumLink = $subject->courseUnit->curriculumSemesters()->whereHas('curriculum', fn ($query) => $query->where('academic_year_id', $assessment->academic_year_id)->where('program_id', $enrollment->program_id))->exists();
            $curriculumExistsForPair = \App\Models\Curriculum::query()->where('academic_year_id', $assessment->academic_year_id)->where('program_id', $enrollment->program_id)->exists();
            if ($hasCurriculumLink || ! $curriculumExistsForPair) return $enrollment;
        }
        abort(404);
    }
}
