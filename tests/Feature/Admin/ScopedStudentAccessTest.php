<?php

namespace Tests\Feature\Admin;

use App\Models\Campus;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use App\Models\UserScopeAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class ScopedStudentAccessTest extends TestCase
{
    use RefreshDatabase;

    private function department(string $code): Department
    {
        $campus = Campus::create(['code' => 'CAMP-' . $code, 'name' => 'Campus ' . $code]);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'F-' . $code, 'name' => 'Faculté ' . $code]);
        return Department::create(['faculty_id' => $faculty->id, 'code' => 'D-' . $code, 'name' => 'Département ' . $code]);
    }

    private function studentInDepartment(Department $department, string $email): Student
    {
        $user = User::factory()->create(['role' => 'student', 'email' => $email]);

        return Student::create([
            'user_id' => $user->id,
            'department_id' => $department->id,
            'registration_number' => 'UNI-' . $email,
            'first_name' => 'Étudiant',
            'last_name' => $email,
            'email' => $email,
            'gender' => 'M',
            'birth_date' => '2000-01-01',
            'status' => 'active',
        ]);
    }

    public function test_department_head_is_limited_to_assigned_department(): void
    {
        $departmentA = $this->department('A');
        $departmentB = $this->department('B');
        $studentA = $this->studentInDepartment($departmentA, 'a@example.test');
        $studentB = $this->studentInDepartment($departmentB, 'b@example.test');

        $role = Role::create(['name' => 'department_head', 'label' => 'Responsable département']);
        $permission = Permission::create(['name' => 'students.view', 'label' => 'Voir les étudiants']);
        $role->permissions()->attach($permission);

        $head = User::factory()->create(['role' => 'department_head']);
        $head->roles()->attach($role);
        UserScopeAssignment::create(['user_id' => $head->id, 'scope_type' => 'department', 'scope_id' => $departmentA->id]);

        $this->assertTrue(Gate::forUser($head)->allows('view', $studentA));
        $this->assertFalse(Gate::forUser($head)->allows('view', $studentB));
    }

    public function test_student_can_only_view_own_student_profile(): void
    {
        $department = $this->department('STUDENT');
        $studentA = $this->studentInDepartment($department, 'student-a@example.test');
        $studentB = $this->studentInDepartment($department, 'student-b@example.test');

        $this->assertTrue(Gate::forUser($studentA->user)->allows('view', $studentA));
        $this->assertFalse(Gate::forUser($studentA->user)->allows('view', $studentB));
    }

    public function test_administrator_has_global_student_access(): void
    {
        $department = $this->department('ADMIN');
        $student = $this->studentInDepartment($department, 'admin-view@example.test');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertTrue(Gate::forUser($admin)->allows('view', $student));
        $this->assertTrue(Gate::forUser($admin)->allows('update', $student));
    }
}
