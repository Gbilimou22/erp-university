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
use App\Models\Program;
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
        $teacherId = $request->user()->id;
        $base = Assessment::query()->where('teacher_id', $teacherId);

        return Inertia::render('Teacher/Assessments/Index', [
            'counts' => [
                'scheduled' => (clone $base)->where('status', 'draft')->where('ends_at', '>', now())->count(),
                'active' => (clone $base)->where('status', 'launched')->where('starts_at', '<=', now())->where('ends_at', '>', now())->count(),
                'completed' => (clone $base)->where(function ($query) {
                    $query->where('status', 'closed')->orWhere('ends_at', '<=', now());
                })->where('status', '!=', 'draft')->count(),
                'results' => (clone $base)->whereHas('attempts', fn ($query) => $query->where('status', 'corrected'))->count(),
                'students' => AssessmentAttempt::query()->whereIn('status', ['submitted', 'corrected'])
                    ->whereHas('assessment', fn ($query) => $query->where('teacher_id', $teacherId))->count(),
            ],
        ]);
    }

    public function create(Request $request, SubjectEligibility $eligibility): Response
    {
        $year = AcademicYear::where('is_current', true)->first();

        return Inertia::render('Teacher/Assessments/Create', [
            'subjects' => $year ? $request->user()->taughtSubjects()
                ->wherePivot('academic_year_id', $year->id)
                ->with('courseUnit:id,faculty_id')
                ->orderBy('name')->get(['subjects.id', 'subjects.course_unit_id', 'subjects.department_id', 'subjects.code', 'subjects.name'])
                ->map(fn (Subject $subject) => [
                    'id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name,
                    'departments' => Program::query()->whereIn('id', $eligibility->programIds($subject, (int) $year->id))
                        ->with('department:id,name,code')->get()->pluck('department')->filter()->unique('id')->values(),
                ]) : [],
            'academicYear' => $year?->only(['id', 'name']),
        ]);
    }

    public function active(Request $request): Response
    {
        return $this->assessmentList($request, 'Évaluations en cours', 'Épreuves lancées dont le créneau est actuellement ouvert.', fn ($query) => $query
            ->where('status', 'launched')->where('starts_at', '<=', now())->where('ends_at', '>', now()));
    }

    public function toLaunch(Request $request): Response
    {
        return $this->assessmentList($request, 'Évaluations à lancer', 'Brouillons planifiés. Le lancement est possible uniquement pendant le créneau prévu.', fn ($query) => $query
            ->where('status', 'draft')->where('ends_at', '>', now()));
    }

    public function completed(Request $request): Response
    {
        return $this->assessmentList($request, 'Évaluations terminées', 'Épreuves dont le créneau est terminé ou qui ont été clôturées.', fn ($query) => $query
            ->where('status', '!=', 'draft')->where(function ($query) {
                $query->where('status', 'closed')->orWhere('ends_at', '<=', now());
            }));
    }

    public function resultSheets(Request $request): Response
    {
        return $this->assessmentList($request, 'Fiches de résultats', 'Ouvrez le classement, les notes et les copies corrigées de chaque épreuve.', fn ($query) => $query
            ->whereHas('attempts', fn ($attempts) => $attempts->where('status', 'corrected')));
    }

    public function studentResults(Request $request): Response
    {
        $attempts = AssessmentAttempt::query()
            ->with([
                'assessment.subject:id,code,name',
                'enrollment.student:id,registration_number,first_name,last_name',
            ])
            ->whereIn('status', ['submitted', 'corrected'])
            ->whereHas('assessment', fn ($query) => $query->where('teacher_id', $request->user()->id))
            ->whereHas('enrollment.student')
            ->orderByDesc('submitted_at')
            ->get();

        $rankByAttempt = [];
        foreach ($attempts->where('status', 'corrected')->groupBy('assessment_id') as $group) {
            $sorted = $group->sortByDesc(fn ($attempt) => (float) $attempt->score)->values();
            $rank = 0;
            $previousScore = null;
            foreach ($sorted as $index => $attempt) {
                $score = (float) $attempt->score;
                if ($previousScore === null || $score < $previousScore) $rank = $index + 1;
                $rankByAttempt[$attempt->id] = $rank;
                $previousScore = $score;
            }
        }

        return Inertia::render('Teacher/Assessments/StudentResults', [
            'results' => $attempts->map(fn ($attempt) => [
                'id' => $attempt->id,
                'status' => $attempt->status,
                'score' => $attempt->score,
                'rank' => $rankByAttempt[$attempt->id] ?? null,
                'submitted_at' => $attempt->submitted_at?->toIso8601String(),
                'assessment_id' => $attempt->assessment->id,
                'assessment_title' => $attempt->assessment->title,
                'subject' => $attempt->assessment->subject->only(['code', 'name']),
                'student' => $attempt->enrollment->student->only(['registration_number', 'first_name', 'last_name']),
            ])->values(),
        ]);
    }

    private function assessmentList(Request $request, string $title, string $description, \Closure $filter): Response
    {
        $assessments = Assessment::query()
            ->with(['subject:id,code,name', 'department:id,name,code', 'academicYear:id,name'])
            ->withCount(['attempts', 'attempts as corrected_attempts_count' => fn ($query) => $query->where('status', 'corrected')])
            ->where('teacher_id', $request->user()->id)
            ->where($filter)
            ->orderByDesc('starts_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Teacher/Assessments/List', compact('title', 'description', 'assessments'));
    }

    public function store(Request $request, SubjectEligibility $eligibility): RedirectResponse
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();
        $data = $request->validate([
            'subject_id' => ['required', 'integer'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
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
        ]);

        if ($data['type'] === 'direct' && collect($data['questions'])->contains(fn ($question) => $question['type'] !== 'direct')) {
            throw ValidationException::withMessages(['questions' => 'Une évaluation de questions directes doit contenir uniquement des questions écrites.']);
        }
        if ($data['type'] === 'qcm' && collect($data['questions'])->contains(fn ($question) => $question['type'] !== 'qcm')) {
            throw ValidationException::withMessages(['questions' => 'Une évaluation QCM doit contenir uniquement des questions à choix.']);
        }

        $subject = $request->user()->taughtSubjects()
            ->where('subjects.id', $data['subject_id'])
            ->wherePivot('academic_year_id', $year->id)
            ->with('courseUnit:id,faculty_id')
            ->firstOrFail();

        $eligibleProgramIds = $eligibility->programIds($subject, (int) $year->id);
        $eligibleDepartmentIds = Program::query()->whereIn('id', $eligibleProgramIds)->pluck('department_id')->unique()->all();
        if (! in_array((int) $data['department_id'], array_map('intval', $eligibleDepartmentIds), true)) {
            throw ValidationException::withMessages(['department_id' => 'Ce département ne propose pas cette matière dans une maquette de l’année courante.']);
        }
        if ($eligibleProgramIds === []) {
            throw ValidationException::withMessages(['subject_id' => 'Aucun programme étudiant n’est rattaché à cette matière pour l’année courante.']);
        }

        foreach ($data['questions'] as $index => $question) {
            $options = $question['options'] ?? [];
            if ($question['type'] === 'qcm') {
                $options = validator(['options' => $options], [
                    'options' => ['required', 'array', 'min:2', 'max:10'],
                    'options.*.text' => ['required', 'string', 'max:1000'],
                    'options.*.is_correct' => ['required', 'boolean'],
                ])->validate()['options'];
                if (count(array_filter($options, fn ($option) => $option['is_correct'])) !== 1) {
                    throw ValidationException::withMessages(["questions.{$index}.options" => 'Chaque QCM doit proposer au moins deux choix et une seule bonne réponse.']);
                }
            }
        }

        $assessment = DB::transaction(function () use ($data, $year, $request) {
            $assessment = Assessment::create([
                'teacher_id' => $request->user()->id,
                'subject_id' => $data['subject_id'],
                'department_id' => $data['department_id'],
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

        $summary = [
            'total' => $assessment->attempts()->count(),
            'submitted' => $assessment->attempts()->where('status', 'submitted')->count(),
            'corrected' => $assessment->attempts()->where('status', 'corrected')->count(),
            'in_progress' => $assessment->attempts()->where('status', 'in_progress')->count(),
            'average' => round((float) ($assessment->attempts()->where('status', 'corrected')->avg('score') ?? 0), 2),
            'highest' => $assessment->attempts()->where('status', 'corrected')->max('score'),
        ];

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
            'summary' => $summary,
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
