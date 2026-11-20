<?php

namespace App\Console\Commands;

use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Services\AssessmentSubmissionService;
use Illuminate\Console\Command;

class SubmitExpiredAssessmentAttempts extends Command
{
    protected $signature = 'assessments:submit-expired';
    protected $description = 'Soumet automatiquement les copies dont le délai est écoulé.';

    public function handle(AssessmentSubmissionService $submission): int
    {
        $attempts = AssessmentAttempt::query()
            ->with('assessment')
            ->where('status', 'in_progress')
            ->get();

        $submitted = 0;
        foreach ($attempts as $attempt) {
            $assessment = $attempt->assessment;
            if (! $assessment instanceof Assessment || now()->lte($submission->deadlineFor($attempt, $assessment))) {
                continue;
            }

            $submission->submit($attempt, $assessment, $submission->savedAnswers($attempt), 'timeout');
            $submitted++;
        }

        Assessment::query()->where('status', 'launched')->where('ends_at', '<=', now())->update(['status' => 'closed']);
        $this->info("{$submitted} copie(s) soumise(s) automatiquement.");

        return self::SUCCESS;
    }
}
