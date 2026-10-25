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

class AcademicGroupManagementTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
    }

    /** @return array{Program, AcademicYear} */
    private function programAndYear(): array
    {
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

        return [$program, $year];
    }

    public function test_admin_can_create_a_group_for_a_program_year_and_level(): void
    {
        $this->actingAs($this->administrator());
        [$program, $year] = $this->programAndYear();

        $this->post(route('admin.academic-groups.store'), [
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => 'a',
            'name' => 'Groupe A',
            'capacity' => 40,
        ])->assertRedirect(route('admin.academic-groups.index'));

        $this->assertDatabaseHas('classes', [
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => 'A',
            'name' => 'Groupe A',
            'capacity' => 40,
        ]);
        $this->get(route('admin.academic-groups.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AcademicGroups/Index')
            ->has('groups', 1));
    }

    public function test_group_level_must_match_its_program_degree(): void
    {
        $this->actingAs($this->administrator());
        [$program, $year] = $this->programAndYear();

        $this->post(route('admin.academic-groups.store'), [
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'M1',
            'code' => 'A',
            'name' => 'Groupe A',
            'capacity' => 40,
        ])->assertStatus(422);

        $this->assertDatabaseCount('classes', 0);
    }

    public function test_student_enrollment_can_be_attached_to_a_matching_group_and_full_group_is_rejected(): void
    {
        $admin = $this->administrator();
        [$program, $year] = $this->programAndYear();
        $department = Department::findOrFail($program->department_id);
        $group = ClassGroup::create([
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level_code' => 'L1',
            'code' => 'A',
            'name' => 'Groupe A',
            'level' => 1,
            'capacity' => 1,
        ]);

        $this->actingAs($admin)->post(route('admin.students.store'), [
            'first_name' => 'Aminata',
            'last_name' => 'Diallo',
            'email' => 'aminata@example.test',
            'birth_date' => '2005-04-10',
            'gender' => 'F',
            'department_id' => $department->id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
            'class_id' => $group->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('enrollments', [
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'class_id' => $group->id,
            'level' => 'L1',
        ]);

        $secondStudent = Student::create([
            'user_id' => User::factory()->create()->id,
            'department_id' => $department->id,
            'registration_number' => 'UNIV-2026-999999',
            'first_name' => 'Mamadou',
            'last_name' => 'Barry',
            'email' => 'mamadou@example.test',
            'gender' => 'M',
            'birth_date' => '2005-03-10',
            'status' => 'active',
        ]);
        Enrollment::create([
            'student_id' => $secondStudent->id,
            'faculty_id' => $department->faculty_id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'class_id' => $group->id,
            'level' => 'L1',
            'status' => 'active',
        ]);

        $this->post(route('admin.students.store'), [
            'first_name' => 'Ibrahima',
            'last_name' => 'Camara',
            'email' => 'ibrahima@example.test',
            'birth_date' => '2004-08-02',
            'gender' => 'M',
            'department_id' => $department->id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
            'class_id' => $group->id,
        ])->assertInvalid(['class_id']);
    }
}
