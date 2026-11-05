<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GradesPublishedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $subjectId,
        private readonly string $subjectName,
        private readonly string $academicYear,
        private readonly string $assessmentType,
        private readonly ?string $assessmentLabel,
        private readonly int $gradeCount,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $type = match ($this->assessmentType) {
            'exam' => 'Examen',
            'rattrapage' => 'Rattrapage',
            default => 'Contrôle continu',
        };

        return [
            'kind' => 'grades_published',
            'title' => 'Notes publiées',
            'message' => sprintf(
                '%s notes de %s%s (%s) sont publiées.',
                $this->gradeCount,
                $this->subjectName,
                $this->assessmentLabel ? ' — '.$this->assessmentLabel : '',
                $type,
            ),
            'subject_id' => $this->subjectId,
            'academic_year' => $this->academicYear,
            'assessment_type' => $this->assessmentType,
            'assessment_label' => $this->assessmentLabel,
            'grade_count' => $this->gradeCount,
            'url' => route('teacher.grades.index', ['subject_id' => $this->subjectId]),
        ];
    }
}
