<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Curriculum;
use App\Models\CurriculumSemester;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CurriculumManagementTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true, 'must_change_password' => false]);
    }

    /** @return array{Program, CourseUnit, AcademicYear} */
    private function programWithCourseUnit(): array
    {
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences et technologies']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $program = Program::create(['department_id' => $department->id, 'code' => 'LIC-INFO', 'name' => 'Licence Informatique', 'degree_level' => 'LICENCE', 'duration_years' => 3]);
        $courseUnit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-101', 'name' => 'Fondements de l’informatique', 'credits' => 5]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);

        return [$program, $courseUnit, $year];
    }

    public function test_admin_can_create_a_versioned_curriculum_and_configurable_semester(): void
    {
        $this->actingAs($this->administrator());
        [$program, , $year] = $this->programWithCourseUnit();

        $response = $this->post(route('admin.curricula.store'), [
            'program_id' => $program->id,
            'academic_year_id' => $year->id,
            'name' => 'Maquette Licence Informatique',
            'version' => 1,
        ]);

        $response->assertRedirect(route('admin.curricula.index'));
        $curriculum = Curriculum::firstOrFail();
        $this->assertSame(1, $curriculum->version);
        $this->assertDatabaseCount('curriculum_semesters', 6);
        $this->assertDatabaseHas('curriculum_semesters', [
            'curriculum_id' => $curriculum->id,
            'code' => 'S6',
            'name' => 'Semestre 6',
            'target_credits' => 30,
        ]);

        $this->post(route('admin.curricula.semesters.store', $curriculum), [
            'code' => 'p7',
            'name' => 'Semestre complémentaire',
            'position' => 7,
            'target_credits' => 24,
        ])->assertRedirect(route('admin.curricula.index'));

        $this->assertDatabaseHas('curriculum_semesters', [
            'curriculum_id' => $curriculum->id,
            'code' => 'P7',
            'name' => 'Semestre complémentaire',
            'target_credits' => 24,
        ]);
    }

    public function test_course_units_can_be_assigned_once_to_a_semester_in_the_matching_faculty(): void
    {
        $this->actingAs($this->administrator());
        [$program, $courseUnit, $year] = $this->programWithCourseUnit();
        $curriculum = Curriculum::create(['program_id' => $program->id, 'academic_year_id' => $year->id, 'name' => 'Maquette Informatique', 'version' => 1]);
        $semester = CurriculumSemester::create(['curriculum_id' => $curriculum->id, 'code' => 'P1', 'name' => 'Période 1', 'position' => 1]);

        $this->post(route('admin.curricula.course-units.attach', $semester), ['course_unit_id' => $courseUnit->id, 'is_required' => true])
            ->assertRedirect(route('admin.curricula.index'));

        $this->assertDatabaseHas('curriculum_course_units', ['curriculum_semester_id' => $semester->id, 'course_unit_id' => $courseUnit->id, 'is_required' => true]);
        $this->get(route('admin.curricula.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Curricula/Index')
            ->has('curricula.0.semesters.0.course_units', 1)
            ->where('curricula.0.semesters.0.course_units.0.code', 'INFO-101'));

        $this->post(route('admin.curricula.course-units.attach', $semester), ['course_unit_id' => $courseUnit->id, 'is_required' => true])
            ->assertSessionHasErrors('course_unit_id');
    }

    public function test_semesters_follow_program_duration_with_credit_targets_for_licence_and_master(): void
    {
        $this->actingAs($this->administrator());
        [$licence, , $year] = $this->programWithCourseUnit();
        $master = Program::create([
            'department_id' => $licence->department_id,
            'code' => 'MASTER-INFO',
            'name' => 'Master Informatique',
            'degree_level' => 'MASTER',
            'duration_years' => 2,
        ]);
        $doctorate = Program::create([
            'department_id' => $licence->department_id,
            'code' => 'DOC-INFO',
            'name' => 'Doctorat Informatique',
            'degree_level' => 'DOCTORAT',
            'duration_years' => 3,
        ]);

        foreach ([[$master, 4, 30], [$doctorate, 6, null]] as [$program, $expectedSemesters, $targetCredits]) {
            $this->post(route('admin.curricula.store'), [
                'program_id' => $program->id,
                'academic_year_id' => $year->id,
                'name' => 'Maquette '.$program->name,
                'version' => 1,
            ])->assertRedirect(route('admin.curricula.index'));

            $curriculum = Curriculum::query()->where('program_id', $program->id)->firstOrFail();
            $this->assertSame($expectedSemesters, $curriculum->semesters()->count());
            $this->assertDatabaseHas('curriculum_semesters', [
                'curriculum_id' => $curriculum->id,
                'code' => 'S1',
                'target_credits' => $targetCredits,
            ]);
        }
    }

    public function test_course_unit_from_another_faculty_cannot_be_added_to_the_curriculum(): void
    {
        $this->actingAs($this->administrator());
        [$program, , $year] = $this->programWithCourseUnit();
        $otherCampus = Campus::create(['code' => 'CAMP-02', 'name' => 'Campus secondaire']);
        $otherFaculty = Faculty::create(['campus_id' => $otherCampus->id, 'code' => 'FLS', 'name' => 'Lettres']);
        $otherUnit = CourseUnit::create(['faculty_id' => $otherFaculty->id, 'code' => 'LETT-101', 'name' => 'Introduction aux lettres', 'credits' => 4]);
        $curriculum = Curriculum::create(['program_id' => $program->id, 'academic_year_id' => $year->id, 'name' => 'Maquette Informatique', 'version' => 1]);
        $semester = CurriculumSemester::create(['curriculum_id' => $curriculum->id, 'code' => 'P1', 'name' => 'Période 1', 'position' => 1]);

        $this->post(route('admin.curricula.course-units.attach', $semester), ['course_unit_id' => $otherUnit->id, 'is_required' => true])
            ->assertSessionHasErrors('course_unit_id');

        $this->assertDatabaseMissing('curriculum_course_units', ['curriculum_semester_id' => $semester->id, 'course_unit_id' => $otherUnit->id]);
    }
}
