import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

interface Program { id: string; name: string; code: string }
interface Department { id: number; name: string; code: string; faculty?: { name: string }; programs: Program[] }
interface AcademicYear { id: number; name: string; is_current: boolean }
interface AcademicGroup { id: string; program_id: string; academic_year_id: number; level_code: string; code: string; name: string; capacity: number; enrollments_count: number }
interface Enrollment { program_id: string; academic_year_id: number; level: string; class_id: string | null }
interface Student { id: number; first_name: string; last_name: string; email: string; phone: string | null; birth_date: string; gender: string; department_id: number; enrollments: Enrollment[] }
interface Props { student: Student; departments: Department[]; academicYears: AcademicYear[]; groups: AcademicGroup[] }

export default function EditStudent({ student, departments, academicYears, groups }: Props) {
    const enrollment = student.enrollments[0];
    const form = useForm({
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone ?? '',
        birth_date: student.birth_date?.slice(0, 10) ?? '',
        gender: student.gender,
        department_id: String(student.department_id),
        program_id: String(enrollment?.program_id ?? ''),
        academic_year_id: String(enrollment?.academic_year_id ?? ''),
        level: enrollment?.level ?? 'L1',
        class_id: enrollment?.class_id ?? '',
    });
    const availablePrograms = departments.find((department) => String(department.id) === form.data.department_id)?.programs ?? [];
    const availableGroups = groups.filter((group) =>
        group.program_id === form.data.program_id
        && String(group.academic_year_id) === form.data.academic_year_id
        && group.level_code === form.data.level
        && (group.enrollments_count < group.capacity || group.id === form.data.class_id)
    );

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.put(route('admin.students.update', student.id));
    };

    return <AuthenticatedLayout header={<div><h1 className="text-xl font-semibold text-slate-900">Modifier le dossier étudiant</h1><p className="mt-1 text-sm text-slate-500">{student.first_name} {student.last_name}</p></div>}>
        <Head title={`Modifier ${student.first_name} ${student.last_name}`} />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl space-y-6">
            <BackButton href={route('admin.students.show', student.id)} label="Retour au dossier" />
            {!enrollment && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Aucune inscription académique n’est associée à cet étudiant.</div>}
            <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <section className="space-y-4"><h2 className="font-semibold text-slate-800">Informations personnelles</h2><div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Prénom<input required maxLength={100} value={form.data.first_name} onChange={(event) => form.setData('first_name', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.first_name && <span className="text-xs text-red-600">{form.errors.first_name}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Nom<input required maxLength={100} value={form.data.last_name} onChange={(event) => form.setData('last_name', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.last_name && <span className="text-xs text-red-600">{form.errors.last_name}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">E-mail<input required type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.email && <span className="text-xs text-red-600">{form.errors.email}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Téléphone<input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.phone && <span className="text-xs text-red-600">{form.errors.phone}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Date de naissance<input required type="date" value={form.data.birth_date} onChange={(event) => form.setData('birth_date', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.birth_date && <span className="text-xs text-red-600">{form.errors.birth_date}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Genre<select value={form.data.gender} onChange={(event) => form.setData('gender', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="M">Masculin</option><option value="F">Féminin</option></select>{form.errors.gender && <span className="text-xs text-red-600">{form.errors.gender}</span>}</label>
                </div></section>
                <section className="space-y-4 border-t border-slate-100 pt-5"><h2 className="font-semibold text-slate-800">Inscription académique courante</h2><div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Département<select required value={form.data.department_id} onChange={(event) => form.setData({ ...form.data, department_id: event.target.value, program_id: '', class_id: '' })} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir un département</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.faculty?.name ? `${department.faculty.name} — ` : ''}{department.name} ({department.code})</option>)}</select>{form.errors.department_id && <span className="text-xs text-red-600">{form.errors.department_id}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Filière<select required value={form.data.program_id} onChange={(event) => form.setData({ ...form.data, program_id: event.target.value, class_id: '' })} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une filière</option>{availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.code} — {program.name}</option>)}</select>{form.errors.program_id && <span className="text-xs text-red-600">{form.errors.program_id}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Année académique<select required value={form.data.academic_year_id} onChange={(event) => form.setData({ ...form.data, academic_year_id: event.target.value, class_id: '' })} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une année</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select>{form.errors.academic_year_id && <span className="text-xs text-red-600">{form.errors.academic_year_id}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Niveau<select required value={form.data.level} onChange={(event) => form.setData({ ...form.data, level: event.target.value, class_id: '' })} className="mt-1 w-full rounded-lg border-slate-300">{['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'M1', 'M2', 'D1', 'D2', 'D3'].map((level) => <option key={level} value={level}>{level}</option>)}</select>{form.errors.level && <span className="text-xs text-red-600">{form.errors.level}</span>}</label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">Groupe pédagogique (facultatif)<select value={form.data.class_id} onChange={(event) => form.setData('class_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Affecter plus tard</option>{availableGroups.map((group) => <option key={group.id} value={group.id}>{group.code} — {group.name} ({group.enrollments_count}/{group.capacity})</option>)}</select>{form.errors.class_id && <span className="text-xs text-red-600">{form.errors.class_id}</span>}</label>
                </div></section>
                <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Link href={route('admin.students.show', student.id)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Annuler</Link><button disabled={form.processing || !enrollment} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{form.processing ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></footer>
            </form>
        </div></main>
    </AuthenticatedLayout>;
}
