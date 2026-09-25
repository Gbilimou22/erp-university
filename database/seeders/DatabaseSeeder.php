<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Campus;
use App\Models\Faculty;
use App\Models\Department;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Créer l'administrateur
        $this->call([
            AdminUserSeeder::class,
        ]);

        // 1. Campus
        $campus = Campus::create([
            'name' => 'Campus Principal',
            'code' => 'CAMP-01',
            'address' => 'Centre-ville',
        ]);

        // 2. Faculté et Département
        $faculty = Faculty::create([
            'campus_id' => $campus->id,
            'name' => 'Faculté des Sciences et Technologies',
            'code' => 'FST',
        ]);

        $department = Department::create([
            'faculty_id' => $faculty->id,
            'name' => 'Informatique',
            'code' => 'INFO',
        ]);

        // 3. Année Académique
        $academicYear = AcademicYear::create([
            'name' => '2026-2027',
            'start_date' => '2026-10-01',
            'end_date' => '2027-07-31',
            'is_current' => true,
            'code' => 'AY-2026-2027',
        ]);

        // 4. Compte Utilisateur de l'étudiant
        $studentUser = User::create([
            'name' => 'Mamadou Diallo',
            'email' => 'mamadou.diallo@university.edu',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 5. Profil Étudiant de test
        $student = Student::create([
            'user_id' => $studentUser->id, // Assure le lien obligatoire avec la table users
            'registration_number' => 'ETU20260001',
            'department_id' => $department->id,
            'first_name' => 'Mamadou',
            'last_name' => 'Diallo',
            'email' => 'mamadou.diallo@university.edu',
            'phone' => '+224 620 00 00 00',
            'birth_date' => '2002-05-15',
            'gender' => 'M',
            'status' => 'active',
        ]);

        // 6. Inscription
        Enrollment::create([
            'student_id' => $student->id,
            'faculty_id' => $faculty->id,
            'academic_year_id' => $academicYear->id,
            'level' => 'L1',
            'status' => 'active',
        ]);
    }
}
