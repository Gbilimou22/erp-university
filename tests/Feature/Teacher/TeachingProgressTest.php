<?php

namespace Tests\Feature\Teacher;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Faculty;
use App\Models\Subject;
use App\Models\SubjectTeacherAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeachingProgressTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{User, SubjectTeacherAssignment} */
    private function assignmentFor(User $teacher): array
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences et technologies']);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-01', 'name' => 'Informatique', 'credits' => 6]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'code' => 'ALGO-01', 'name' => 'Algorithmique', 'coefficient' => 2]);
        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);
        $assignment = SubjectTeacherAssignment::create([
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'academic_year_id' => $year->id,
        ]);

        return [$teacher, $assignment];
    }

    public function test_teacher_can_record_a_session_and_see_updated_dashboard_progress(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
            'must_change_password' => false,
        ]);
        [, $assignment] = $this->assignmentFor($teacher);

        $this->actingAs($teacher)
            ->post(route('teacher.progress.sessions.store'), [
                'assignment_id' => $assignment->id,
                'planned_hours' => 10,
                'delivered_on' => now()->toDateString(),
                'hours' => 2.5,
                'topic' => 'Introduction aux algorithmes',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('teaching_sessions', [
            'subject_teacher_assignment_id' => $assignment->id,
            'recorded_by' => $teacher->id,
            'hours' => 2.5,
            'topic' => 'Introduction aux algorithmes',
        ]);
        $this->assertDatabaseHas('subject_teacher_assignments', [
            'id' => $assignment->id,
            'planned_hours' => 10,
        ]);

        $this->get(route('teacher.dashboard'))->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Dashboard')
            ->where('subjects.0.assignment_id', $assignment->id)
            ->where('subjects.0.planned_hours', '10.00')
            ->where('subjects.0.completed_hours', 2.5));
    }

    public function test_teacher_cannot_record_sessions_for_another_teachers_assignment(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        [, $assignment] = $this->assignmentFor($owner);
        $otherTeacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($otherTeacher)
            ->post(route('teacher.progress.sessions.store'), [
                'assignment_id' => $assignment->id,
                'planned_hours' => 10,
                'delivered_on' => now()->toDateString(),
                'hours' => 1,
                'topic' => 'Tentative non autorisée',
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('teaching_sessions', 0);
    }

    public function test_a_session_cannot_exceed_the_planned_course_hours(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        [, $assignment] = $this->assignmentFor($teacher);

        $this->actingAs($teacher)
            ->post(route('teacher.progress.sessions.store'), [
                'assignment_id' => $assignment->id,
                'planned_hours' => 4,
                'delivered_on' => now()->toDateString(),
                'hours' => 4.5,
                'topic' => 'Séance trop longue pour le volume prévu',
            ])
            ->assertSessionHasErrors('planned_hours');

        $this->assertDatabaseCount('teaching_sessions', 0);
        $this->assertDatabaseHas('subject_teacher_assignments', ['id' => $assignment->id, 'planned_hours' => null]);
    }
}
