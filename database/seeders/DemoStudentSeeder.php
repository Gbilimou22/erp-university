<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class DemoStudentSeeder extends Seeder
{
    private const TARGET_STUDENTS = 120;

    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('Les données synthétiques sont réservées aux environnements local et testing.');
        }

        $academicYear = AcademicYear::query()->where('is_current', true)->first()
            ?? AcademicYear::query()->orderByDesc('start_date')->first();
        $programs = Program::query()->with('department.faculty')->where('code', 'like', 'LIC-%')->orderBy('code')->get();

        if (! $academicYear || $programs->isEmpty()) {
            throw new RuntimeException('Une année universitaire et les filières LIC-* doivent exister avant le peuplement.');
        }

        $faker = \Faker\Factory::create('fr_FR');
        $faker->seed(20261103);

        DB::transaction(function () use ($academicYear, $programs, $faker): void {
            for ($number = 1; $number <= self::TARGET_STUDENTS; $number++) {
                $registrationNumber = sprintf('UNI-2026-%04d', $number);
                $email = sprintf('etudiant.%04d@demo-univ.test', $number);
                $program = $programs[($number - 1) % $programs->count()];
                $firstName = $faker->firstName();
                $lastName = $faker->lastName();
                $level = (($number - 1) % $program->duration_years) + 1;
                $class = ClassGroup::query()
                    ->where('program_id', $program->id)
                    ->where('academic_year_id', $academicYear->id)
                    ->where('level', $level)
                    ->orderBy('code')
                    ->first();

                $user = User::query()->firstOrCreate(['email' => $email], [
                    'name' => $firstName.' '.$lastName,
                    'password' => Hash::make(Str::random(48)),
                    'role' => 'student',
                    'is_active' => true,
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]);

                $student = Student::query()->updateOrCreate(['registration_number' => $registrationNumber], [
                    'user_id' => $user->id,
                    'department_id' => $program->department_id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => null,
                    'gender' => $number % 2 === 0 ? 'F' : 'M',
                    'birth_date' => $faker->dateTimeBetween('-25 years', '-18 years')->format('Y-m-d'),
                    'status' => 'active',
                ]);

                Enrollment::query()->updateOrCreate([
                    'student_id' => $student->id,
                    'academic_year_id' => $academicYear->id,
                ], [
                    'faculty_id' => $program->department->faculty_id,
                    'program_id' => $program->id,
                    'class_id' => $class?->id,
                    'level' => $class?->level_code ?? 'L'.$level,
                    'status' => 'active',
                ]);
            }
        });

        $this->command?->info('120 profils étudiants synthétiques cohérents ont été créés, répartis entre les filières LIC-* et leurs groupes.');
    }
}
