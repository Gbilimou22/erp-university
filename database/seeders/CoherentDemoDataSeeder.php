<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CoherentDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('Le renouvellement des données synthétiques est autorisé uniquement en local ou testing.');
        }

        DB::transaction(function (): void {
            $studentIds = DB::table('students')
                ->where(function ($query): void {
                    $query->where('registration_number', 'like', 'DEMO-2026-%')
                        ->orWhere('registration_number', 'like', 'UNIV-%')
                        ->orWhere('registration_number', 'like', 'UNI-2026-%')
                        ->orWhere('registration_number', 'ETU20260001');
                })->pluck('id');
            $userIds = DB::table('students')->whereIn('id', $studentIds)->pluck('user_id')->filter()->unique();
            $enrollmentIds = DB::table('enrollments')->whereIn('student_id', $studentIds)->pluck('id');
            $feeIds = DB::table('student_fees')->whereIn('enrollment_id', $enrollmentIds)->pluck('id');

            DB::table('payments')->whereIn('student_fee_id', $feeIds)->delete();
            DB::table('student_fees')->whereIn('id', $feeIds)->delete();
            DB::table('grades')->whereIn('enrollment_id', $enrollmentIds)->delete();
            DB::table('enrollments')->whereIn('id', $enrollmentIds)->delete();
            DB::table('students')->whereIn('id', $studentIds)->delete();
            DB::table('users')->whereIn('id', $userIds)->delete();

            $oldTeacherIds = DB::table('users')->where('email', 'like', 'enseignant.demo%@university.test')->pluck('id');
            $oldAssignments = DB::table('subject_teacher_assignments')->whereIn('teacher_id', $oldTeacherIds)->pluck('id');
            $scheduledAssignments = DB::table('timetable_entries')->whereIn('subject_teacher_assignment_id', $oldAssignments)->count();
            if ($scheduledAssignments > 0) {
                throw new RuntimeException('Un emploi du temps utilise encore un ancien enseignant de démonstration ; arrêt sans suppression.');
            }
            DB::table('subject_teacher_assignments')->whereIn('id', $oldAssignments)->delete();
            DB::table('users')->whereIn('id', $oldTeacherIds)->delete();

            $oldSubjects = DB::table('subjects')->where('code', 'like', 'DEM-%')->pluck('id');
            $oldSubjectAssignments = DB::table('subject_teacher_assignments')->whereIn('subject_id', $oldSubjects)->pluck('id');
            if (DB::table('timetable_entries')->whereIn('subject_teacher_assignment_id', $oldSubjectAssignments)->exists()) {
                throw new RuntimeException('Un emploi du temps utilise une ancienne matière DEM-* ; arrêt sans suppression.');
            }
            DB::table('subject_teacher_assignments')->whereIn('id', $oldSubjectAssignments)->delete();
            DB::table('grades')->whereIn('subject_id', $oldSubjects)->delete();
            DB::table('subjects')->whereIn('id', $oldSubjects)->delete();

            $oldUnits = DB::table('course_units')->where('code', 'like', 'DEM-%')->pluck('id');
            DB::table('curriculum_course_units')->whereIn('course_unit_id', $oldUnits)->delete();
            DB::table('course_units')->whereIn('id', $oldUnits)->delete();
            DB::table('courses')->where('code', 'like', 'DEM-%')->delete();
        });

        $this->call([
            UniversityStructureSeeder::class,
            DemoStudentSeeder::class,
        ]);
    }
}
