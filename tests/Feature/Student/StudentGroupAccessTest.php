<?php

namespace Tests\Feature\Student;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\ClassGroup;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentGroupAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_only_their_own_group_on_dashboard_and_group_page(): void
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'LIC-INFO', 'name' => 'Licence Informatique', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $groups = collect(['A', 'B'])->map(fn (string $code) => ClassGroup::create([
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => $code,
            'name' => 'Groupe '.$code,
            'level' => 1,
            'capacity' => 40,
        ]));

        $students = collect(['first@example.test', 'second@example.test'])->map(function (string $email, int $index) use ($department, $faculty, $program, $year, $groups) {
            $user = User::factory()->create(['email' => $email, 'role' => 'student', 'is_active' => true, 'must_change_password' => false]);
            $student = Student::create([
                'user_id' => $user->id,
                'department_id' => $department->id,
                'registration_number' => sprintf('UNIV-2026-%06d', $index + 1),
                'first_name' => 'Étudiant',
                'last_name' => (string) ($index + 1),
                'email' => $email,
                'gender' => 'F',
                'birth_date' => '2005-01-01',
                'status' => 'active',
            ]);
            Enrollment::create([
                'student_id' => $student->id,
                'faculty_id' => $faculty->id,
                'program_id' => $program->id,
                'academic_year_id' => $year->id,
                'class_id' => $groups[$index]->id,
                'level' => 'L1',
                'status' => 'active',
            ]);

            return [$user, $groups[$index]];
        });

        [$firstUser] = $students[0];
        [$secondUser] = $students[1];

        $this->actingAs($firstUser)->get(route('student.dashboard'))->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('student.enrollments.0.class_group.code', 'A'));

        $this->actingAs($firstUser)->get(route('student.group'))->assertInertia(fn (Assert $page) => $page
            ->component('Student/Group')
            ->where('enrollment.group.code', 'A')
            ->missing('enrollment.group.id'));

        $this->actingAs($secondUser)->get(route('student.group'))->assertInertia(fn (Assert $page) => $page
            ->component('Student/Group')
            ->where('enrollment.group.code', 'B'));
    }

    public function test_student_without_group_sees_pending_assignment_message(): void
    {
        $user = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($user)->get(route('student.group'))->assertInertia(fn (Assert $page) => $page
            ->component('Student/Group')
            ->where('enrollment', null));
    }
}
