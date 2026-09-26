import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { BookOpen, CalendarDays, UserRound, UserPlus, Trash2 } from 'lucide-react';

type Year = { id: number; name: string; is_current: boolean };
type Teacher = { id: number; name: string; email: string };
type Subject = { id: number; code: string; name: string; course_unit: { code: string; name: string }; teachers: Array<Teacher & { pivot: { academic_year_id: number } }> };

export default function Assignments({ academicYears, currentYearId, teachers, subjects }: { academicYears: Year[]; currentYearId?: number; teachers: Teacher[]; subjects: Subject[] }) {
    const [yearId, setYearId] = React.useState(String(currentYearId ?? academicYears[0]?.id ?? ''));
    const form = useForm({ subject_id: '', teacher_id: '', academic_year_id: String(currentYearId ?? academicYears[0]?.id ?? '') });

    const assign = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('admin.teaching.assignments.store'), { onSuccess: () => form.reset('subject_id', 'teacher_id') });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Affectations pédagogiques</h1>
                    <p className="mt-1 text-sm text-slate-500">Associez les enseignants aux matières pour chaque année académique.</p>
                </div>
            }
        >
            <Head title="Affectation des enseignants" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <BackButton href={route('admin.teachers.index')} label="Retour aux enseignants" />
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('admin.teaching.index')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><BookOpen className="h-4 w-4" />Gérer les UE / ECUE</Link>
                        <Link href={route('admin.timetable.index')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800"><CalendarDays className="h-4 w-4" />Emploi du temps</Link>
                    </div>
                </div>
                <form onSubmit={assign} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
                    <label className="text-sm font-medium text-slate-700">Matière
                        <select required value={form.data.subject_id} onChange={(e) => form.setData('subject_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une matière</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}</select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Enseignant
                        <select required value={form.data.teacher_id} onChange={(e) => form.setData('teacher_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir un enseignant</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Année académique
                        <select required value={form.data.academic_year_id} onChange={(e) => { form.setData('academic_year_id', e.target.value); setYearId(e.target.value); }} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une année</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select>
                    </label>
                    <div className="flex items-end"><button disabled={form.processing || !teachers.length || !subjects.length || !academicYears.length} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />{form.processing ? 'Affectation…' : 'Affecter'}</button></div>
                    {Object.values(form.errors).length > 0 && <p role="alert" className="text-sm text-red-600 md:col-span-2 xl:col-span-4">{Object.values(form.errors).join(' ')}</p>}
                    {teachers.length === 0 && <p className="flex flex-wrap items-center gap-2 text-sm text-amber-800 md:col-span-2 xl:col-span-4"><span>Aucun compte enseignant actif. Il faut créer un compte avant de pouvoir affecter une matière.</span><Link href={route('admin.teachers.index')} className="inline-flex items-center gap-1 font-semibold underline"><UserPlus className="h-4 w-4" />Créer un compte enseignant</Link></p>}
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Affectations existantes</h2>
                    <label className="flex items-center gap-2 text-sm text-slate-600">Année affichée <select value={yearId} onChange={(e) => setYearId(e.target.value)} className="rounded-lg border-slate-300">{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
                </div>
                {subjects.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Créez d’abord des UE et des matières dans le module Enseignements.</div> : <div className="grid gap-4 lg:grid-cols-2">{subjects.map((subject) => {
                    const assigned = subject.teachers.filter((teacher) => String(teacher.pivot.academic_year_id) === yearId);
                    return <article key={subject.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-blue-600" /><div><h3 className="font-semibold text-slate-800">{subject.name}</h3><p className="text-xs text-slate-500">{subject.code} · {subject.course_unit?.code} — {subject.course_unit?.name}</p></div></div>
                        {assigned.length === 0 ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Aucun enseignant affecté pour cette année.</p> : <ul className="divide-y">{assigned.map((teacher) => <li key={teacher.id} className="flex items-center justify-between gap-3 py-2"><span className="flex items-center gap-2 text-sm text-slate-700"><UserRound className="h-4 w-4 text-slate-400" /><span>{teacher.name}<span className="ml-2 text-xs text-slate-400">{teacher.email}</span></span></span><button type="button" aria-label={`Retirer ${teacher.name}`} onClick={() => { if (confirm(`Retirer ${teacher.name} de cette matière ?`)) router.delete(route('admin.teaching.assignments.destroy', [subject.id, teacher.id]), { data: { academic_year_id: yearId } }); }} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
                    </article>;
                })}</div>}
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
