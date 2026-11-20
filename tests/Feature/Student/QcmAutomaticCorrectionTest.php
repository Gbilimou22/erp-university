<?php

namespace Tests\Feature\Student;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentOption;
use App\Models\AssessmentQuestion;
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

class QcmAutomaticCorrectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_correct_options_graded_automatically_on_weighted_questions(): void
    {
        $campus = Campus::create(['code' => 'C-QCM-COR', 'name' => 'Campus correction']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'F-QCM-COR', 'name' => 'Faculté correction']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'D-QCM-COR', 'name' => 'Département correction']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'P-QCM-COR', 'name' => 'Parcours correction', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-QCM-COR', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'UE-QCM-COR', 'name' => 'UE correction', 'credits' => 3]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'department_id' => $department->id, 'code' => 'ECUE-QCM-COR', 'name' => 'Matière correction', 'coefficient' => 1]);

        $studentUser = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);
        $student = Student::create(['user_id' => $studentUser->id, 'department_id' => $department->id, 'registration_number' => 'UNI-QCM-COR', 'first_name' => 'Sara', 'last_name' => 'Camara', 'email' => $studentUser->email, 'gender' => 'F', 'birth_date' => '2001-01-01', 'status' => 'active']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'faculty_id' => $faculty->id, 'program_id' => $program->id, 'academic_year_id' => $year->id, 'level' => 'L1', 'status' => 'active', 'administrative_status' => 'active', 'pedagogical_status' => 'active']);

        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true, 'must_change_password' => false]);
        $assessment = Assessment::create([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'department_id' => $department->id,
            'academic_year_id' => $year->id,
            'title' => 'Test automatique pondéré',
            'type' => 'qcm',
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addHour(),
            'duration_minutes' => 60,
            'anti_cheat_enabled' => false,
            'status' => 'launched',
        ]);

        $questionA = AssessmentQuestion::create(['assessment_id' => $assessment->id, 'question_text' => 'Question 4 points', 'type' => 'qcm', 'points' => 4, 'position' => 1]);
        $correctA = AssessmentOption::create(['question_id' => $questionA->id, 'option_text' => 'Réponse correcte A', 'is_correct' => true, 'position' => 1]);
        AssessmentOption::create(['question_id' => $questionA->id, 'option_text' => 'Réponse fausse A', 'is_correct' => false, 'position' => 2]);

        $questionB = AssessmentQuestion::create(['assessment_id' => $assessment->id, 'question_text' => 'Question 6 points', 'type' => 'qcm', 'points' => 6, 'position' => 2]);
        AssessmentOption::create(['question_id' => $questionB->id, 'option_text' => 'Réponse fausse B', 'is_correct' => false, 'position' => 1]);
        $wrongB = AssessmentOption::create(['question_id' => $questionB->id, 'option_text' => 'Réponse fausse B2', 'is_correct' => false, 'position' => 2]);

        $attempt = AssessmentAttempt::create(['assessment_id' => $assessment->id, 'enrollment_id' => $enrollment->id, 'started_at' => now(), 'status' => 'in_progress']);

        $this->actingAs($studentUser)->put(route('student.assessments.answers.save', $assessment), [
            'answers' => [['question_id' => $questionA->id, 'option_id' => $correctA->id]],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('assessment_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $questionA->id,
            'option_id' => $correctA->id,
        ]);

        $this->actingAs($studentUser)->post(route('student.assessments.submit', $assessment), [
            'reason' => 'student',
            'answers' => [
                ['question_id' => $questionA->id, 'option_id' => $correctA->id],
                ['question_id' => $questionB->id, 'option_id' => $wrongB->id],
            ],
        ])->assertSessionHasNoErrors();

        $attempt->refresh();
        $this->assertSame('4.00', (string) $attempt->score);
        $this->assertDatabaseHas('grades', [
            'enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'assessment_label' => 'Test automatique pondéré',
            'type' => 'cc',
            'score' => '4.00',
        ]);
    }
}
