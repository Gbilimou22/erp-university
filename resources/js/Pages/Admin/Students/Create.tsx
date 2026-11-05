import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

interface Department {
    id: number;
    name: string;
    code: string;
    faculty?: { name: string };
    programs: Array<{ id: string | number; name: string; code: string }>;
}

interface AcademicYear {
    id: number;
    name: string;
    is_current: boolean;
}

interface AcademicGroup {
    id: string;
    program_id: string;
    academic_year_id: number;
    level_code: string;
    code: string;
    name: string;
    capacity: number;
    enrollments_count: number;
}

interface Props {
    departments: Department[];
    academicYears: AcademicYear[];
    currentYear: AcademicYear | null;
    groups: AcademicGroup[];
}

export default function CreateStudent({ departments = [], academicYears = [], currentYear, groups = [] }: Props) {
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
        class_id: '',
        fees: { registration: { amount: '', due_date: '' }, tuition: [{ amount: '', due_date: '' }, { amount: '', due_date: '' }, { amount: '', due_date: '' }] },
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('admin.students.store'));
    };

    const availablePrograms = departments.find(
        (department) => String(department.id) === data.department_id
    )?.programs ?? [];
    const availableGroups = groups.filter((group) =>
        group.program_id === data.program_id
        && String(group.academic_year_id) === data.academic_year_id
        && group.level_code === data.level
        && group.enrollments_count < group.capacity
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-slate-800 leading-tight">
                        Inscrire un Étudiant
                    </h2>
                    <BackButton href={route('admin.students.index')} label="Retour à la liste" />
                </div>
            }
        >
            <Head title="Inscrire un étudiant" />

            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* En-tête de la page */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Inscrire un étudiant</h1>
                            <p className="text-sm text-slate-500">
                                Le matricule sera attribué automatiquement lors de la validation.
                            </p>
                        </div>
                    </div>

                    {/* Formulaire principal */}
                    <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Prénom */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Prénom</label>
                                <input
                                    type="text"
                                    required
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.first_name && <span className="text-xs text-red-600 mt-1 block">{errors.first_name}</span>}
                            </div>

                            {/* Nom */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nom</label>
                                <input
                                    type="text"
                                    required
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.last_name && <span className="text-xs text-red-600 mt-1 block">{errors.last_name}</span>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Adresse e-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.email && <span className="text-xs text-red-600 mt-1 block">{errors.email}</span>}
                            </div>

                            {/* Téléphone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.phone && <span className="text-xs text-red-600 mt-1 block">{errors.phone}</span>}
                            </div>

                            {/* Date de naissance */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Date de naissance</label>
                                <input
                                    type="date"
                                    required
                                    value={data.birth_date}
                                    onChange={(e) => setData('birth_date', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.birth_date && <span className="text-xs text-red-600 mt-1 block">{errors.birth_date}</span>}
                            </div>

                            {/* Genre */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Genre</label>
                                <select
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                                {errors.gender && <span className="text-xs text-red-600 mt-1 block">{errors.gender}</span>}
                            </div>

                            {/* Département */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Département</label>
                                <select
                                    required
                                    value={data.department_id}
                                    onChange={(e) => setData({ ...data, department_id: e.target.value, program_id: '', class_id: '' })}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Choisir un département</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.faculty?.name ? `${dept.faculty.name} — ` : ''}{dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.department_id && <span className="text-xs text-red-600 mt-1 block">{errors.department_id}</span>}
                            </div>

                            {/* Filière */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Filière</label>
                                <select
                                    required
                                    disabled={!data.department_id || availablePrograms.length === 0}
                                    value={data.program_id}
                                    onChange={(e) => setData({ ...data, program_id: e.target.value, class_id: '' })}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100"
                                >
                                    <option value="">
                                        {availablePrograms.length ? 'Choisir une filière' : 'Aucune filière disponible'}
                                    </option>
                                    {availablePrograms.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.name} ({program.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.program_id && <span className="text-xs text-red-600 mt-1 block">{errors.program_id}</span>}
                            </div>

                            {/* Année académique */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Année académique</label>
                                <select
                                    required
                                    value={data.academic_year_id}
                                    onChange={(e) => setData({ ...data, academic_year_id: e.target.value, class_id: '' })}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Choisir une année</option>
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.name}{year.is_current ? ' (en cours)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.academic_year_id && <span className="text-xs text-red-600 mt-1 block">{errors.academic_year_id}</span>}
                            </div>

                            {/* Niveau */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Niveau</label>
                                <select
                                    value={data.level}
                                    onChange={(e) => setData({ ...data, level: e.target.value, class_id: '' })}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'M1', 'M2', 'D1', 'D2', 'D3'].map((level) => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                                {errors.level && <span className="text-xs text-red-600 mt-1 block">{errors.level}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Groupe pédagogique (facultatif)</label>
                                <select
                                    value={data.class_id}
                                    onChange={(e) => setData('class_id', e.target.value)}
                                    disabled={!availableGroups.length}
                                    className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100"
                                >
                                    <option value="">{availableGroups.length ? 'Affecter plus tard' : 'Aucun groupe disponible'}</option>
                                    {availableGroups.map((group) => (
                                        <option key={group.id} value={group.id}>{group.code} — {group.name} ({group.enrollments_count}/{group.capacity})</option>
                                    ))}
                                </select>
                                {errors.class_id && <span className="text-xs text-red-600 mt-1 block">{errors.class_id}</span>}
                            </div>
                        </div>

                        {/* Erreur globale éventuelle */}
                        <section className="space-y-4 border-t border-slate-100 pt-5">
                            <div><h2 className="text-lg font-bold text-slate-900">Frais de scolarité à créer</h2><p className="mt-1 text-sm text-slate-500">Renseignez les frais avant de valider l’inscription. La scolarité est répartie en trois tranches avec des échéances successives.</p></div>
                            <div className="grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-2">
                                <label className="text-sm font-medium text-slate-700">Frais d’inscription<input required type="number" min="0.01" step="0.01" value={data.fees.registration.amount} onChange={e => setData('fees', { ...data.fees, registration: { ...data.fees.registration, amount: e.target.value } })} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                                <label className="text-sm font-medium text-slate-700">Échéance des frais d’inscription<input required type="date" min={new Date().toISOString().slice(0, 10)} value={data.fees.registration.due_date} onChange={e => setData('fees', { ...data.fees, registration: { ...data.fees.registration, due_date: e.target.value } })} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-3">{data.fees.tuition.map((installment, index) => <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-800">Scolarité — Tranche {index + 1}</h3><label className="block text-sm font-medium text-slate-700">Montant<input required type="number" min="0.01" step="0.01" value={installment.amount} onChange={e => { const tuition = [...data.fees.tuition]; tuition[index] = { ...tuition[index], amount: e.target.value }; setData('fees', { ...data.fees, tuition }); }} className="mt-1 w-full rounded-lg border-slate-300" /></label><label className="block text-sm font-medium text-slate-700">Date limite<input required type="date" min={index > 0 ? data.fees.tuition[index - 1].due_date || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} value={installment.due_date} onChange={e => { const tuition = [...data.fees.tuition]; tuition[index] = { ...tuition[index], due_date: e.target.value }; setData('fees', { ...data.fees, tuition }); }} className="mt-1 w-full rounded-lg border-slate-300" /></label></div>)}</div>
                        </section>

                        {(errors as Record<string, string>).error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                {(errors as Record<string, string>).error}
                            </p>
                        )}

                        {/* Pied de formulaire */}
                        <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <Link
                                href={route('admin.students.index')}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || departments.length === 0 || academicYears.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Enregistrement…' : "Enregistrer l'étudiant"}
                            </button>
                        </footer>
                    </form>

                    {departments.length === 0 && (
                        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            Attention : Veuillez d’abord créer au moins un département avant d’inscrire un étudiant.
                        </p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
