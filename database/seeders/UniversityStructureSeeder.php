<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\ClassGroup;
use App\Models\Course;
use App\Models\CourseUnit;
use App\Models\Curriculum;
use App\Models\CurriculumSemester;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Room;
use App\Models\Subject;
use App\Models\SubjectTeacherAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class UniversityStructureSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('Les données de démonstration sont réservées aux environnements local et testing.');
        }

        DB::transaction(function (): void {
            $year = AcademicYear::query()
                ->where('is_current', true)
                ->first() ?? AcademicYear::query()->orderByDesc('start_date')->first();

            if (! $year) {
                throw new RuntimeException('Crée d’abord une année universitaire.');
            }

            $campusSpecs = [
                ['code' => 'CAMP-04', 'name' => 'Campus de Labé', 'address' => 'Labé, Guinée'],
            ];

            foreach ($campusSpecs as $spec) {
                Campus::query()->firstOrCreate(['code' => $spec['code']], $spec);
            }

            $campuses = Campus::query()->get()->keyBy('code');

            $facultySpecs = [
                ['code' => 'FSEG', 'name' => 'Faculté des sciences économiques et de gestion', 'campus' => 'CAMP-01'],
                ['code' => 'FDJ', 'name' => 'Faculté de droit et des sciences juridiques', 'campus' => 'CAMP-01'],
                ['code' => 'FMED', 'name' => 'Faculté des sciences de la santé', 'campus' => 'CAMP-02'],
                ['code' => 'FLSH', 'name' => 'Faculté des lettres et sciences humaines', 'campus' => 'CAMP-03'],
                ['code' => 'FAGRO', 'name' => 'Faculté d’agronomie et d’environnement', 'campus' => 'CAMP-04'],
            ];

            foreach ($facultySpecs as $spec) {
                $campus = $campuses->get($spec['campus']);
                if (! $campus) {
                    throw new RuntimeException("Le campus {$spec['campus']} est introuvable.");
                }

                Faculty::query()->firstOrCreate(
                    ['code' => $spec['code']],
                    ['campus_id' => $campus->id, 'name' => $spec['name']],
                );
            }

            $faculties = Faculty::query()->get()->keyBy('code');

            $departmentSpecs = [
                ['faculty' => 'FST', 'code' => 'MAT', 'name' => 'Mathématiques appliquées'],
                ['faculty' => 'FST', 'code' => 'PHYS', 'name' => 'Physique et matériaux'],
                ['faculty' => 'FSTA', 'code' => 'GC', 'name' => 'Génie civil'],
                ['faculty' => 'FSTA', 'code' => 'ELEC', 'name' => 'Génie électrique'],
                ['faculty' => 'FSTA 2', 'code' => 'TEL', 'name' => 'Télécommunications'],
                ['faculty' => 'FSTA 2', 'code' => 'CYBER', 'name' => 'Cybersécurité'],
                ['faculty' => 'FSEG', 'code' => 'ECO', 'name' => 'Économie'],
                ['faculty' => 'FSEG', 'code' => 'GEST', 'name' => 'Sciences de gestion'],
                ['faculty' => 'FSEG', 'code' => 'FIN', 'name' => 'Comptabilité et finance'],
                ['faculty' => 'FDJ', 'code' => 'DPRIV', 'name' => 'Droit privé'],
                ['faculty' => 'FDJ', 'code' => 'DPUBL', 'name' => 'Droit public'],
                ['faculty' => 'FMED', 'code' => 'MED', 'name' => 'Médecine'],
                ['faculty' => 'FMED', 'code' => 'PHAR', 'name' => 'Pharmacie'],
                ['faculty' => 'FMED', 'code' => 'SPUB', 'name' => 'Santé publique'],
                ['faculty' => 'FLSH', 'code' => 'LETT', 'name' => 'Lettres modernes'],
                ['faculty' => 'FLSH', 'code' => 'SOCIO', 'name' => 'Sociologie'],
                ['faculty' => 'FAGRO', 'code' => 'AGRO', 'name' => 'Sciences agronomiques'],
                ['faculty' => 'FAGRO', 'code' => 'ENV', 'name' => 'Gestion de l’environnement'],
            ];

            foreach ($departmentSpecs as $spec) {
                $faculty = $faculties->get($spec['faculty']);
                if (! $faculty) {
                    throw new RuntimeException("La faculté {$spec['faculty']} est introuvable.");
                }

                Department::query()->firstOrCreate(
                    ['code' => $spec['code']],
                    ['faculty_id' => $faculty->id, 'name' => $spec['name']],
                );
            }

            $departments = Department::query()->with('faculty')->get()->keyBy('code');
            $newPrograms = [];
            foreach ($departmentSpecs as $spec) {
                $department = $departments->get($spec['code']);
                $program = Program::query()->firstOrCreate(
                    ['department_id' => $department->id, 'code' => 'LIC-'.$spec['code']],
                    [
                        'name' => 'Licence '.$department->name,
                        'degree_level' => 'LICENCE',
                        'duration_years' => in_array($spec['code'], ['MED', 'PHAR'], true) ? 5 : 3,
                    ],
                );
                $newPrograms[] = $program;

                for ($level = 1; $level <= $program->duration_years; $level++) {
                    ClassGroup::query()->firstOrCreate(
                        [
                            'program_id' => $program->id,
                            'academic_year_id' => $year->id,
                            'level_code' => 'L'.$level,
                            'code' => 'A',
                        ],
                        [
                            'name' => 'L'.$level.' - Groupe A',
                            'level' => $level,
                            'capacity' => 60,
                        ],
                    );
                }

                Course::query()->firstOrCreate(
                    ['department_id' => $department->id, 'code' => 'CRS-'.$spec['code']],
                    [
                        'name' => 'Introduction aux '.$department->name,
                        'description' => 'Cours de démonstration pour la filière '.$department->name.'.',
                        'credits' => 6,
                    ],
                );
            }

            $courseUnitsByFaculty = collect();
            foreach ($faculties as $faculty) {
                $facultyCode = preg_replace('/[^A-Z0-9]/', '', strtoupper($faculty->code));
                $units = collect();

                for ($unitNumber = 1; $unitNumber <= 10; $unitNumber++) {
                    $unit = CourseUnit::query()->firstOrCreate(
                        ['code' => sprintf('UE-%s-%02d', $facultyCode, $unitNumber)],
                        [
                            'faculty_id' => $faculty->id,
                            'name' => 'Unité '.$unitNumber.' - '.$faculty->name,
                            'credits' => 6,
                        ],
                    );
                    $units->push($unit);

                    for ($subjectNumber = 1; $subjectNumber <= 2; $subjectNumber++) {
                        Subject::query()->firstOrCreate(
                            ['code' => $unit->code.'-EC'.$subjectNumber],
                            [
                                'course_unit_id' => $unit->id,
                                'name' => $subjectNumber === 1 ? 'Cours magistral' : 'Travaux dirigés',
                                'coefficient' => 1.00,
                            ],
                        );
                    }
                }

                $courseUnitsByFaculty->put($faculty->id, $units);
            }

            foreach ($campuses as $campus) {
                foreach ([
                    ['code' => 'AMPHI-01', 'name' => 'Amphithéâtre principal', 'capacity' => 180, 'type' => 'amphitheatre'],
                    ['code' => 'SALLE-01', 'name' => 'Salle de cours 01', 'capacity' => 60, 'type' => 'classroom'],
                    ['code' => 'LABO-01', 'name' => 'Laboratoire pédagogique 01', 'capacity' => 30, 'type' => 'laboratory'],
                ] as $room) {
                    Room::query()->firstOrCreate(
                        ['campus_id' => $campus->id, 'code' => $room['code']],
                        [
                            'name' => $room['name'],
                            'capacity' => $room['capacity'],
                            'type' => $room['type'],
                            'is_active' => true,
                        ],
                    );
                }
            }

            $teachers = collect();
            for ($number = 1; $number <= 12; $number++) {
                $email = sprintf('enseignant.%02d@demo-univ.test', $number);
                $teacher = User::query()->firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => sprintf('Enseignant %02d - Donnée synthétique', $number),
                        'password' => Hash::make(Str::random(48)),
                        'role' => 'teacher',
                        'is_active' => true,
                        'must_change_password' => true,
                        'email_verified_at' => now(),
                    ],
                );
                $teachers->push($teacher);
            }

            $subjects = Subject::query()->orderBy('id')->get();
            foreach ($subjects as $index => $subject) {
                $teacher = $teachers[$index % $teachers->count()];
                SubjectTeacherAssignment::query()->firstOrCreate([
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacher->id,
                    'academic_year_id' => $year->id,
                ]);
            }

            foreach ($newPrograms as $program) {
                $facultyUnits = $courseUnitsByFaculty->get($program->department->faculty_id, collect());
                $curriculum = Curriculum::query()->firstOrCreate(
                    ['program_id' => $program->id, 'version' => 1],
                    ['academic_year_id' => $year->id, 'name' => 'Maquette '.$program->name],
                );

                foreach ([1, 2] as $semesterNumber) {
                    $semester = CurriculumSemester::query()->firstOrCreate(
                        ['curriculum_id' => $curriculum->id, 'code' => 'S'.$semesterNumber],
                        [
                            'name' => 'Semestre '.$semesterNumber,
                            'position' => $semesterNumber,
                            'target_credits' => 30,
                        ],
                    );

                    foreach ($facultyUnits->slice(($semesterNumber - 1) * 5, 5) as $unit) {
                        DB::table('curriculum_course_units')->updateOrInsert(
                            ['curriculum_semester_id' => $semester->id, 'course_unit_id' => $unit->id],
                            ['is_required' => true, 'created_at' => now(), 'updated_at' => now()],
                        );
                    }
                }
            }
        });

        $this->command?->info(sprintf(
            'Structure universitaire complétée : %d campus, %d facultés, %d départements, %d filières, %d classes, %d UE, %d ECUE, %d enseignants et %d salles.',
            DB::table('campuses')->count(),
            DB::table('faculties')->count(),
            DB::table('departments')->count(),
            DB::table('programs')->count(),
            DB::table('classes')->count(),
            DB::table('course_units')->count(),
            DB::table('subjects')->count(),
            User::query()->where('role', 'teacher')->count(),
            DB::table('rooms')->count(),
        ));
    }
}
