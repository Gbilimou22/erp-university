<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ResetAssessmentData extends Command
{
    protected $signature = 'assessments:reset {--force : Skip the confirmation prompt} {--dry-run : Show the rows that would be deleted without changing data}';

    protected $description = 'Delete assessment data and its attributable assessment grades.';

    public function handle(): int
    {
        $gradeIds = $this->attributableGradeIds();
        $counts = $this->recordCounts($gradeIds->count());

        $this->table(['Assessment data', 'Rows'], [
            ['Assessments', $counts['assessments']],
            ['Questions', $counts['assessment_questions']],
            ['Options', $counts['assessment_options']],
            ['Attempts', $counts['assessment_attempts']],
            ['Answers', $counts['assessment_answers']],
            ['Attributable assessment grades', $counts['grades']],
        ]);

        if ($this->option('dry-run')) {
            $this->info('Dry run complete. No assessment rows were deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('This will permanently delete all assessment data. Do you wish to continue?')) {
            $this->info('Assessment reset cancelled.');

            return self::FAILURE;
        }

        $deleted = DB::transaction(function (): array {
            $gradeIds = $this->attributableGradeIds();
            $deleted = $this->recordCounts($gradeIds->count());

            DB::table('assessment_answers')->delete();
            DB::table('assessment_options')->delete();
            DB::table('assessment_attempts')->delete();
            DB::table('assessment_questions')->delete();
            DB::table('assessments')->delete();

            $deleted['grades'] = $gradeIds->isEmpty()
                ? 0
                : DB::table('grades')->whereIn('id', $gradeIds)->delete();

            return $deleted;
        });

        $this->info(sprintf(
            'Deleted %d assessment(s), %d question(s), %d option(s), %d attempt(s), %d answer(s), and %d attributable grade(s).',
            $deleted['assessments'],
            $deleted['assessment_questions'],
            $deleted['assessment_options'],
            $deleted['assessment_attempts'],
            $deleted['assessment_answers'],
            $deleted['grades'],
        ));

        return self::SUCCESS;
    }

    /**
     * Find only grade rows whose full assessment-write key is backed by an attempt.
     *
     * @return Collection<int, int>
     */
    private function attributableGradeIds(): Collection
    {
        return DB::table('assessment_attempts')
            ->join('assessments', 'assessments.id', '=', 'assessment_attempts.assessment_id')
            ->join('grades', 'grades.enrollment_id', '=', 'assessment_attempts.enrollment_id')
            ->whereColumn('grades.subject_id', 'assessments.subject_id')
            ->whereColumn('grades.assessment_label', 'assessments.title')
            ->whereColumn('grades.entered_by', 'assessments.teacher_id')
            ->where('grades.type', 'cc')
            ->distinct()
            ->pluck('grades.id');
    }

    /**
     * @return array<string, int>
     */
    private function recordCounts(int $gradeCount): array
    {
        return [
            'assessments' => DB::table('assessments')->count(),
            'assessment_questions' => DB::table('assessment_questions')->count(),
            'assessment_options' => DB::table('assessment_options')->count(),
            'assessment_attempts' => DB::table('assessment_attempts')->count(),
            'assessment_answers' => DB::table('assessment_answers')->count(),
            'grades' => $gradeCount,
        ];
    }
}