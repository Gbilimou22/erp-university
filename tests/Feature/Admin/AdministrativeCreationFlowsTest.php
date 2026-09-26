<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Faculty;
use App\Models\Room;
use App\Models\Subject;
use App\Models\SubjectTeacherAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdministrativeCreationFlowsTest extends TestCase
{
    use RefreshDatabase;

    private function administrator(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);
    }

    public function test_creating_a_subject_redirects_to_its_dedicated_list(): void
    {
        $this->actingAs($this->administrator());
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences et technologies']);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-01', 'name' => 'Informatique', 'credits' => 6]);

        $response = $this->post(route('admin.teaching.subjects.store'), [
            'course_unit_id' => $unit->id,
            'code' => 'algo-01',
            'name' => 'Algorithmique',
            'coefficient' => 2,
        ]);

        $response->assertRedirect(route('admin.teaching.subjects.index'));
        $this->assertDatabaseHas('subjects', ['course_unit_id' => $unit->id, 'code' => 'ALGO-01']);
        $this->get(route('admin.teaching.subjects.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Teaching/Subjects')
            ->has('courseUnits.0.subjects', 1)
            ->where('courseUnits.0.subjects.0.name', 'Algorithmique'));
    }

    public function test_creating_a_room_redirects_to_the_dedicated_room_list(): void
    {
        $this->actingAs($this->administrator());
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);

        $response = $this->post(route('admin.timetable.rooms.store'), [
            'campus_id' => $campus->id,
            'code' => 'amphi-a',
            'name' => 'Amphithéâtre A',
            'capacity' => 120,
            'type' => 'amphitheatre',
        ]);

        $response->assertRedirect(route('admin.timetable.rooms.index'));
        $this->assertDatabaseHas('rooms', ['campus_id' => $campus->id, 'code' => 'AMPHI-A']);
        $this->get(route('admin.timetable.rooms.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Teachers/Rooms')
            ->has('rooms', 1)
            ->where('rooms.0.name', 'Amphithéâtre A'));
    }

    public function test_adding_a_timetable_entry_redirects_to_the_dedicated_timetable_list(): void
    {
        $this->actingAs($this->administrator());
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences et technologies']);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-01', 'name' => 'Informatique', 'credits' => 6]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'code' => 'ALGO-01', 'name' => 'Algorithmique', 'coefficient' => 2]);
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $year = AcademicYear::create(['name' => '2026-2027', 'code' => 'AY-2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'is_current' => true]);
        $assignment = SubjectTeacherAssignment::create(['subject_id' => $subject->id, 'teacher_id' => $teacher->id, 'academic_year_id' => $year->id]);
        $room = Room::create(['campus_id' => $campus->id, 'code' => 'S-101', 'name' => 'Salle 101', 'capacity' => 40, 'type' => 'classroom', 'is_active' => true]);

        $response = $this->post(route('admin.timetable.entries.store'), [
            'subject_teacher_assignment_id' => $assignment->id,
            'room_id' => $room->id,
            'weekday' => 1,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        $response->assertRedirect(route('admin.timetable.entries.index'));
        $this->assertDatabaseHas('timetable_entries', ['room_id' => $room->id, 'weekday' => 1]);
        $this->get(route('admin.timetable.entries.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Teachers/Entries')
            ->has('entries', 1)
            ->where('entries.0.assignment.subject.name', 'Algorithmique'));
    }

    public function test_creating_a_teacher_redirects_to_the_teacher_list_with_temporary_credentials(): void
    {
        $this->actingAs($this->administrator());

        $response = $this->post(route('admin.teachers.store'), [
            'name' => 'Aminata Diallo',
            'email' => 'aminata@example.test',
        ]);

        $response->assertRedirect(route('admin.teachers.index'));
        $response->assertSessionHas('temporaryCredentials.email', 'aminata@example.test');
        $this->assertDatabaseHas('users', ['email' => 'aminata@example.test', 'role' => 'teacher', 'is_active' => true]);
        $this->get(route('admin.teachers.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Teachers/Index')
            ->has('teachers', 1)
            ->where('teachers.0.email', 'aminata@example.test'));
    }
}
