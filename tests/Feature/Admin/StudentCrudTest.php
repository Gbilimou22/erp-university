<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentCrudTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
    }

    /** @return array{Student, Enrollment} */
    private function enrolledStudent(): array
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'LIC-INFO', 'name' => 'Licence Informatique', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $user = User::factory()->create(['name' => 'Aminata Diallo', 'email' => 'aminata@example.test', 'role' => 'student', 'is_active' => true]);
        $student = Student::create([
            'user_id' => $user->id,
            'department_id' => $department->id,
            'registration_number' => 'UNIV-2026-000001',
            'first_name' => 'Aminata',
            'last_name' => 'Diallo',
            'email' => 'aminata@example.test',
            'phone' => '620000000',
            'gender' => 'F',
            'birth_date' => '2005-04-10',
            'status' => 'active',
        ]);
        $enrollment = Enrollment::create([
            'student_id' => $student->id,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
            'status' => 'active',
        ]);

        return [$student, $enrollment];
    }

    public function test_admin_can_update_student_and_current_enrollment(): void
    {
        $this->actingAs($this->administrator());
        [$student, $enrollment] = $this->enrolledStudent();

        $this->get(route('admin.students.edit', $student))->assertOk();
        $this->put(route('admin.students.update', $student), [
            'first_name' => 'Aminata Mariama',
            'last_name' => 'Diallo',
            'email' => 'aminata.mariama@example.test',
            'phone' => '622222222',
            'birth_date' => '2005-04-10',
            'gender' => 'F',
            'department_id' => $student->department_id,
            'program_id' => $enrollment->program_id,
            'academic_year_id' => $enrollment->academic_year_id,
            'level' => 'L2',
            'class_id' => '',
        ])->assertRedirect(route('admin.students.show', $student));

        $this->assertDatabaseHas('students', ['id' => $student->id, 'first_name' => 'Aminata Mariama', 'email' => 'aminata.mariama@example.test']);
        $this->assertDatabaseHas('users', ['id' => $student->user_id, 'name' => 'Aminata Mariama Diallo', 'email' => 'aminata.mariama@example.test']);
        $this->assertDatabaseHas('enrollments', ['id' => $enrollment->id, 'level' => 'L2']);
        $this->assertDatabaseHas('audit_events', ['action' => 'student.updated', 'auditable_id' => $student->id]);
    }

    public function test_archiving_student_preserves_enrollment_and_disables_portal_account(): void
    {
        $this->actingAs($this->administrator());
        [$student, $enrollment] = $this->enrolledStudent();

        $this->delete(route('admin.students.destroy', $student))
            ->assertRedirect(route('admin.students.index'));

        $this->assertDatabaseHas('students', ['id' => $student->id, 'status' => 'archived']);
        $this->assertDatabaseHas('users', ['id' => $student->user_id, 'is_active' => false]);
        $this->assertDatabaseHas('enrollments', ['id' => $enrollment->id, 'student_id' => $student->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'student.archived', 'auditable_id' => $student->id]);
    }
}
