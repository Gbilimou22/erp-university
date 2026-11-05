import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface AcademicYear {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface Props {
    academicYears: AcademicYear[];
}

export default function Index({ academicYears = [] }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        start_date: '',
        end_date: '',
        is_current: false,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('admin.academic-years.store'), { onSuccess: () => reset() });
    };

    const handleSetCurrent = (id: string) => router.patch(route('admin.academic-years.set-current', id));
    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette année universitaire ?')) {
            router.delete(route('admin.academic-years.destroy', id));
        }
    };

    const currentCount = academicYears.filter(year => year.is_current).length;

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Administration · Configuration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Années universitaires</h1><p className="mt-1 text-sm text-slate-500">Définissez les périodes académiques et choisissez l’année active.</p></div>}>
        <Head title="Années universitaires" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <section className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><CalendarDays className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Créer une année</h2><p className="mt-1 text-sm text-slate-500">Renseignez son libellé, son code et ses dates.</p></div></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Libellé<input type="text" value={data.name} onChange={event => setData('name', event.target.value)} className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="2026-2027" required />{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}</label>
                        <label className="block text-sm font-medium text-slate-700">Code<input type="text" value={data.code} onChange={event => setData('code', event.target.value)} className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="AY-2026-2027" required />{errors.code && <span className="mt-1 block text-xs text-red-600">{errors.code}</span>}</label>
                        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Date de début<input type="date" value={data.start_date} onChange={event => setData('start_date', event.target.value)} className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500" required />{errors.start_date && <span className="mt-1 block text-xs text-red-600">{errors.start_date}</span>}</label><label className="block text-sm font-medium text-slate-700">Date de fin<input type="date" value={data.end_date} onChange={event => setData('end_date', event.target.value)} className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500" required />{errors.end_date && <span className="mt-1 block text-xs text-red-600">{errors.end_date}</span>}</label></div>
                        <label className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={data.is_current} onChange={event => setData('is_current', event.target.checked)} className="rounded border-slate-300 text-blue-700 focus:ring-blue-500" />Définir comme année courante</label>
                        <button type="submit" disabled={processing} className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50">{processing ? 'Enregistrement…' : 'Ajouter l’année universitaire'}</button>
                    </form>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Années enregistrées</h2><p className="mt-1 text-sm text-slate-500">{academicYears.length} période{academicYears.length === 1 ? '' : 's'} universitaire{academicYears.length === 1 ? '' : 's'}</p></div><span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">{currentCount} active{currentCount === 1 ? '' : 's'}</span></div>
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Libellé</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {academicYears.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">Aucune année universitaire enregistrée.</td></tr> : academicYears.map(year => <tr key={year.id} className="transition hover:bg-slate-50/80"><td className="px-4 py-3 font-semibold text-slate-900">{year.name}</td><td className="px-4 py-3 font-mono text-xs">{year.code}</td><td className="whitespace-nowrap px-4 py-3">{year.start_date} à {year.end_date}</td><td className="px-4 py-3">{year.is_current ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Courante</span> : <button onClick={() => handleSetCurrent(year.id)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">Activer</button>}</td><td className="px-4 py-3 text-right"><button onClick={() => handleDelete(year.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Supprimer</button></td></tr>)}
                    </tbody></table></div>
                </section>
            </section>
        </div></main>
    </AuthenticatedLayout>;
}
