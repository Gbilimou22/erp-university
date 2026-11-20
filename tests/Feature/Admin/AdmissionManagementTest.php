<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Admission;
use App\Models\Campus;
use App\Models\DepartmentFeeSchedule;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdmissionManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);
    }

    private function program(): Program
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);

        return Program::create([
            'department_id' => $department->id,
            'code' => 'L1-INFO',
            'name' => 'Licence Informatique',
            'degree_level' => 'LICENCE',
            'duration_years' => 3,
        ]);
    }

    public function test_admin_can_register_and_decide_an_admission(): void
    {
        $admin = $this->admin();
        $program = $this->program();

        $this->actingAs($admin)
            ->get(route('admin.admissions.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Admissions/Index'));

        $this->actingAs($admin)->post(route('admin.admissions.store'), [
            'candidate_first_name' => 'Mariam',
            'candidate_last_name' => 'Diallo',
            'email' => 'mariam@example.test',
            'phone' => '+224620000000',
            'birth_date' => '2005-01-15',
            'birth_place' => 'Conakry',
            'desired_program_id' => $program->id,
            'desired_level' => 'L1',
        ])->assertSessionHasNoErrors();

        $admission = Admission::query()->where('email', 'mariam@example.test')->firstOrFail();

        $this->actingAs($admin)->post(route('admin.admissions.decide', $admission), [
            'decision' => 'accepted',
            'decision_reason' => 'Dossier complet et conditions remplies.',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('admissions', [
            'id' => $admission->id,
            'status' => 'admitted',
            'decision' => 'accepted',
            'decided_by' => $admin->id,
        ]);
    }

    public function test_admitted_candidate_can_be_converted_to_one_student_enrollment(): void
    {
        $admin = $this->admin();
        $program = $this->program();
        $department = $program->department()->firstOrFail();

        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);

        DepartmentFeeSchedule::create([
            'department_id' => $department->id,
            'academic_year_id' => $year->id,
            'registration_amount' => 100,
            'registration_due_date' => '2026-09-10',
            'tuition_installment_1_amount' => 300,
            'tuition_installment_1_due_date' => '2026-10-10',
            'tuition_installment_2_amount' => 300,
            'tuition_installment_2_due_date' => '2027-01-10',
            'tuition_installment_3_amount' => 300,
            'tuition_installment_3_due_date' => '2027-04-10',
        ]);

        $admission = Admission::create([
            'candidate_first_name' => 'Mariam',
            'candidate_last_name' => 'Diallo',
            'email' => 'mariam-conversion@example.test',
            'phone' => '+224620000001',
            'birth_date' => '2005-01-15',
            'birth_place' => 'Conakry',
            'desired_program_id' => $program->id,
            'desired_level' => 'L1',
            'status' => 'admitted',
            'decision' => 'accepted',
            'decided_by' => $admin->id,
            'decided_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.students.create', ['admission' => $admission->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Students/Create')
                ->where('admission.id', $admission->id)
                ->where('admission.candidate_first_name', 'Mariam'));

        $this->actingAs($admin)->post(route('admin.students.store'), [
            'admission_id' => $admission->id,
            'first_name' => 'Mariam',
            'last_name' => 'Diallo',
            'email' => 'mariam-conversion@example.test',
            'phone' => '+224620000001',
            'birth_date' => '2005-01-15',
            'birth_place' => 'Conakry',
            'nationality' => 'Guinéenne',
            'address' => 'Conakry',
            'gender' => 'F',
            'department_id' => $department->id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
        ])->assertSessionHasNoErrors();

        $student = Student::query()->where('email', 'mariam-conversion@example.test')->firstOrFail();
        $this->assertDatabaseHas('admissions', ['id' => $admission->id, 'student_id' => $student->id]);
        $this->assertDatabaseHas('enrollments', ['student_id' => $student->id, 'admission_id' => $admission->id]);

        $this->actingAs($admin)->post(route('admin.students.store'), [
            'admission_id' => $admission->id,
            'first_name' => 'Mariam',
            'last_name' => 'Diallo',
            'email' => 'mariam-second@example.test',
            'birth_date' => '2005-01-15',
            'gender' => 'F',
            'department_id' => $department->id,
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'level' => 'L1',
        ])->assertSessionHasErrors(['admission_id']);

        $this->assertSame(1, Enrollment::where('admission_id', $admission->id)->count());
    }

    public function test_non_admin_cannot_access_admissions(): void
    {
        $student = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);

        $this->actingAs($student)
            ->get(route('admin.admissions.index'))
            ->assertForbidden();
    }
}
