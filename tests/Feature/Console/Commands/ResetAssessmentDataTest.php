<?php

namespace Tests\Feature\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentOption;
use App\Models\AssessmentQuestion;
use App\Models\AuditEvent;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Grade;
use App\Models\Program;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetAssessmentDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_force_reset_deletes_assessment_graph_and_only_attempt_attributable_grades(): void
    {
        $data = $this->createAssessmentData();

        $this->artisan('assessments:reset', ['--force' => true])
            ->assertExitCode(0);

        $this->assertDatabaseCount('assessments', 0);
        $this->assertDatabaseCount('assessment_questions', 0);
        $this->assertDatabaseCount('assessment_options', 0);
        $this->assertDatabaseCount('assessment_attempts', 0);
        $this->assertDatabaseCount('assessment_answers', 0);

        $this->assertDatabaseMissing('grades', ['id' => $data['attributableGrade']->id]);
        $this->assertDatabaseHas('grades', ['id' => $data['unrelatedGrade']->id]);
        $this->assertDatabaseHas('grades', ['id' => $data['ordinaryGrade']->id]);

        $this->assertDatabaseHas('campuses', ['id' => $data['campus']->id]);
        $this->assertDatabaseHas('academic_years', ['id' => $data['academicYear']->id]);
        $this->assertDatabaseHas('subjects', ['id' => $data['subject']->id]);
        $this->assertDatabaseHas('enrollments', ['id' => $data['attemptlessEnrollment']->id]);
        $this->assertDatabaseHas('students', ['id' => $data['student']->id]);
        $this->assertDatabaseHas('audit_events', ['id' => $data['auditEvent']->id]);
    }

    public function test_reset_without_force_shows_counts_and_can_be_cancelled(): void
    {
        $data = $this->createAssessmentData();

        $this->artisan('assessments:reset')
            ->expectsOutputToContain('Assessments')
            ->expectsOutputToContain('Attributable assessment grades')
            ->expectsConfirmation('This will permanently delete all assessment data. Do you wish to continue?', 'no')
            ->assertExitCode(1);

        $this->assertDatabaseCount('assessments', 2);
        $this->assertDatabaseCount('assessment_attempts', 2);
        $this->assertDatabaseHas('grades', ['id' => $data['attributableGrade']->id]);
        $this->assertDatabaseHas('audit_events', ['id' => $data['auditEvent']->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function createAssessmentData(): array
    {
        $campus = Campus::create(['code' => 'CAMP-RESET', 'name' => 'Campus reset']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'F-RESET', 'name' => 'Faculté reset']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'D-RESET', 'name' => 'Département reset']);
        $program = Program::create([
            'department_id' => $department->id,
            'code' => 'LIC-RESET',
            'name' => 'Licence reset',
            'degree_level' => 'LICENCE',
            'duration_years' => 3,
        ]);
        $academicYear = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-RESET',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);
        $unit = CourseUnit::create([
            'faculty_id' => $faculty->id,
            'code' => 'UE-RESET',
            'name' => 'UE reset',
            'credits' => 3,
        ]);
        $subject = Subject::create([
            'course_unit_id' => $unit->id,
            'department_id' => $department->id,
            'code' => 'ECUE-RESET',
            'name' => 'Matière reset',
            'coefficient' => 1,
        ]);

        $studentUser = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $student = Student::create([
            'user_id' => $studentUser->id,
            'department_id' => $department->id,
            'registration_number' => 'UNI-RESET',
            'first_name' => 'Awa',
            'last_name' => 'Diallo',
            'email' => $studentUser->email,
            'gender' => 'F',
            'birth_date' => '2000-01-01',
            'status' => 'active',
        ]);
        $attemptlessUser = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $attemptlessStudent = Student::create([
            'user_id' => $attemptlessUser->id,
            'department_id' => $department->id,
            'registration_number' => 'UNI-RESET-OTHER',
            'first_name' => 'Ibra',
            'last_name' => 'Diallo',
            'email' => $attemptlessUser->email,
            'gender' => 'M',
            'birth_date' => '2000-01-01',
            'status' => 'active',
        ]);

        $enrollment = $this->createEnrollment($student, $faculty, $program, $academicYear);
        $attemptlessEnrollment = $this->createEnrollment($attemptlessStudent, $faculty, $program, $academicYear);
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $assessmentData = [
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'department_id' => $department->id,
            'academic_year_id' => $academicYear->id,
            'title' => 'Évaluation à réinitialiser',
            'type' => 'qcm',
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addHour(),
            'duration_minutes' => 60,
            'anti_cheat_enabled' => false,
            'status' => 'launched',
        ];

        $assessments = collect([1, 2])->map(fn () => Assessment::create($assessmentData));
        $attempts = $assessments->map(function (Assessment $assessment) use ($enrollment): AssessmentAttempt {
            $question = AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => 'Question ?',
                'type' => 'qcm',
                'points' => 1,
                'position' => 1,
            ]);
            $option = AssessmentOption::create([
                'question_id' => $question->id,
                'option_text' => 'Réponse',
                'is_correct' => true,
                'position' => 1,
            ]);
            $attempt = AssessmentAttempt::create([
                'assessment_id' => $assessment->id,
                'enrollment_id' => $enrollment->id,
                'started_at' => now(),
                'status' => 'corrected',
            ]);
            AssessmentAnswer::create([
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'option_id' => $option->id,
                'answer_text' => null,
            ]);

            return $attempt;
        });

        $attributableGrade = Grade::create([
            'enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'score' => 8,
            'type' => 'cc',
            'assessment_label' => $assessmentData['title'],
            'entered_by' => $teacher->id,
        ]);
        $unrelatedGrade = Grade::create([
            'enrollment_id' => $attemptlessEnrollment->id,
            'subject_id' => $subject->id,
            'score' => 7,
            'type' => 'cc',
            'assessment_label' => $assessmentData['title'],
            'entered_by' => $teacher->id,
        ]);
        $ordinaryGrade = Grade::create([
            'enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'score' => 9,
            'type' => 'cc',
            'assessment_label' => 'Contrôle manuel',
            'entered_by' => $teacher->id,
        ]);
        $auditEvent = AuditEvent::create([
            'actor_id' => $teacher->id,
            'action' => 'assessment.attempt_submitted',
            'auditable_type' => AssessmentAttempt::class,
            'auditable_id' => $attempts->first()->id,
            'after' => ['status' => 'corrected'],
        ]);

        return compact(
            'campus',
            'academicYear',
            'subject',
            'student',
            'attemptlessEnrollment',
            'attributableGrade',
            'unrelatedGrade',
            'ordinaryGrade',
            'auditEvent',
        );
    }

    private function createEnrollment(
        Student $student,
        Faculty $faculty,
        Program $program,
        AcademicYear $academicYear,
    ): Enrollment {
        return Enrollment::create([
            'student_id' => $student->id,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'academic_year_id' => $academicYear->id,
            'level' => 'L1',
            'status' => 'active',
            'administrative_status' => 'active',
            'pedagogical_status' => 'active',
        ]);
    }
}
