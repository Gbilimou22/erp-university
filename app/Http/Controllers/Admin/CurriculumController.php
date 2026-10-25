<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\CourseUnit;
use App\Models\Curriculum;
use App\Models\CurriculumSemester;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Curricula/Index', [
            'programs' => Program::query()->with('department:id,name,faculty_id')->orderBy('name')->get(['id', 'department_id', 'code', 'name', 'degree_level', 'duration_years']),
            'academicYears' => AcademicYear::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'courseUnits' => CourseUnit::query()->with('faculty:id,name')->orderBy('code')->get(['id', 'faculty_id', 'code', 'name', 'credits']),
            'curricula' => Curriculum::query()->with([
                'program:id,department_id,code,name,degree_level,duration_years',
                'program.department:id,name,faculty_id',
                'academicYear:id,name,is_current',
                'semesters.courseUnits:id,faculty_id,code,name,credits',
            ])->orderByDesc('created_at')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:150'],
            'version' => ['required', 'integer', 'min:1', 'max:999'],
        ]);
        $request->validate([
            'version' => [Rule::unique('curricula', 'version')->where('program_id', $data['program_id'])],
        ]);
        $program = Program::findOrFail($data['program_id']);
        DB::transaction(function () use ($data, $program): void {
            $curriculum = Curriculum::create($data);
            $targetCredits = in_array($program->degree_level, ['LICENCE', 'MASTER'], true) ? 30 : null;

            for ($position = 1; $position <= $program->duration_years * 2; $position++) {
                $curriculum->semesters()->create([
                    'code' => 'S'.$position,
                    'name' => 'Semestre '.$position,
                    'position' => $position,
                    'target_credits' => $targetCredits,
                ]);
            }
        });

        return redirect()->route('admin.curricula.index')->with('success', 'Maquette pédagogique créée.');
    }

    public function storeSemester(Request $request, Curriculum $curriculum): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'alpha_dash', Rule::unique('curriculum_semesters', 'code')->where('curriculum_id', $curriculum->id)],
            'name' => ['required', 'string', 'max:100'],
            'position' => ['required', 'integer', 'min:1', 'max:99', Rule::unique('curriculum_semesters', 'position')->where('curriculum_id', $curriculum->id)],
            'target_credits' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $curriculum->semesters()->create([...$data, 'code' => strtoupper($data['code'])]);

        return redirect()->route('admin.curricula.index')->with('success', 'Semestre ajouté à la maquette.');
    }

    public function destroy(Curriculum $curriculum): RedirectResponse
    {
        if ($curriculum->semesters()->exists()) {
            return back()->withErrors(['curriculum' => 'Retirez d’abord les périodes de cette maquette.']);
        }

        $curriculum->delete();

        return redirect()->route('admin.curricula.index')->with('success', 'Maquette pédagogique supprimée.');
    }

    public function destroySemester(CurriculumSemester $semester): RedirectResponse
    {
        if ($semester->courseUnits()->exists()) {
            return back()->withErrors(['semester' => 'Retirez d’abord les UE de cette période.']);
        }

        $semester->delete();

        return redirect()->route('admin.curricula.index')->with('success', 'Période supprimée de la maquette.');
    }

    public function attachCourseUnit(Request $request, CurriculumSemester $semester): RedirectResponse
    {
        $data = $request->validate([
            'course_unit_id' => ['required', 'exists:course_units,id'],
            'is_required' => ['required', 'boolean'],
        ]);
        DB::transaction(function () use ($semester, $data): void {
            $curriculum = Curriculum::query()->with('program.department')->lockForUpdate()->findOrFail($semester->curriculum_id);
            $courseUnit = CourseUnit::findOrFail($data['course_unit_id']);

            if ((int) $courseUnit->faculty_id !== (int) $curriculum->program->department->faculty_id) {
                throw ValidationException::withMessages(['course_unit_id' => 'Cette UE appartient à une autre faculté que la filière de la maquette.']);
            }

            $alreadyAttached = DB::table('curriculum_course_units')
                ->join('curriculum_semesters', 'curriculum_semesters.id', '=', 'curriculum_course_units.curriculum_semester_id')
                ->where('curriculum_semesters.curriculum_id', $curriculum->id)
                ->where('curriculum_course_units.course_unit_id', $courseUnit->id)
                ->exists();

            if ($alreadyAttached) {
                throw ValidationException::withMessages(['course_unit_id' => 'Cette UE figure déjà dans un semestre de cette maquette.']);
            }

            $semester->courseUnits()->attach($courseUnit->id, ['is_required' => $data['is_required']]);
        });

        return redirect()->route('admin.curricula.index')->with('success', 'UE ajoutée au semestre.');
    }

    public function detachCourseUnit(CurriculumSemester $semester, CourseUnit $courseUnit): RedirectResponse
    {
        $semester->courseUnits()->detach($courseUnit->id);

        return redirect()->route('admin.curricula.index')->with('success', 'UE retirée du semestre.');
    }
}
