<?php

namespace Tests\Feature\Teacher;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Subject;
use App\Models\SubjectTeacherAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AssessmentCreationTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeacherSubject(): array
    {
        $campus = Campus::create(['code' => 'CAMP-EVAL', 'name' => 'Campus évaluations']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FAC-EVAL', 'name' => 'Faculté évaluations']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'DEP-EVAL', 'name' => 'Département évaluations']);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'UE-EVAL', 'name' => 'Unité évaluations', 'credits' => 3]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'department_id' => $department->id, 'code' => 'ECUE-EVAL', 'name' => 'Évaluation test', 'coefficient' => 1]);

        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-EVAL',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        SubjectTeacherAssignment::create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'academic_year_id' => $year->id,
            'planned_hours' => 20,
        ]);

        return [$teacher, $subject, $department, $year];
    }

    public function test_teacher_create_form_shows_subject_and_department_without_curriculum(): void
    {
        [$teacher, $subject, $department, $year] = $this->setupTeacherSubject();

        $this->actingAs($teacher)
            ->get(route('teacher.assessments.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Assessments/Create')
                ->where('subjects.0.id', $subject->id)
                ->where('subjects.0.departments.0.id', $department->id)
                ->where('academicYear.id', $year->id));
    }

    public function test_mixed_assessment_requires_qcm_and_direct_questions(): void
    {
        [$teacher, $subject, $department, $year] = $this->setupTeacherSubject();

        $this->actingAs($teacher)->post(route('teacher.assessments.store'), [
            'subject_id' => $subject->id,
            'department_id' => $department->id,
            'title' => 'Mixte incomplet',
            'instructions' => '',
            'type' => 'mixed',
            'starts_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'ends_at' => now()->addDay()->addHour()->format('Y-m-d\TH:i'),
            'duration_minutes' => 60,
            'anti_cheat_enabled' => true,
            'questions' => [[
                'text' => 'Choix uniquement',
                'type' => 'qcm',
                'points' => '5',
                'options' => [
                    ['text' => 'A', 'is_correct' => true],
                    ['text' => 'B', 'is_correct' => false],
                ],
            ]],
        ])->assertSessionHasErrors(['questions']);
    }

    public function test_teacher_can_create_each_assessment_type_with_anti_cheat(): void
    {
        [$teacher, $subject, $department, $year] = $this->setupTeacherSubject();

        foreach (['qcm', 'direct', 'mixed', 'other'] as $type) {
            $questions = match ($type) {
                'direct' => [['text' => 'Expliquez la réponse.', 'type' => 'direct', 'points' => '5']],
                'mixed' => [
                    ['text' => 'Choisissez la bonne réponse.', 'type' => 'qcm', 'points' => '5', 'options' => [
                        ['text' => 'Bonne réponse', 'is_correct' => true],
                        ['text' => 'Autre réponse', 'is_correct' => false],
                    ]],
                    ['text' => 'Expliquez votre raisonnement.', 'type' => 'direct', 'points' => '5'],
                ],
                default => [['text' => 'Choisissez la bonne réponse.', 'type' => 'qcm', 'points' => '5', 'options' => [
                    ['text' => 'Bonne réponse', 'is_correct' => true],
                    ['text' => 'Autre réponse', 'is_correct' => false],
                ]]],
            };

            $this->actingAs($teacher)->post(route('teacher.assessments.store'), [
                'subject_id' => $subject->id,
                'department_id' => $department->id,
                'title' => 'Évaluation ' . $type,
                'instructions' => 'Répondez calmement.',
                'type' => $type,
                'starts_at' => now()->addDay()->format('Y-m-d\TH:i'),
                'ends_at' => now()->addDay()->addHour()->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
                'anti_cheat_enabled' => true,
                'questions' => $questions,
            ])->assertSessionHasNoErrors();

            $this->assertDatabaseHas('assessments', [
                'teacher_id' => $teacher->id,
                'subject_id' => $subject->id,
                'department_id' => $department->id,
                'academic_year_id' => $year->id,
                'type' => $type,
                'anti_cheat_enabled' => true,
                'status' => 'draft',
            ]);
        }

        $this->assertSame(4, Assessment::count());
    }
}
