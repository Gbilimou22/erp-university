<?php

namespace Tests\Feature\Admin;

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

class AcademicGroupStudentsTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
    }

    public function test_admin_can_view_group_students_and_reassign_them_to_another_matching_group(): void
    {
        $this->actingAs($this->administrator());

        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $program = Program::create([
            'department_id' => $department->id,
            'code' => 'LIC-INFO',
            'name' => 'Licence Informatique',
            'degree_level' => 'LICENCE',
            'duration_years' => 3,
        ]);
        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);

        $groupA = ClassGroup::create([
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => 'A',
            'name' => 'Groupe A',
            'level' => 1,
            'capacity' => 10,
        ]);
        $groupB = ClassGroup::create([
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => 'B',
            'name' => 'Groupe B',
            'level' => 1,
            'capacity' => 10,
        ]);

        $user = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);
        $student = Student::create([
            'user_id' => $user->id,
            'department_id' => $department->id,
            'registration_number' => 'UNIV-2026-000001',
            'first_name' => 'Aminata',
            'last_name' => 'Diallo',
            'email' => 'aminata@example.test',
            'gender' => 'F',
            'birth_date' => '2005-04-10',
            'status' => 'active',
        ]);

        Enrollment::create([
            'student_id' => $student->id,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'class_id' => $groupA->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
            'status' => 'active',
        ]);

        $this->get(route('admin.academic-groups.show', $groupA))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AcademicGroups/Show')
            ->where('group.id', $groupA->id)
            ->has('students', 1));

        $response = $this->post(route('admin.academic-groups.students.move', [$groupA, $student]), [
            'new_group_id' => $groupB->id,
        ]);

        $response->assertRedirect(route('admin.academic-groups.show', $groupA));
        $this->assertDatabaseHas('enrollments', ['student_id' => $student->id, 'class_id' => $groupB->id]);
    }
}
