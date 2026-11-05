<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\CourseUnit;
use App\Models\Department;
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
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-01', 'name' => 'Informatique', 'credits' => 6]);

        $response = $this->post(route('admin.teaching.subjects.store'), [
            'course_unit_id' => $unit->id,
            'department_id' => $department->id,
            'code' => 'algo-01',
            'name' => 'Algorithmique',
            'coefficient' => 2,
        ]);

        $response->assertRedirect(route('admin.teaching.subjects.index'));
        $this->assertDatabaseHas('subjects', ['course_unit_id' => $unit->id, 'code' => 'ALGO-01']);
        $this->get(route('admin.teaching.subjects.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Teaching/Subjects')
            ->has('subjects.data', 1)
            ->where('subjects.data.0.name', 'Algorithmique'));
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
            ->has('rooms.data', 1)
            ->where('rooms.data.0.name', 'Amphithéâtre A'));
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
        $this->assertDatabaseHas('timetable_entries', [
            'subject_teacher_assignment_id' => $assignment->id,
            'room_id' => $room->id,
            'weekday' => 1,
        ]);
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
            ->has('teachers.data', 1)
            ->where('teachers.data.0.email', 'aminata@example.test'));
    }

    public function test_admin_lists_are_paginated_twenty_items_per_page(): void
    {
        $this->actingAs($this->administrator());
        $campus = Campus::create(['code' => 'CAMP-01', 'name' => 'Campus principal']);
        $faculty = Faculty::create(['campus_id' => $campus->id, 'code' => 'FST', 'name' => 'Sciences']);
        $department = Department::create(['faculty_id' => $faculty->id, 'code' => 'INFO', 'name' => 'Informatique']);
        $year = AcademicYear::create([
            'name' => '2026-2027',
            'code' => 'AY-2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
        ]);
        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-01', 'name' => 'Informatique', 'credits' => 6]);

        foreach (range(1, 21) as $number) {
            Subject::create([
                'course_unit_id' => $unit->id,
                'department_id' => $department->id,
                'code' => sprintf('MAT-%02d', $number),
                'name' => sprintf('Matière %02d', $number),
                'coefficient' => 1,
            ]);
            Room::create([
                'campus_id' => $campus->id,
                'code' => sprintf('S-%02d', $number),
                'name' => sprintf('Salle %02d', $number),
                'capacity' => 30,
                'type' => 'classroom',
                'is_active' => true,
            ]);
            User::factory()->create([
                'role' => 'teacher',
                'is_active' => true,
                'name' => sprintf('Enseignant %02d', $number),
            ]);
        }

        foreach (range(1, 20) as $number) {
            CourseUnit::create([
                'faculty_id' => $faculty->id,
                'code' => sprintf('UE-%02d', $number),
                'name' => sprintf('Unité %02d', $number),
                'credits' => 3,
            ]);
        }

        $paginatedLists = [
            [route('admin.teaching.assignments'), 'subjects'],
            [route('admin.teaching.subjects.index'), 'subjects'],
            [route('admin.teaching.index'), 'courseUnits'],
            [route('admin.timetable.rooms.index'), 'rooms'],
            [route('admin.teachers.index'), 'teachers'],
        ];

        foreach ($paginatedLists as [$url, $prop]) {
            $this->get($url)->assertInertia(fn (Assert $page) => $page
                ->has("{$prop}.data", 20)
                ->where("{$prop}.total", 21));

            $this->get($url . '?page=2')->assertInertia(fn (Assert $page) => $page
                ->has("{$prop}.data", 1)
                ->where("{$prop}.total", 21)
                ->where("{$prop}.current_page", 2));
        }
    }
}
