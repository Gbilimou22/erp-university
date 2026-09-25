import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Department {
    id: number;
    name: string;
    code: string;
    faculty: { name: string };
    programs: Array<{ id: string; name: string; code: string }>;
}

interface AcademicYear {
    id: number;
    name: string;
    is_current: boolean;
}

interface Props {
    departments: Department[];
    academicYears: AcademicYear[];
    currentYear: AcademicYear | null;
}

export default function CreateStudent({ departments, academicYears, currentYear }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: 'M',
        department_id: '',
        program_id: '',
        academic_year_id: String(currentYear?.id ?? academicYears[0]?.id ?? ''),
        level: 'L1',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('admin.students.store'));
    };

    const availablePrograms = departments.find((department) => String(department.id) === data.department_id)?.programs ?? [];

    return (
        <>
            <Head title="Inscrire un étudiant" />
            <main className="mx-auto min-h-screen max-w-4xl space-y-6 bg-slate-50 p-6">
                <header className="flex items-center gap-4">
                    <Link href={route('admin.students.index')} className="rounded-lg border bg-white p-2 text-slate-600" aria-label="Retour à la liste">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Inscrire un étudiant</h1>
                        <p className="text-sm text-slate-500">Le matricule sera attribué automatiquement.</p>
                    </div>
                </header>

                <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">Prénom
                            <input required value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            {errors.first_name && <span className="text-xs text-red-600">{errors.first_name}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Nom
                            <input required value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            {errors.last_name && <span className="text-xs text-red-600">{errors.last_name}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Adresse e-mail
                            <input required type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Téléphone
                            <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            {errors.phone && <span className="text-xs text-red-600">{errors.phone}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Date de naissance
                            <input required type="date" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            {errors.birth_date && <span className="text-xs text-red-600">{errors.birth_date}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Genre
                            <select value={data.gender} onChange={(e) => setData('gender', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                <option value="M">Masculin</option><option value="F">Féminin</option>
                            </select>
                            {errors.gender && <span className="text-xs text-red-600">{errors.gender}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Département
                            <select required value={data.department_id} onChange={(e) => setData({ ...data, department_id: e.target.value, program_id: '' })} className="mt-1 w-full rounded-lg border-slate-300">
                                <option value="">Choisir un département</option>
                                {departments.map((department) => <option key={department.id} value={department.id}>{department.faculty?.name} — {department.name} ({department.code})</option>)}
                            </select>
                            {errors.department_id && <span className="text-xs text-red-600">{errors.department_id}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Filière
                            <select required disabled={!data.department_id || availablePrograms.length === 0} value={data.program_id} onChange={(e) => setData('program_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                <option value="">{availablePrograms.length ? 'Choisir une filière' : 'Aucune filière dans ce département'}</option>
                                {availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.name} ({program.code})</option>)}
                            </select>
                            {errors.program_id && <span className="text-xs text-red-600">{errors.program_id}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Année académique
                            <select required value={data.academic_year_id} onChange={(e) => setData('academic_year_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                <option value="">Choisir une année</option>
                                {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}
                            </select>
                            {errors.academic_year_id && <span className="text-xs text-red-600">{errors.academic_year_id}</span>}
                        </label>
                        <label className="text-sm font-medium text-slate-700">Niveau
                            <select value={data.level} onChange={(e) => setData('level', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'M1', 'M2', 'D1', 'D2', 'D3'].map((level) => <option key={level} value={level}>{level}</option>)}
                            </select>
                            {errors.level && <span className="text-xs text-red-600">{errors.level}</span>}
                        </label>
                    </div>
                    {(errors as Record<string, string>).error && <p className="text-sm text-red-600">{(errors as Record<string, string>).error}</p>}
                    <footer className="flex justify-end gap-3 border-t pt-4">
                        <Link href={route('admin.students.index')} className="rounded-lg border px-4 py-2 text-sm text-slate-600">Annuler</Link>
                        <button disabled={processing || departments.length === 0 || academicYears.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
                            <Save className="h-4 w-4" />{processing ? 'Enregistrement…' : "Enregistrer l'étudiant"}
                        </button>
                    </footer>
                </form>
                {departments.length === 0 && <p className="text-sm text-amber-700">Créez d’abord un département avant d’inscrire un étudiant.</p>}
            </main>
        </>
    );
}
