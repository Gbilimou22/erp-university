<?php

namespace Tests\Feature\Student;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\ClassGroup;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Room;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectTeacherAssignment;
use App\Models\TimetableEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentTimetableGroupFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_shared_entries_and_only_entries_for_their_group(): void
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

        $unit = CourseUnit::create(['faculty_id' => $faculty->id, 'code' => 'INFO-101', 'name' => 'Informatique', 'credits' => 5]);
        $subject = Subject::create(['course_unit_id' => $unit->id, 'code' => 'ALGO-101', 'name' => 'Algorithmique', 'coefficient' => 2]);
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $assignment = SubjectTeacherAssignment::create(['subject_id' => $subject->id, 'teacher_id' => $teacher->id, 'academic_year_id' => $year->id]);
        $room = Room::create(['campus_id' => $campus->id, 'code' => 'S-101', 'name' => 'Salle 101', 'capacity' => 40, 'type' => 'classroom', 'is_active' => true]);

        $sharedEntry = TimetableEntry::create(['subject_teacher_assignment_id' => $assignment->id, 'room_id' => $room->id, 'weekday' => 1, 'start_time' => '08:00', 'end_time' => '10:00']);
        $groupAEntry = TimetableEntry::create(['subject_teacher_assignment_id' => $assignment->id, 'class_id' => $groups[0]->id, 'room_id' => $room->id, 'weekday' => 2, 'start_time' => '08:00', 'end_time' => '10:00']);
        TimetableEntry::create(['subject_teacher_assignment_id' => $assignment->id, 'class_id' => $groups[1]->id, 'room_id' => $room->id, 'weekday' => 3, 'start_time' => '08:00', 'end_time' => '10:00']);

        $studentUser = User::factory()->create(['role' => 'student', 'is_active' => true, 'must_change_password' => false]);
        $student = Student::create([
            'user_id' => $studentUser->id,
            'department_id' => $department->id,
            'registration_number' => 'UNIV-2026-000001',
            'first_name' => 'Aminata',
            'last_name' => 'Diallo',
            'email' => 'aminata@example.test',
            'gender' => 'F',
            'birth_date' => '2005-01-01',
            'status' => 'active',
        ]);
        Enrollment::create(['student_id' => $student->id, 'faculty_id' => $faculty->id, 'program_id' => $program->id, 'class_id' => $groups[0]->id, 'academic_year_id' => $year->id, 'level' => 'L1', 'status' => 'active']);

        $this->actingAs($studentUser)->get(route('student.timetable'))->assertInertia(fn (Assert $page) => $page
            ->component('Student/Timetable/Index')
            ->has('entries', 2)
            ->where('entries.0.id', $sharedEntry->id)
            ->where('entries.1.id', $groupAEntry->id)
            ->where('classGroup.code', 'A'));
    }
}
