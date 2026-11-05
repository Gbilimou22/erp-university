import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Settings, Save } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

interface Department {
    id: number;
    name: string;
    code: string;
    faculty?: { name: string };
    programs: Array<{ id: string | number; name: string; code: string }>;
    fee_schedules: FeeSchedule[];
}

interface FeeSchedule {
    academic_year_id: number;
    registration_amount: string;
    registration_due_date: string;
    tuition_installment_1_amount: string;
    tuition_installment_1_due_date: string;
    tuition_installment_2_amount: string;
    tuition_installment_2_due_date: string;
    tuition_installment_3_amount: string;
    tuition_installment_3_due_date: string;
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
    const feeSchedule = departments.find((department) => String(department.id) === data.department_id)
        ?.fee_schedules.find((schedule) => String(schedule.academic_year_id) === data.academic_year_id);
    const formatAmount = (amount: string) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(amount));
    const formatDate = (date: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`));

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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div><h2 className="text-lg font-bold text-slate-900">Barème de scolarité</h2><p className="mt-1 text-sm text-slate-500">Les frais et les trois échéances sont préremplis depuis les paramètres du département.</p></div>
                                <Link href={route('admin.settings.index')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><Settings className="h-4 w-4" />Paramètres</Link>
                            </div>
                            {feeSchedule ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-xs font-semibold uppercase text-emerald-800">Frais d’inscription</p><p className="mt-2 text-lg font-bold text-slate-900">{formatAmount(feeSchedule.registration_amount)}</p><p className="mt-1 text-xs text-slate-600">À régler avant le {formatDate(feeSchedule.registration_due_date)}</p></div>
                                    {[1, 2, 3].map((number) => {
                                        const schedule = feeSchedule[`tuition_installment_${number}_amount` as keyof FeeSchedule] as string;
                                        const dueDate = feeSchedule[`tuition_installment_${number}_due_date` as keyof FeeSchedule] as string;
                                        return <div key={number} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Scolarité · Tranche {number}/3</p><p className="mt-2 text-lg font-bold text-slate-900">{formatAmount(schedule)}</p><p className="mt-1 text-xs text-slate-500">À régler avant le {formatDate(dueDate)}</p></div>;
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                    {data.department_id && data.academic_year_id ? 'Aucun barème n’est configuré pour ce département et cette année universitaire. Configurez-le avant de valider l’inscription.' : 'Sélectionnez un département et une année universitaire pour afficher le barème applicable.'}
                                    <p className="mt-1 text-xs">Les frais sont créés automatiquement à l’inscription; les paiements réellement reçus restent à enregistrer par le service scolarité.</p>
                                </div>
                            )}
                            {errors.department_id && <p className="text-sm text-red-600">{errors.department_id}</p>}
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
                                disabled={processing || departments.length === 0 || academicYears.length === 0 || !feeSchedule}
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
