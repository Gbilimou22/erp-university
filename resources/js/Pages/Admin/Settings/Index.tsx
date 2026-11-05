import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Building2, Save, Wallet } from 'lucide-react';

type AcademicYear = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
};

type FeeSchedule = {
    id: number;
    academic_year_id: number;
    registration_amount: string;
    registration_due_date: string;
    tuition_installment_1_amount: string;
    tuition_installment_1_due_date: string;
    tuition_installment_2_amount: string;
    tuition_installment_2_due_date: string;
    tuition_installment_3_amount: string;
    tuition_installment_3_due_date: string;
};

type Department = {
    id: number;
    code: string;
    name: string;
    faculty: { name: string };
    fee_schedules: FeeSchedule[];
};

type PlatformSettings = {
    platform_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website?: string;
    platform_tagline?: string;
    logo_url?: string | null;
    emblem_url?: string | null;
};

type Props = {
    platformSettings: PlatformSettings;
    departments: Department[];
    academicYears: AcademicYear[];
    flash?: {
        success?: string;
        error?: string;
    };
};

const fieldClass = 'mt-1 w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500';

function ScheduleEditor({
    department,
    academicYear,
    schedule,
}: {
    department: Department;
    academicYear: AcademicYear;
    schedule?: FeeSchedule;
}) {
    const { data, setData, put, processing, errors } = useForm({
        academic_year_id: String(academicYear.id),
        registration_amount: schedule?.registration_amount ?? '',
        registration_due_date: schedule?.registration_due_date ?? '',
        tuition_installment_1_amount: schedule?.tuition_installment_1_amount ?? '',
        tuition_installment_1_due_date: schedule?.tuition_installment_1_due_date ?? '',
        tuition_installment_2_amount: schedule?.tuition_installment_2_amount ?? '',
        tuition_installment_2_due_date: schedule?.tuition_installment_2_due_date ?? '',
        tuition_installment_3_amount: schedule?.tuition_installment_3_amount ?? '',
        tuition_installment_3_due_date: schedule?.tuition_installment_3_due_date ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(route('admin.settings.departments.fee-schedule.update', department.id), { preserveScroll: true });
    };

    const amountInput = (label: string, key: 'registration_amount' | 'tuition_installment_1_amount' | 'tuition_installment_2_amount' | 'tuition_installment_3_amount') => (
        <label className="block text-sm font-medium text-slate-700">
            {label}
            <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={data[key]}
                onChange={event => setData(key, event.target.value)}
                className={fieldClass}
            />
            {errors[key] && <span className="mt-1 block text-xs text-red-600">{errors[key]}</span>}
        </label>
    );

    const dateInput = (label: string, key: 'registration_due_date' | 'tuition_installment_1_due_date' | 'tuition_installment_2_due_date' | 'tuition_installment_3_due_date', min?: string) => (
        <label className="block text-sm font-medium text-slate-700">
            {label}
            <input
                required
                type="date"
                min={min ?? academicYear.start_date}
                max={academicYear.end_date}
                value={data[key]}
                onChange={event => setData(key, event.target.value)}
                className={fieldClass}
            />
            {errors[key] && <span className="mt-1 block text-xs text-red-600">{errors[key]}</span>}
        </label>
    );

    return (
        <form onSubmit={submit} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-900">{department.name} · {academicYear.name}</h3>
                    <p className="break-words text-sm text-slate-500">{department.faculty.name} · {department.code}</p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${schedule ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                    {schedule ? 'Barème enregistré' : 'À configurer'}
                </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="font-semibold text-slate-800">Frais d’inscription</h4>
                    {amountInput('Montant', 'registration_amount')}
                    {dateInput('Date limite', 'registration_due_date')}
                </div>
                {([1, 2, 3] as const).map((number) => {
                    const amountKey = `tuition_installment_${number}_amount` as const;
                    const dateKey = `tuition_installment_${number}_due_date` as const;
                    const previousDate = number === 1 ? data.registration_due_date : data[`tuition_installment_${number - 1}_due_date` as keyof typeof data] as string;
                    return (
                        <div key={number} className="min-w-0 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <h4 className="font-semibold text-slate-800">Scolarité — Tranche {number} sur 3</h4>
                            {amountInput('Montant', amountKey)}
                            {dateInput('Date limite', dateKey, previousDate || academicYear.start_date)}
                        </div>
                    );
                })}
            </div>
            <p className="break-words text-xs text-slate-500">Les échéances doivent être successives et comprises entre le {academicYear.start_date} et le {academicYear.end_date}. Les changements ne modifient pas les frais déjà créés pour les étudiants.</p>
            <button disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 sm:w-auto">
                <Save className="h-4 w-4" />
                {processing ? 'Enregistrement…' : 'Enregistrer le barème'}
            </button>
        </form>
    );
}

export default function SettingsIndex({ platformSettings = {}, departments = [], academicYears = [], flash }: Props) {
    const currentYear = academicYears.find(year => year.is_current) ?? academicYears[0];
    const [departmentId, setDepartmentId] = useState(String(departments[0]?.id ?? ''));
    const [academicYearId, setAcademicYearId] = useState(String(currentYear?.id ?? ''));
    const { data, setData, post, processing, errors } = useForm({
        platform_name: platformSettings.platform_name ?? '',
        contact_email: platformSettings.contact_email ?? '',
        contact_phone: platformSettings.contact_phone ?? '',
        address: platformSettings.address ?? '',
        website: platformSettings.website ?? '',
        platform_tagline: platformSettings.platform_tagline ?? '',
        logo: null as File | null,
        emblem: null as File | null,
        remove_logo: false,
        remove_emblem: false,
    });

    useEffect(() => {
        setData({
            platform_name: platformSettings.platform_name ?? '',
            contact_email: platformSettings.contact_email ?? '',
            contact_phone: platformSettings.contact_phone ?? '',
            address: platformSettings.address ?? '',
            website: platformSettings.website ?? '',
            platform_tagline: platformSettings.platform_tagline ?? '',
            logo: null,
            emblem: null,
            remove_logo: false,
            remove_emblem: false,
        });
    }, [platformSettings]);

    const selectedDepartment = departments.find(department => String(department.id) === departmentId);
    const selectedYear = academicYears.find(year => String(year.id) === academicYearId);
    const selectedSchedule = selectedDepartment?.fee_schedules.find(schedule => String(schedule.academic_year_id) === academicYearId);

    const savePlatform = (event: FormEvent) => {
        event.preventDefault();
        post(route('admin.settings.platform.update'), { preserveScroll: true, forceFormData: true });
    };

    return (
        <AuthenticatedLayout header={
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Paramètres de la plateforme</h1>
                <p className="mt-1 text-sm text-slate-500">Gérez les coordonnées de l’université et les barèmes de scolarité par département.</p>
            </div>
        }>
            <Head title="Paramètres" />
            <main className="min-h-screen min-w-0 bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <div className="mx-auto min-w-0 max-w-5xl space-y-5 sm:space-y-6">
                    {flash?.success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</p>}
                    {flash?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</p>}
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-start gap-3 sm:items-center">
                            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Building2 className="h-5 w-5" /></span>
                            <div className="min-w-0"><h2 className="break-words font-bold text-slate-900">Informations de la plateforme</h2><p className="break-words text-sm text-slate-500">Coordonnées utilisées pour identifier l’établissement.</p></div>
                        </div>
                        <form onSubmit={savePlatform} className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nom de l’établissement<input required maxLength={150} value={data.platform_name} onChange={event => setData('platform_name', event.target.value)} className={fieldClass} />{errors.platform_name && <span className="mt-1 block text-xs text-red-600">{errors.platform_name}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">E-mail de contact<input type="email" value={data.contact_email} onChange={event => setData('contact_email', event.target.value)} className={fieldClass} />{errors.contact_email && <span className="mt-1 block text-xs text-red-600">{errors.contact_email}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">Téléphone<input value={data.contact_phone} onChange={event => setData('contact_phone', event.target.value)} className={fieldClass} />{errors.contact_phone && <span className="mt-1 block text-xs text-red-600">{errors.contact_phone}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">Adresse<input value={data.address} onChange={event => setData('address', event.target.value)} className={fieldClass} />{errors.address && <span className="mt-1 block text-xs text-red-600">{errors.address}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">Site web<input type="url" value={data.website} onChange={event => setData('website', event.target.value)} className={fieldClass} placeholder="https://" />{errors.website && <span className="mt-1 block text-xs text-red-600">{errors.website}</span>}</label>
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Slogan / description courte<input maxLength={255} value={data.platform_tagline} onChange={event => setData('platform_tagline', event.target.value)} className={fieldClass} />{errors.platform_tagline && <span className="mt-1 block text-xs text-red-600">{errors.platform_tagline}</span>}</label>
                            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                                <label className="block min-w-0 text-sm font-medium text-slate-700">Logo de l’université
                                    {platformSettings.logo_url && !data.remove_logo && <div className="my-2 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"><img src={platformSettings.logo_url} alt="Logo actuel de l’université" className="h-16 max-w-full rounded border border-slate-200 bg-white object-contain p-2 sm:max-w-48" /><button type="button" onClick={() => setData('remove_logo', true)} className="text-left text-xs font-semibold text-red-700 hover:underline">Supprimer le logo</button></div>}
                                    {data.remove_logo && <div className="my-2 flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3"><span className="break-words text-xs text-amber-700">Le logo sera supprimé à l’enregistrement.</span><button type="button" onClick={() => setData('remove_logo', false)} className="text-xs font-semibold text-indigo-700 hover:underline">Annuler</button></div>}
                                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { setData('logo', event.target.files?.[0] ?? null); setData('remove_logo', false); }} className={`${fieldClass} block min-w-0 max-w-full text-xs sm:text-sm file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 sm:file:mr-3 sm:file:px-3`} />
                                    <span className="mt-1 block text-xs text-slate-500">PNG, JPG ou WebP · 4 Mo maximum</span>
                                    {data.logo && <span className="mt-1 block break-all text-xs text-slate-600">Nouveau fichier : {data.logo.name}</span>}
                                    {errors.logo && <span className="mt-1 block text-xs text-red-600">{errors.logo}</span>}
                                </label>
                                <label className="block min-w-0 text-sm font-medium text-slate-700">Emblème
                                    {platformSettings.emblem_url && !data.remove_emblem && <div className="my-2 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"><img src={platformSettings.emblem_url} alt="Emblème actuel de l’université" className="h-16 w-16 shrink-0 rounded border border-slate-200 bg-white object-contain p-2" /><button type="button" onClick={() => setData('remove_emblem', true)} className="text-left text-xs font-semibold text-red-700 hover:underline">Supprimer l’emblème</button></div>}
                                    {data.remove_emblem && <div className="my-2 flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3"><span className="break-words text-xs text-amber-700">L’emblème sera supprimé à l’enregistrement.</span><button type="button" onClick={() => setData('remove_emblem', false)} className="text-xs font-semibold text-indigo-700 hover:underline">Annuler</button></div>}
                                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { setData('emblem', event.target.files?.[0] ?? null); setData('remove_emblem', false); }} className={`${fieldClass} block min-w-0 max-w-full text-xs sm:text-sm file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 sm:file:mr-3 sm:file:px-3`} />
                                    <span className="mt-1 block text-xs text-slate-500">PNG, JPG ou WebP · 4 Mo maximum</span>
                                    {data.emblem && <span className="mt-1 block break-all text-xs text-slate-600">Nouveau fichier : {data.emblem.name}</span>}
                                    {errors.emblem && <span className="mt-1 block text-xs text-red-600">{errors.emblem}</span>}
                                </label>
                            </div>
                            <div className="sm:col-span-2"><button disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50 sm:w-auto"><Save className="h-4 w-4" />Enregistrer les informations</button></div>
                        </form>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Wallet className="h-5 w-5" /></span>
                            <div><h2 className="font-bold text-slate-900">Barèmes de scolarité par département</h2><p className="text-sm text-slate-500">Définissez une seule fois les frais et les échéances de l’année universitaire.</p></div>
                        </div>
                        {departments.length === 0 || academicYears.length === 0 ? (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{departments.length === 0 ? 'Créez d’abord un département.' : 'Créez d’abord une année universitaire.'} Vous pourrez ensuite configurer ses frais ici.</p>
                        ) : (
                            <>
                                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                                    <label className="text-sm font-medium text-slate-700">Département<select value={departmentId} onChange={event => setDepartmentId(event.target.value)} className={fieldClass}>{departments.map(department => <option key={department.id} value={department.id}>{department.name} — {department.faculty.name}</option>)}</select></label>
                                    <label className="text-sm font-medium text-slate-700">Année universitaire<select value={academicYearId} onChange={event => setAcademicYearId(event.target.value)} className={fieldClass}>{academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
                                </div>
                                {selectedDepartment && selectedYear && <ScheduleEditor key={`${selectedDepartment.id}-${selectedYear.id}-${selectedSchedule?.id ?? 'new'}`} department={selectedDepartment} academicYear={selectedYear} schedule={selectedSchedule} />}
                            </>
                        )}
                        <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">À l’inscription, les frais d’inscription et les trois tranches seront créés automatiquement à partir de ce barème. Les règlements réels restent à enregistrer par le service scolarité après réception du paiement.</p>
                    </section>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
