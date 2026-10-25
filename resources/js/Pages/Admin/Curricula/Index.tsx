import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { BookOpen, Layers3, Plus, Trash2 } from 'lucide-react';

type AcademicYear = { id: number; name: string; is_current: boolean };
type Program = { id: string; code: string; name: string; degree_level: string; duration_years: number; department: { id: number; name: string; faculty_id: number } };
type CourseUnit = { id: number; faculty_id: number; code: string; name: string; credits: number };
type Semester = { id: number; code: string; name: string; position: number; target_credits: number | null; course_units: Array<CourseUnit & { pivot: { is_required: boolean } }> };
type Curriculum = { id: string; name: string; version: number; academic_year_id: number; academic_year: AcademicYear; program: Program; semesters: Semester[] };
type PageProps = { flash?: { success?: string }; errors?: Record<string, string> };

function CurriculumCard({ curriculum, courseUnits }: { curriculum: Curriculum; courseUnits: CourseUnit[] }) {
    const hasLmdCreditTarget = ['LICENCE', 'MASTER'].includes(curriculum.program.degree_level);
    const semesterForm = useForm<{ code: string; name: string; position: number; target_credits: number | '' }>({ code: '', name: '', position: curriculum.semesters.length + 1, target_credits: hasLmdCreditTarget ? 30 : '' });
    const unitForm = useForm({ course_unit_id: '', is_required: true });
    const availableUnits = courseUnits.filter((unit) => unit.faculty_id === curriculum.program.department.faculty_id);

    const addSemester = (event: React.FormEvent) => {
        event.preventDefault();
        semesterForm.post(route('admin.curricula.semesters.store', curriculum.id), {
            onSuccess: () => { semesterForm.reset('code', 'name'); semesterForm.setData('position', curriculum.semesters.length + 2); },
        });
    };

    return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3"><span className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700"><BookOpen className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">{curriculum.name}</h2><p className="mt-1 text-sm text-slate-600">{curriculum.program.code} · {curriculum.program.name}</p><p className="text-xs text-slate-500">{curriculum.program.department.name} · Année d’application {curriculum.academic_year.name}</p></div></div>
            <div className="flex items-center gap-2"><span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">Version {curriculum.version}</span><button type="button" disabled={curriculum.semesters.length > 0} title={curriculum.semesters.length > 0 ? 'Supprimez les périodes avant de supprimer la maquette' : 'Supprimer la maquette'} onClick={() => { if (confirm(`Supprimer la maquette ${curriculum.name} ?`)) router.delete(route('admin.curricula.destroy', curriculum.id)); }} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div>
        </header>
        <div className="space-y-4 p-5">
            {curriculum.semesters.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">Aucun semestre défini. Ajoutez les périodes selon l’organisation de cette filière.</p> : curriculum.semesters.map((semester) => {
                const totalCredits = semester.course_units.reduce((sum, unit) => sum + unit.credits, 0);
                return <section key={semester.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3"><div><h3 className="font-semibold text-slate-800">{semester.name}</h3><p className="text-xs text-slate-500">{semester.code} · Semestre {semester.position} · {totalCredits} crédits programmés{semester.target_credits ? ` / ${semester.target_credits} crédits repères` : ''}</p></div><div className="flex items-center gap-2"><span className="text-xs text-slate-500">{semester.course_units.length} UE</span><button type="button" disabled={semester.course_units.length > 0} title={semester.course_units.length > 0 ? 'Retirez les UE avant de supprimer cette période' : 'Supprimer la période'} onClick={() => { if (confirm(`Supprimer la période ${semester.name} ?`)) router.delete(route('admin.curricula.semesters.destroy', semester.id)); }} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div></div>
                    {semester.course_units.length > 0 && <ul className="divide-y divide-slate-100">{semester.course_units.map((unit) => <li key={unit.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium text-slate-800">{unit.code} — {unit.name}</p><p className="text-xs text-slate-500">{unit.credits} crédits · {unit.pivot.is_required ? 'Obligatoire' : 'Optionnelle'}</p></div><button type="button" aria-label={`Retirer ${unit.name} de ${semester.name}`} onClick={() => { if (confirm(`Retirer ${unit.name} de ${semester.name} ?`)) router.delete(route('admin.curricula.course-units.detach', [semester.id, unit.id])); }} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
                    <form onSubmit={(event) => { event.preventDefault(); unitForm.post(route('admin.curricula.course-units.attach', semester.id), { onSuccess: () => unitForm.reset('course_unit_id') }); }} className="grid gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                        <label className="text-sm font-medium text-slate-700">Ajouter une UE<select required value={unitForm.data.course_unit_id} onChange={(event) => unitForm.setData('course_unit_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300 bg-white"><option value="">Choisir une UE</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.code} — {unit.name} ({unit.credits} crédits)</option>)}</select>{unitForm.errors.course_unit_id && <span className="mt-1 block text-xs text-red-600">{unitForm.errors.course_unit_id}</span>}</label>
                        <label className="flex items-center gap-2 py-2 text-sm text-slate-600"><input type="checkbox" checked={unitForm.data.is_required} onChange={(event) => unitForm.setData('is_required', event.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />Obligatoire</label>
                        <button disabled={unitForm.processing || availableUnits.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Ajouter l’UE</button>
                        {availableUnits.length === 0 && <p className="text-xs text-amber-700 sm:col-span-3">Aucune UE n’est définie pour la faculté de cette filière.</p>}
                    </form>
                </section>;
            })}
            <form onSubmit={addSemester} className="grid gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_100px_150px_auto] lg:items-end">
                <label className="text-sm font-medium text-slate-700">Code<input required maxLength={20} value={semesterForm.data.code} onChange={(event) => semesterForm.setData('code', event.target.value)} placeholder="S1" className="mt-1 w-full rounded-lg border-slate-300 bg-white" />{semesterForm.errors.code && <span className="mt-1 block text-xs text-red-600">{semesterForm.errors.code}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Nom de la période<input required maxLength={100} value={semesterForm.data.name} onChange={(event) => semesterForm.setData('name', event.target.value)} placeholder="Semestre 1, Trimestre A…" className="mt-1 w-full rounded-lg border-slate-300 bg-white" />{semesterForm.errors.name && <span className="mt-1 block text-xs text-red-600">{semesterForm.errors.name}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Ordre<input required type="number" min={1} max={99} value={semesterForm.data.position} onChange={(event) => semesterForm.setData('position', Number(event.target.value))} className="mt-1 w-full rounded-lg border-slate-300 bg-white" />{semesterForm.errors.position && <span className="mt-1 block text-xs text-red-600">{semesterForm.errors.position}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Crédits repères<input type="number" min={1} max={60} value={semesterForm.data.target_credits} onChange={(event) => semesterForm.setData('target_credits', event.target.value ? Number(event.target.value) : '')} placeholder="Facultatif" className="mt-1 w-full rounded-lg border-slate-300 bg-white" />{semesterForm.errors.target_credits && <span className="mt-1 block text-xs text-red-600">{semesterForm.errors.target_credits}</span>}</label>
                <button disabled={semesterForm.processing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"><Plus className="h-4 w-4" />Ajouter la période</button>
            </form>
        </div>
    </article>;
}

export default function CurriculaIndex({ programs, academicYears, courseUnits, curricula }: { programs: Program[]; academicYears: AcademicYear[]; courseUnits: CourseUnit[]; curricula: Curriculum[] }) {
    const { flash, errors } = usePage().props as PageProps;
    const form = useForm({ program_id: '', academic_year_id: '', name: '', version: 1 });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('admin.curricula.store'), { onSuccess: () => form.reset('name') });
    };

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Maquettes pédagogiques</h1><p className="mt-1 text-sm text-slate-500">Trame LMD proposée : deux semestres par année et 30 crédits repères par semestre en Licence/Master. À valider selon le règlement de l’établissement.</p></div>}>
        <Head title="Maquettes pédagogiques" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><BackButton href={route('admin.academic.index')} label="Retour à la structure académique" /><div className="flex items-center gap-3"><Link href={route('admin.academic-groups.index')} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50">Gérer les groupes</Link><div className="text-sm text-slate-500">{curricula.length} maquette{curricula.length !== 1 ? 's' : ''}</div></div></div>
            {flash?.success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
            {Object.values(errors ?? {}).length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{Object.values(errors ?? {}).join(' ')}</div>}
            <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1.5fr_130px_auto] xl:items-end">
                <div className="md:col-span-2 xl:col-span-1"><h2 className="font-semibold text-slate-900">Créer une maquette</h2><p className="mt-1 text-xs text-slate-500">Choisissez la filière, l’année et le numéro de version.</p></div>
                <label className="text-sm font-medium text-slate-700">Filière<select required value={form.data.program_id} onChange={(event) => form.setData('program_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une filière</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.code} — {program.name}</option>)}</select>{form.errors.program_id && <span className="mt-1 block text-xs text-red-600">{form.errors.program_id}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Année d’application<select required value={form.data.academic_year_id} onChange={(event) => form.setData('academic_year_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une année</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select>{form.errors.academic_year_id && <span className="mt-1 block text-xs text-red-600">{form.errors.academic_year_id}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Nom<input required maxLength={150} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Maquette Licence Informatique" className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.name && <span className="mt-1 block text-xs text-red-600">{form.errors.name}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Version<input required type="number" min={1} max={999} value={form.data.version} onChange={(event) => form.setData('version', Number(event.target.value))} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.version && <span className="mt-1 block text-xs text-red-600">{form.errors.version}</span>}</label>
                <button disabled={form.processing || programs.length === 0 || academicYears.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Créer</button>
                {(programs.length === 0 || academicYears.length === 0) && <p className="text-xs text-amber-700 md:col-span-2 xl:col-span-5">Créez d’abord une filière et une année académique.</p>}
                {Object.values(form.errors).length > 0 && <p role="alert" className="text-sm text-red-600 md:col-span-2 xl:col-span-5">{Object.values(form.errors).join(' ')}</p>}
            </form>
            {curricula.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Layers3 className="mx-auto h-8 w-8 text-slate-300"/><h2 className="mt-3 font-semibold text-slate-800">Aucune maquette pour le moment</h2><p className="mt-1 text-sm text-slate-500">Créez une maquette, définissez ses périodes, puis ajoutez les UE correspondantes.</p></div> : <div className="space-y-5">{curricula.map((curriculum) => <CurriculumCard key={curriculum.id} curriculum={curriculum} courseUnits={courseUnits} />)}</div>}
        </div></main>
    </AuthenticatedLayout>;
}
