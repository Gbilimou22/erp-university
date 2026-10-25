import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Plus, Trash2, UsersRound } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

type Program = { id: string; code: string; name: string; degree_level: string; duration_years: number };
type AcademicYear = { id: number; name: string; is_current: boolean };
type Group = { id: string; program_id: string; academic_year_id: number; level_code: string; code: string; name: string; capacity: number; enrollments_count: number; program: Program; academic_year: AcademicYear };
type PageProps = { flash?: { success?: string }; errors?: Record<string, string> };

const levelPrefix: Record<string, string> = { LICENCE: 'L', MASTER: 'M', DOCTORAT: 'D', DUT: 'L' };

export default function AcademicGroupsIndex({ programs, academicYears, groups }: { programs: Program[]; academicYears: AcademicYear[]; groups: Group[] }) {
    const { flash, errors } = usePage().props as PageProps;
    const form = useForm({ program_id: '', academic_year_id: '', level_code: '', code: '', name: '', capacity: 60 });
    const selectedProgram = programs.find((program) => program.id === form.data.program_id);
    const levels = selectedProgram
        ? Array.from({ length: selectedProgram.duration_years }, (_, index) => `${levelPrefix[selectedProgram.degree_level] ?? 'L'}${index + 1}`)
        : [];

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('admin.academic-groups.store'), { onSuccess: () => form.reset('level_code', 'code', 'name') });
    };

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Groupes pédagogiques</h1><p className="mt-1 text-sm text-slate-500">Répartissez les étudiants par filière, année académique et niveau.</p></div>}>
        <Head title="Groupes pédagogiques" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><BackButton href={route('admin.curricula.index')} label="Retour aux maquettes" /><span className="text-sm text-slate-500">{groups.length} groupe{groups.length === 1 ? '' : 's'}</span></div>
            {flash?.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
            {Object.values(errors ?? {}).length > 0 && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{Object.values(errors ?? {}).join(' ')}</div>}
            <form onSubmit={submit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6 xl:items-end">
                <label className="text-sm font-medium text-slate-700">Filière<select required value={form.data.program_id} onChange={(event) => { form.setData({ ...form.data, program_id: event.target.value, level_code: '' }); }} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une filière</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.code} — {program.name}</option>)}</select>{form.errors.program_id && <span className="text-xs text-red-600">{form.errors.program_id}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Année académique<select required value={form.data.academic_year_id} onChange={(event) => form.setData('academic_year_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une année</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select>{form.errors.academic_year_id && <span className="text-xs text-red-600">{form.errors.academic_year_id}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Niveau<select required value={form.data.level_code} onChange={(event) => form.setData('level_code', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir un niveau</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select>{form.errors.level_code && <span className="text-xs text-red-600">{form.errors.level_code}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Code du groupe<input required maxLength={20} value={form.data.code} onChange={(event) => form.setData('code', event.target.value)} placeholder="A" className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.code && <span className="text-xs text-red-600">{form.errors.code}</span>}</label>
                <label className="text-sm font-medium text-slate-700">Nom<input required maxLength={100} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Groupe A" className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.name && <span className="text-xs text-red-600">{form.errors.name}</span>}</label>
                <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm font-medium text-slate-700">Capacité<input required type="number" min={1} max={500} value={form.data.capacity} onChange={(event) => form.setData('capacity', Number(event.target.value))} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.capacity && <span className="text-xs text-red-600">{form.errors.capacity}</span>}</label><button disabled={form.processing || !programs.length || !academicYears.length} title="Créer le groupe" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"><Plus className="h-4 w-4" /></button></div>
                {(!programs.length || !academicYears.length) && <p className="text-xs text-amber-700 md:col-span-2 xl:col-span-6">Créez d’abord une filière et une année académique.</p>}
            </form>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 p-4"><UsersRound className="h-5 w-5 text-emerald-700" /><h2 className="font-semibold text-slate-800">Groupes enregistrés</h2></div>
                {groups.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Aucun groupe créé.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Groupe</th><th className="p-4">Filière</th><th className="p-4">Année</th><th className="p-4">Niveau</th><th className="p-4">Effectif</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{groups.map((group) => <tr key={group.id}><td className="p-4 font-medium text-slate-800">{group.code} — {group.name}</td><td className="p-4">{group.program.code} — {group.program.name}</td><td className="p-4">{group.academic_year.name}</td><td className="p-4">{group.level_code}</td><td className="p-4">{group.enrollments_count} / {group.capacity}</td><td className="p-4 flex items-center gap-2"><Link href={route('admin.academic-groups.show', group.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" /> Voir</Link><button type="button" disabled={group.enrollments_count > 0} title={group.enrollments_count ? 'Ce groupe contient des étudiants inscrits' : 'Supprimer le groupe'} onClick={() => { if (confirm(`Supprimer le groupe ${group.code} ?`)) router.delete(route('admin.academic-groups.destroy', group.id)); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
            </section>
        </div></main>
    </AuthenticatedLayout>;
}
