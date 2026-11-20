<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentAttempt;
use App\Models\AuditEvent;
use App\Models\Grade;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AssessmentSubmissionService
{
    /** @param array<int, array{question_id: int|string, option_id?: int|string|null, answer_text?: string|null}> $answers */
    public function submit(
        AssessmentAttempt $attempt,
        Assessment $assessment,
        array $answers,
        string $reason,
        ?int $actorId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): AssessmentAttempt {
        return DB::transaction(function () use ($attempt, $assessment, $answers, $reason, $actorId, $ipAddress, $userAgent) {
            $lockedAttempt = AssessmentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_if($lockedAttempt->status !== 'in_progress', 409, 'Cette tentative a déjà été remise.');

            $deadline = $this->deadlineFor($lockedAttempt, $assessment);
            $isAntiCheatViolation = in_array($reason, ['focus_lost', 'tab_hidden', 'navigation'], true);
            $submissionReason = $isAntiCheatViolation ? $reason : (now()->gt($deadline) ? 'timeout' : $reason);
            $answersToPersist = now()->gt($deadline->copy()->addSeconds(15))
                ? $this->savedAnswers($lockedAttempt)
                : $answers;

            $this->persistAnswers($lockedAttempt, $answersToPersist);
            $questions = $assessment->questions()->with('options')->get();
            $maximum = (float) $questions->sum(fn ($question) => (float) $question->points);
            $earned = 0.0;
            $hasWrittenQuestions = false;

            foreach ($questions as $question) {
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

            // En cas d'expiration, les questions écrites non corrigées comptent provisoirement pour zéro.
            // L'enseignant conserve ensuite la main pour attribuer la note finale d'une copie écrite ou mixte.
            $score = $isAntiCheatViolation
                ? 0.0
                : (($submissionReason === 'timeout' || ! $hasWrittenQuestions) && $maximum > 0
                    ? round(($earned / $maximum) * 10, 2)
                    : null);
            $status = $isAntiCheatViolation || ! $hasWrittenQuestions ? 'corrected' : 'submitted';

            $lockedAttempt->forceFill([
                'submitted_at' => now(),
                'score' => $score,
                'status' => $status,
                'submission_reason' => $submissionReason,
                'focus_violations' => $isAntiCheatViolation ? max(1, (int) $lockedAttempt->focus_violations) : (int) $lockedAttempt->focus_violations,
            ])->save();

            if ($status === 'corrected' && $score !== null) {
                Grade::updateOrCreate([
                    'enrollment_id' => $lockedAttempt->enrollment_id,
                    'subject_id' => $assessment->subject_id,
                    'type' => 'cc',
                    'assessment_label' => $assessment->title,
                ], [
                    'score' => $score,
                    'entered_by' => $assessment->teacher_id,
                    'status' => 'draft',
                    'published_by' => null,
                    'published_at' => null,
                ]);
            }

            AuditEvent::create([
                'actor_id' => $actorId,
                'action' => 'assessment.attempt_submitted',
                'auditable_type' => AssessmentAttempt::class,
                'auditable_id' => $lockedAttempt->id,
                'after' => ['status' => $status, 'score' => $score, 'submission_reason' => $submissionReason],
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);

            return $lockedAttempt->fresh();
        });
    }

    public function deadlineFor(AssessmentAttempt $attempt, Assessment $assessment): Carbon
    {
        return $assessment->duration_minutes
            ? min($attempt->started_at->copy()->addMinutes($assessment->duration_minutes), $assessment->ends_at)
            : $assessment->ends_at->copy();
    }

    /** @return array<int, array{question_id: int, option_id: int|null, answer_text: string|null}> */
    public function savedAnswers(AssessmentAttempt $attempt): array
    {
        return $attempt->answers()->get(['question_id', 'option_id', 'answer_text'])->map(fn (AssessmentAnswer $answer) => [
            'question_id' => $answer->question_id,
            'option_id' => $answer->option_id,
            'answer_text' => $answer->answer_text,
        ])->all();
    }

    /** @param array<int, array{question_id: int|string, option_id?: int|string|null, answer_text?: string|null}> $answers */
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
}
