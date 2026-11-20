<?php

namespace Tests\Feature\Student;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentOption;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectAssessmentSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_qcm_submission_automatically_creates_grade(): void
    {
        $campus = Campus::create(['code' => 'CAMP-QCM', 'name' => 'Campus QCM']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'F-QCM', 'name' => 'Faculté QCM']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'D-QCM', 'name' => 'Département QCM']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'LIC-QCM', 'name' => 'Licence QCM', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-QCM', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'UE-QCM', 'name' => 'UE QCM', 'credits' => 3]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'department_id' => $department->id, 'code' => 'ECUE-QCM', 'name' => 'Matière QCM', 'coefficient' => 1]);

        $studentUser = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);
        $student = Student::create(['user_id' => $studentUser->id, 'department_id' => $department->id, 'registration_number' => 'UNI-QCM', 'first_name' => 'Ibra', 'last_name' => 'Diallo', 'email' => $studentUser->email, 'gender' => 'M', 'birth_date' => '2000-01-01', 'status' => 'active']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'faculty_id' => $faculty->id, 'program_id' => $program->id, 'academic_year_id' => $year->id, 'level' => 'L1', 'status' => 'active', 'administrative_status' => 'active', 'pedagogical_status' => 'active']);

        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true, 'must_change_password' => false]);
        $assessment = Assessment::create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'department_id' => $department->id,
            'academic_year_id' => $year->id,
            'title' => 'Contrôle QCM automatique',
            'type' => 'qcm',
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addHour(),
            'duration_minutes' => 60,
            'anti_cheat_enabled' => false,
            'status' => 'launched',
        ]);

        $question = AssessmentQuestion::create(['assessment_id' => $assessment->id, 'question_text' => 'Combien font 1+1 ?', 'type' => 'qcm', 'points' => 10, 'position' => 1]);
        $correct = AssessmentOption::create(['question_id' => $question->id, 'option_text' => '2', 'is_correct' => true, 'position' => 1]);
        AssessmentOption::create(['question_id' => $question->id, 'option_text' => '3', 'is_correct' => false, 'position' => 2]);

        $attempt = AssessmentAttempt::create(['assessment_id' => $assessment->id, 'enrollment_id' => $enrollment->id, 'started_at' => now(), 'status' => 'in_progress']);

        $this->actingAs($studentUser)->post(route('student.assessments.submit', $assessment), [
            'reason' => 'student',
            'answers' => [['question_id' => $question->id, 'option_id' => $correct->id]],
        ])->assertSessionHasNoErrors();

        $attempt->refresh();
        $this->assertSame('corrected', $attempt->status);
        $this->assertSame('10.00', (string) $attempt->score);
        $this->assertDatabaseHas('grades', [
            'enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'assessment_label' => 'Contrôle QCM automatique',
            'type' => 'cc',
            'entered_by' => $teacher->id,
        ]);
    }

    public function test_student_can_submit_written_answer_to_direct_question(): void
    {
        $campus = Campus::create(['code' => 'CAMP-DIRECT', 'name' => 'Campus direct']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'F-DIRECT', 'name' => 'Faculté directe']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'D-DIRECT', 'name' => 'Département direct']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'LIC-DIRECT', 'name' => 'Licence directe', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-DIRECT', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'UE-DIRECT', 'name' => 'UE directe', 'credits' => 3]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'department_id' => $department->id, 'code' => 'ECUE-DIRECT', 'name' => 'Matière directe', 'coefficient' => 1]);

        $studentUser = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);
        $student = Student::create(['user_id' => $studentUser->id, 'department_id' => $department->id, 'registration_number' => 'UNI-DIRECT', 'first_name' => 'Awa', 'last_name' => 'Diallo', 'email' => $studentUser->email, 'gender' => 'F', 'birth_date' => '2000-01-01', 'status' => 'active']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'faculty_id' => $faculty->id, 'program_id' => $program->id, 'academic_year_id' => $year->id, 'level' => 'L1', 'status' => 'active', 'administrative_status' => 'active', 'pedagogical_status' => 'active']);

        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true, 'must_change_password' => false]);
        $assessment = Assessment::create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'department_id' => $department->id,
            'academic_year_id' => $year->id,
            'title' => 'Évaluation directe',
            'type' => 'direct',
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addHour(),
            'duration_minutes' => 60,
            'anti_cheat_enabled' => false,
            'status' => 'launched',
        ]);

        $question = AssessmentQuestion::create([
            'assessment_id' => $assessment->id,
            'question_text' => 'Expliquez votre réponse.',
            'type' => 'direct',
            'points' => 5,
            'position' => 1,
        ]);

        $attempt = AssessmentAttempt::create([
            'assessment_id' => $assessment->id,
            'enrollment_id' => $enrollment->id,
            'started_at' => now(),
            'status' => 'in_progress',
        ]);

        $this->actingAs($studentUser)->putJson(route('student.assessments.answers.save', $assessment), [
            'answers' => [[
                'question_id' => $question->id,
                'answer_text' => 'Ma réponse écrite détaillée.',
            ]],
        ])->assertNoContent();

        $this->assertDatabaseHas('assessment_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'answer_text' => 'Ma réponse écrite détaillée.',
        ]);

        $response = $this->actingAs($studentUser)->post(route('student.assessments.submit', $assessment), [
            'reason' => 'student',
            'answers' => [[
                'question_id' => $question->id,
                'answer_text' => 'Ma réponse écrite détaillée.',
            ]],
        ]);

        $this->assertContains($response->getStatusCode(), [302, 303]);
        $attempt->refresh();
        $this->assertSame('submitted', $attempt->status);
        $this->assertDatabaseHas('assessment_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'answer_text' => 'Ma réponse écrite détaillée.',
        ]);
    }
}
