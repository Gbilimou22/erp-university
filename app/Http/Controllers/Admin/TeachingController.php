<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseUnit;
use App\Models\AcademicYear;
use App\Models\Faculty;
use App\Models\Subject;
use App\Models\User;
use App\Models\SubjectTeacherAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeachingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Teaching/Index', [
            'faculties' => Faculty::query()->orderBy('name')->get(['id', 'name', 'code']),
            'courseUnits' => CourseUnit::query()->with('faculty:id,name,code')->withCount('subjects')
                ->withCount('subjects')->orderBy('name')->get(),
        ]);
    }

    public function subjects(): Response
    {
        return Inertia::render('Admin/Teaching/Subjects', [
            'courseUnits' => CourseUnit::query()->with(['faculty:id,name', 'subjects:id,course_unit_id,code,name,coefficient'])
                ->orderBy('name')->get(['id', 'faculty_id', 'code', 'name', 'credits']),
        ]);
    }

    public function assignments(): Response
    {
        $years = AcademicYear::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']);

        return Inertia::render('Admin/Teaching/Assignments', [
            'academicYears' => $years,
            'currentYearId' => $years->firstWhere('is_current', true)?->id ?? $years->first()?->id,
            'teachers' => User::query()->where('role', 'teacher')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']),
            'subjects' => Subject::query()->with(['courseUnit:id,code,name', 'teachers:id,name,email'])
                ->orderBy('name')->get(['id', 'course_unit_id', 'code', 'name']),
        ]);
    }

    public function storeAssignment(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'teacher_id' => ['required', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'teacher')->where('is_active', true))],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
        ]);
        Subject::findOrFail($data['subject_id'])->teachers()->syncWithoutDetaching([
            $data['teacher_id'] => ['academic_year_id' => $data['academic_year_id']],
        ]);

        return back()->with('success', 'Enseignant affecté à cette matière pour l’année sélectionnée.');
    }

    public function destroyAssignment(Request $request, Subject $subject, User $teacher): RedirectResponse
    {
        $data = $request->validate(['academic_year_id' => ['required', 'exists:academic_years,id']]);
        $assignment = SubjectTeacherAssignment::query()
            ->where('subject_id', $subject->id)
            ->where('teacher_id', $teacher->id)
            ->where('academic_year_id', $data['academic_year_id'])
            ->first();
        if ($assignment?->timetableEntries()->exists()) {
            return back()->withErrors(['assignment' => 'Supprimez d’abord les créneaux de cette affectation.']);
        }
        $subject->teachers()->newPivotStatement()
            ->where('subject_id', $subject->id)
            ->where('teacher_id', $teacher->id)
            ->where('academic_year_id', $data['academic_year_id'])
            ->delete();

        return back()->with('success', 'Affectation supprimée.');
    }

    public function storeCourseUnit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'faculty_id' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:30', 'alpha_dash', 'unique:course_units,code'],
            'name' => ['required', 'string', 'max:150'],
            'credits' => ['required', 'integer', 'min:1', 'max:60'],
        ]);
        CourseUnit::create([...$data, 'code' => strtoupper($data['code'])]);

        return back()->with('success', 'Unité d’enseignement créée.');
    }

    public function updateCourseUnit(Request $request, CourseUnit $courseUnit): RedirectResponse
    {
        $data = $request->validate([
            'faculty_id' => ['required', 'exists:faculties,id'],
            'code' => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('course_units', 'code')->ignore($courseUnit->id)],
            'name' => ['required', 'string', 'max:150'],
            'credits' => ['required', 'integer', 'min:1', 'max:60'],
        ]);
        $courseUnit->update([...$data, 'code' => strtoupper($data['code'])]);

        return back()->with('success', 'Unité d’enseignement mise à jour.');
    }

    public function destroyCourseUnit(CourseUnit $courseUnit): RedirectResponse
    {
        if ($courseUnit->subjects()->whereHas('grades')->exists()) {
            return back()->withErrors(['courseUnit' => 'Cette UE contient des matières avec des notes et ne peut pas être supprimée.']);
        }
        $courseUnit->delete();

        return back()->with('success', 'Unité d’enseignement supprimée.');
    }

    public function storeSubject(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'course_unit_id' => ['required', 'exists:course_units,id'],
            'code' => ['required', 'string', 'max:30', 'alpha_dash', 'unique:subjects,code'],
            'name' => ['required', 'string', 'max:150'],
            'coefficient' => ['required', 'numeric', 'gt:0', 'max:99.99'],
        ]);
        Subject::create([...$data, 'code' => strtoupper($data['code'])]);

        return redirect()->route('admin.teaching.subjects.index')->with('success', 'Matière (ECUE) créée.');
    }

    public function updateSubject(Request $request, Subject $subject): RedirectResponse
    {
        $data = $request->validate([
            'course_unit_id' => ['required', 'exists:course_units,id'],
            'code' => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('subjects', 'code')->ignore($subject->id)],
            'name' => ['required', 'string', 'max:150'],
            'coefficient' => ['required', 'numeric', 'gt:0', 'max:99.99'],
        ]);
        $subject->update([...$data, 'code' => strtoupper($data['code'])]);

        return redirect()->route('admin.teaching.subjects.index')->with('success', 'Matière mise à jour.');
    }

    public function destroySubject(Subject $subject): RedirectResponse
    {
        if ($subject->grades()->exists()) {
            return back()->withErrors(['subject' => 'Cette matière contient des notes et ne peut pas être supprimée.']);
        }
        $subject->delete();

        return back()->with('success', 'Matière supprimée.');
    }
}
