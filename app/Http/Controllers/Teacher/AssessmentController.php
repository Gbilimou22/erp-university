<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentOption;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentAttempt;
use App\Models\AuditEvent;
use App\Models\Subject;
use App\Services\SubjectEligibility;
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
        $year = AcademicYear::where('is_current', true)->first();
        $assessments = Assessment::query()
            ->with('subject:id,code,name')
            ->withCount('attempts')
            ->where('teacher_id', $request->user()->id)
            ->when($year, fn ($query) => $query->where('academic_year_id', $year->id))
            ->latest('starts_at')
            ->paginate(20);

        return Inertia::render('Teacher/Assessments/Index', [
            'assessments' => $assessments,
            'subjects' => $year ? $request->user()->taughtSubjects()
                ->wherePivot('academic_year_id', $year->id)
                ->orderBy('name')->get(['subjects.id', 'subjects.code', 'subjects.name']) : [],
            'academicYear' => $year?->only(['id', 'name']),
        ]);
    }

    public function store(Request $request, SubjectEligibility $eligibility): RedirectResponse
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();
        $data = $request->validate([
            'subject_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:150'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', 'in:qcm,direct,mixed,other'],
            'starts_at' => ['required', 'date', 'after_or_equal:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'anti_cheat_enabled' => ['required', 'boolean'],
            'questions' => ['required', 'array', 'min:1', 'max:100'],
            'questions.*.text' => ['required', 'string', 'max:5000'],
            'questions.*.type' => ['required', 'in:qcm,direct'],
            'questions.*.points' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'questions.*.options' => ['nullable', 'array', 'max:10'],
            'questions.*.options.*.text' => ['required', 'string', 'max:1000'],
            'questions.*.options.*.is_correct' => ['required', 'boolean'],
        ]);

        $subject = $request->user()->taughtSubjects()
            ->where('subjects.id', $data['subject_id'])
            ->wherePivot('academic_year_id', $year->id)
            ->with('courseUnit:id,faculty_id')
            ->firstOrFail();

        if ($eligibility->programIds($subject, (int) $year->id) === []) {
            throw ValidationException::withMessages(['subject_id' => 'Aucun programme étudiant n’est rattaché à cette matière pour l’année courante.']);
        }

        foreach ($data['questions'] as $index => $question) {
            $options = $question['options'] ?? [];
            if ($question['type'] === 'qcm' && (count($options) < 2 || count(array_filter($options, fn ($option) => $option['is_correct'])) !== 1)) {
                throw ValidationException::withMessages(["questions.{$index}.options" => 'Chaque QCM doit proposer au moins deux choix et une seule bonne réponse.']);
            }
        }

        $assessment = DB::transaction(function () use ($data, $year, $request) {
            $assessment = Assessment::create([
                'teacher_id' => $request->user()->id,
                'subject_id' => $data['subject_id'],
                'academic_year_id' => $year->id,
                'title' => $data['title'],
                'instructions' => $data['instructions'] ?? null,
                'type' => $data['type'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'anti_cheat_enabled' => $data['anti_cheat_enabled'],
                'status' => 'draft',
            ]);

            foreach ($data['questions'] as $position => $questionData) {
                $question = AssessmentQuestion::create([
                    'assessment_id' => $assessment->id,
                    'question_text' => $questionData['text'],
                    'type' => $questionData['type'],
                    'points' => $questionData['points'],
                    'position' => $position + 1,
                ]);
                foreach ($questionData['type'] === 'qcm' ? ($questionData['options'] ?? []) : [] as $optionPosition => $optionData) {
                    AssessmentOption::create([
                        'question_id' => $question->id,
                        'option_text' => $optionData['text'],
                        'is_correct' => $questionData['type'] === 'qcm' && (bool) $optionData['is_correct'],
                        'position' => $optionPosition + 1,
                    ]);
                }
            }

            AuditEvent::create([
                'actor_id' => $request->user()->id,
                'action' => 'assessment.created',
                'auditable_type' => Assessment::class,
                'auditable_id' => $assessment->id,
                'after' => ['subject_id' => $assessment->subject_id, 'title' => $assessment->title, 'starts_at' => $assessment->starts_at->toIso8601String()],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $assessment;
        });

        return back()->with('success', "Évaluation « {$assessment->title} » créée. Lancez-la à l’heure prévue pour la rendre visible aux étudiants concernés.");
    }

    public function launch(Request $request, Assessment $assessment): RedirectResponse
    {
        abort_unless($assessment->teacher_id === $request->user()->id, 404);
        abort_unless($assessment->status === 'draft', 409, 'Cette évaluation a déjà été lancée ou clôturée.');
        abort_if(now()->lt($assessment->starts_at) || now()->gte($assessment->ends_at), 422, 'L’évaluation ne peut être lancée qu’entre ses heures de début et de fin.');

        DB::transaction(function () use ($assessment, $request) {
            $assessment->forceFill(['status' => 'launched', 'launched_at' => now()])->save();
            AuditEvent::create([
                'actor_id' => $request->user()->id,
                'action' => 'assessment.launched',
                'auditable_type' => Assessment::class,
                'auditable_id' => $assessment->id,
                'after' => ['status' => 'launched'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', 'Évaluation lancée : elle est maintenant visible par les étudiants concernés.');
    }

    public function results(Request $request, Assessment $assessment): Response
    {
        abort_unless($assessment->teacher_id === $request->user()->id, 404);
        $assessment->load('subject:id,code,name', 'questions.options');
        $attempts = $assessment->attempts()->with([
            'enrollment.student:id,registration_number,first_name,last_name',
            'answers.question:id,question_text,type,points,position',
            'answers.option:id,option_text',
        ])->orderByDesc('submitted_at')->paginate(30);

        $rankedAttempts = $assessment->attempts()
            ->with('enrollment.student:id,registration_number,first_name,last_name')
            ->where('status', 'corrected')->whereNotNull('score')
            ->orderByDesc('score')
            ->orderBy('submitted_at')
            ->get();
        $ranking = [];
        $rank = 0;
        $previousScore = null;
        foreach ($rankedAttempts as $index => $rankedAttempt) {
            $score = (float) $rankedAttempt->score;
            if ($previousScore === null || $score < $previousScore) $rank = $index + 1;
            $previousScore = $score;
            $ranking[] = [
                'rank' => $rank,
                'score' => $score,
                'submitted_at' => $rankedAttempt->submitted_at?->toIso8601String(),
                'focus_violations' => $rankedAttempt->focus_violations,
                'student' => $rankedAttempt->enrollment->student->only(['registration_number', 'first_name', 'last_name']),
            ];
        }

        return Inertia::render('Teacher/Assessments/Results', [
            'assessment' => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'anti_cheat_enabled' => $assessment->anti_cheat_enabled,
                'subject' => $assessment->subject,
                'questions' => $assessment->questions->map(fn ($question) => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'type' => $question->type,
                    'points' => $question->points,
                    'options' => $question->options->map(fn ($option) => $option->only(['id', 'option_text', 'is_correct'])),
                ]),
            ],
            'attempts' => $attempts,
            'ranking' => $ranking,
        ]);
    }

    public function correct(Request $request, Assessment $assessment, AssessmentAttempt $attempt): RedirectResponse
    {
        abort_unless($assessment->teacher_id === $request->user()->id && $attempt->assessment_id === $assessment->id, 404);
        $data = $request->validate(['score' => ['required', 'numeric', 'min:0', 'max:10']]);

        DB::transaction(function () use ($attempt, $data, $request) {
            $lockedAttempt = AssessmentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_unless($lockedAttempt->status === 'submitted', 409, 'Cette tentative n’est pas en attente de correction.');
            $previousScore = $lockedAttempt->score;
            $lockedAttempt->forceFill(['score' => $data['score'], 'status' => 'corrected'])->save();
            AuditEvent::create([
                'actor_id' => $request->user()->id,
                'action' => 'assessment.attempt_corrected',
                'auditable_type' => AssessmentAttempt::class,
                'auditable_id' => $lockedAttempt->id,
                'before' => ['score' => $previousScore],
                'after' => ['score' => (float) $data['score']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', 'La copie a été corrigée et la note enregistrée sur 10.');
    }
}
