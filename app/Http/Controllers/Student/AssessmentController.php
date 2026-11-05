<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentAnswer;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
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
                ->whereHas('courseUnit.curriculumSemesters.curriculum', fn ($query) => $query
                    ->where('academic_year_id', $enrollment->academic_year_id)
                    ->where('program_id', $enrollment->program_id))
                ->pluck('subjects.id');
            foreach ($subjectIds as $subjectId) {
                $eligiblePairs[] = ['year_id' => $enrollment->academic_year_id, 'subject_id' => $subjectId, 'department_id' => $enrollment->program->department_id, 'enrollment_id' => $enrollment->id];
            }
        }

        $assessments = Assessment::query()
            ->with('subject:id,code,name')
            ->where(function ($query) use ($enrollments) {
                $query->where(fn ($open) => $open->where('status', 'launched')
                    ->where('starts_at', '<=', now())->where('ends_at', '>', now()))
                    ->orWhereHas('attempts', fn ($attempts) => $attempts->whereIn('enrollment_id', $enrollments->pluck('id')));
            })
            ->when($eligiblePairs === [], fn ($query) => $query->whereRaw('1 = 0'))
            ->when($eligiblePairs !== [], fn ($query) => $query->where(function ($query) use ($eligiblePairs) {
                foreach ($eligiblePairs as $pair) {
                    $query->orWhere(fn ($pairQuery) => $pairQuery
                        ->where('academic_year_id', $pair['year_id'])
                        ->where('subject_id', $pair['subject_id'])
                        ->where(fn ($department) => $department->whereNull('department_id')->orWhere('department_id', $pair['department_id'])));
                }
            }))
            ->orderBy('ends_at')
            ->get();

        $attempts = AssessmentAttempt::query()
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->whereIn('assessment_id', $assessments->pluck('id'))
            ->get()->keyBy('assessment_id');

        return Inertia::render('Student/Assessments/Index', [
            'assessments' => $assessments->map(fn (Assessment $assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'type' => $assessment->type,
                'anti_cheat_enabled' => $assessment->anti_cheat_enabled,
                'ends_at' => $assessment->ends_at->toIso8601String(),
                'duration_minutes' => $assessment->duration_minutes,
                'subject' => $assessment->subject,
            'attempt' => $attempts->get($assessment->id)?->only(['id', 'status', 'score', 'submission_reason']),
            ]),
        ]);
    }

    public function show(Request $request, Assessment $assessment): Response
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()->where('assessment_id', $assessment->id)
            ->where('enrollment_id', $enrollment->id)->first();
        abort_unless($this->isOpen($assessment) || $attempt !== null, 404);

        $deadline = $attempt && $assessment->duration_minutes
            ? min($attempt->started_at->copy()->addMinutes($assessment->duration_minutes), $assessment->ends_at)
            : ($attempt?->submitted_at ?? $assessment->ends_at);

        return Inertia::render('Student/Assessments/Show', [
            'assessment' => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'instructions' => $assessment->instructions,
                'type' => $assessment->type,
                'anti_cheat_enabled' => $assessment->anti_cheat_enabled,
                'duration_minutes' => $assessment->duration_minutes,
                'deadline' => $deadline->toIso8601String(),
                'subject' => $assessment->subject()->first(['id', 'code', 'name']),
            ],
            'attempt' => $attempt?->only(['id', 'status', 'score', 'submitted_at', 'submission_reason']),
            'savedAnswers' => $attempt?->answers()->get(['question_id', 'option_id', 'answer_text'])->keyBy('question_id') ?? [],
            'questions' => $attempt && $attempt->status === 'in_progress' && $this->isOpen($assessment)
                ? $assessment->questions()->with('options:id,question_id,option_text,position')->get(['id', 'assessment_id', 'question_text', 'type', 'points', 'position'])
                : [],
        ]);
    }

    public function start(Request $request, Assessment $assessment): RedirectResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        abort_unless($this->isOpen($assessment), 404);

        AssessmentAttempt::firstOrCreate(
            ['assessment_id' => $assessment->id, 'enrollment_id' => $enrollment->id],
            ['started_at' => now(), 'status' => 'in_progress'],
        );

        return redirect()->route('student.assessments.show', $assessment);
    }

    public function submit(Request $request, Assessment $assessment): RedirectResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('enrollment_id', $enrollment->id)
            ->firstOrFail();

        $reason = $request->input('reason', 'student');
        if (! in_array($reason, ['student', 'focus_lost', 'tab_hidden', 'navigation'], true)) {
            throw ValidationException::withMessages(['reason' => 'Motif de remise invalide.']);
        }
        abort_if($reason !== 'student' && ! $assessment->anti_cheat_enabled, 422, 'La remise automatique anti-triche n’est pas activée pour cette évaluation.');

        $answers = $this->validatedAnswers($request, $assessment);
        $questions = $assessment->questions()->with('options')->get()->keyBy('id');

        DB::transaction(function () use ($attempt, $questions, $answers, $assessment, $reason) {
            $lockedAttempt = AssessmentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_if($lockedAttempt->status !== 'in_progress', 409, 'Cette tentative a déjà été remise.');
            $deadline = $assessment->duration_minutes
                ? min($lockedAttempt->started_at->copy()->addMinutes($assessment->duration_minutes), $assessment->ends_at)
                : $assessment->ends_at;
            $deadlinePassed = now()->gt($deadline);
            $lateBeyondGrace = now()->gt($deadline->copy()->addSeconds(15));
            $answersToPersist = $lateBeyondGrace
                ? $lockedAttempt->answers()->get(['question_id', 'option_id', 'answer_text'])->map(fn (AssessmentAnswer $answer) => [
                    'question_id' => $answer->question_id,
                    'option_id' => $answer->option_id,
                    'answer_text' => $answer->answer_text,
                ])->all()
                : $answers;
            $isAntiCheatViolation = in_array($reason, ['focus_lost', 'tab_hidden', 'navigation'], true);
            $submissionReason = $isAntiCheatViolation ? $reason : ($deadlinePassed ? 'timeout' : $reason);
            $this->persistAnswers($lockedAttempt, $answersToPersist);
            $earned = 0.0;
            $maximum = 0.0;
            $hasWrittenQuestions = false;

            foreach ($questions as $question) {
                $maximum += (float) $question->points;
                if ($question->type === 'direct') {
                    $hasWrittenQuestions = true;
                    continue;
                }
                $answer = collect($answersToPersist)->firstWhere('question_id', $question->id);
                $correctOptionId = $question->options->firstWhere('is_correct', true)?->id;
                if ($answer && (int) ($answer['option_id'] ?? 0) === (int) $correctOptionId) {
                    $earned += (float) $question->points;
                }
            }

            $score = $isAntiCheatViolation
                ? 0
                : (($submissionReason === 'timeout' || ! $hasWrittenQuestions) && $maximum > 0
                    ? round(($earned / $maximum) * 10, 2)
                    : null);
            $status = $isAntiCheatViolation || ! $hasWrittenQuestions ? 'corrected' : 'submitted';
            $lockedAttempt->forceFill([
                'submitted_at' => now(),
                'score' => $score,
                'status' => $status,
                'submission_reason' => $submissionReason,
                'focus_violations' => $isAntiCheatViolation ? 1 : 0,
            ])->save();

            AuditEvent::create([
                'actor_id' => auth()->id(),
                'action' => 'assessment.attempt_submitted',
                'auditable_type' => AssessmentAttempt::class,
                'auditable_id' => $lockedAttempt->id,
                'after' => ['status' => $status, 'score' => $score, 'submission_reason' => $submissionReason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return redirect()->route('student.assessments.show', $assessment)->with('success', 'Votre évaluation a été remise.');
    }

    public function saveAnswers(Request $request, Assessment $assessment): RedirectResponse
    {
        $enrollment = $this->eligibleEnrollment($request, $assessment);
        $attempt = AssessmentAttempt::query()->where('assessment_id', $assessment->id)
            ->where('enrollment_id', $enrollment->id)->firstOrFail();
        $answers = $this->validatedAnswers($request, $assessment);
        DB::transaction(function () use ($attempt, $answers, $assessment) {
            $lockedAttempt = AssessmentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_if($lockedAttempt->status !== 'in_progress', 409, 'Cette tentative est déjà remise.');
            $deadline = $assessment->duration_minutes
                ? min($lockedAttempt->started_at->copy()->addMinutes($assessment->duration_minutes), $assessment->ends_at)
                : $assessment->ends_at;
            abort_if(now()->gt($deadline->copy()->addSeconds(15)), 422, 'Le délai de cette évaluation est écoulé.');
            $this->persistAnswers($lockedAttempt, $answers);
        });

        return back();
    }

    /** @return array<int, array{question_id: int|string, option_id?: int|string|null, answer_text?: string|null}> */
    private function validatedAnswers(Request $request, Assessment $assessment): array
    {
        $data = $request->validate(['answers' => ['nullable', 'array', 'max:100']]);
        $questions = $assessment->questions()->with('options')->get()->keyBy('id');
        $seenQuestionIds = [];
        foreach ($data['answers'] ?? [] as $index => $answer) {
            if (! is_array($answer)) {
                throw ValidationException::withMessages(["answers.{$index}" => 'La réponse envoyée est invalide.']);
            }
            $validatedAnswer = validator($answer, [
                'question_id' => ['required', 'integer'],
                'option_id' => ['nullable', 'integer'],
                'answer_text' => ['nullable', 'string', 'max:10000'],
            ])->validate();
            $question = $questions->get($validatedAnswer['question_id']);
            if (! $question || in_array((int) $question->id, $seenQuestionIds, true)) {
                throw ValidationException::withMessages(["answers.{$index}.question_id" => 'La question est invalide ou répétée.']);
            }
            $seenQuestionIds[] = (int) $question->id;
            if ($question->type === 'qcm' && ! empty($validatedAnswer['option_id']) && ! $question->options->contains('id', $validatedAnswer['option_id'])) {
                throw ValidationException::withMessages(["answers.{$index}.option_id" => 'Choisissez une réponse proposée pour ce QCM.']);
            }
            if ($question->type === 'direct' && ! empty($validatedAnswer['option_id'])) {
                throw ValidationException::withMessages(["answers.{$index}.option_id" => 'Cette question attend une réponse écrite.']);
            }
        }

        return $data['answers'] ?? [];
    }

    private function persistAnswers(AssessmentAttempt $attempt, array $answers): void
    {
        foreach ($answers as $answer) {
            $answerText = trim((string) ($answer['answer_text'] ?? ''));
            AssessmentAnswer::updateOrCreate(
                ['attempt_id' => $attempt->id, 'question_id' => $answer['question_id']],
                ['option_id' => $answer['option_id'] ?? null, 'answer_text' => $answerText === '' ? null : $answerText],
            );
        }
    }

    private function isOpen(Assessment $assessment): bool
    {
        return $assessment->status === 'launched' && now()->gte($assessment->starts_at) && now()->lt($assessment->ends_at);
    }

    private function eligibleEnrollment(Request $request, Assessment $assessment): Enrollment
    {
        $student = $request->user()->student()->firstOrFail();
        $enrollments = $student->enrollments()->with('program.department')
            ->where('academic_year_id', $assessment->academic_year_id)
            ->where('status', 'active')->get();

        foreach ($enrollments as $enrollment) {
            $facultyId = $enrollment->program?->department?->faculty_id;
            if (! $facultyId) continue;
            if ($assessment->department_id && (int) $assessment->department_id !== (int) $enrollment->program->department_id) continue;
            $subjectIsInCurriculum = Subject::query()
                ->whereKey($assessment->subject_id)
                ->where(fn ($query) => $query->whereNull('department_id')->orWhere('department_id', $enrollment->program->department_id))
                ->whereHas('courseUnit', fn ($query) => $query->where('faculty_id', $facultyId))
                ->whereHas('courseUnit.curriculumSemesters.curriculum', fn ($query) => $query
                    ->where('academic_year_id', $assessment->academic_year_id)
                    ->where('program_id', $enrollment->program_id))
                ->exists();
            if ($subjectIsInCurriculum) return $enrollment;
        }

        abort(404);
    }
}
