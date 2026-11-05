import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPin } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

type AcademicYear = { id: number; name: string; is_current: boolean };
type Entry = {
    id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    subject: { code: string; name: string } | null;
    courseUnit: { code: string; name: string } | null;
    group: { code: string; name: string; level_code: string } | null;
    room: { code: string; name: string; campus: string | null } | null;
};

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function TeacherTimetable({
    academicYears,
    selectedYearId,
    entries,
}: {
    academicYears: AcademicYear[];
    selectedYearId: number | null;
    entries: Entry[];
}) {
    const byDay = React.useMemo(() => days.map((name, index) => ({
        name,
        entries: entries.filter((entry) => entry.weekday === index + 1),
    })), [entries]);

    return (
        <AuthenticatedLayout header={
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Espace enseignant</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Mon emploi du temps</h1>
                <p className="mt-1 text-sm text-slate-500">Consultez les cours, groupes et salles qui vous sont affectés.</p>
            </div>
        }>
            <Head title="Mon emploi du temps" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 to-violet-700 p-6 text-white shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm text-indigo-100">Organisation hebdomadaire</p><h2 className="mt-2 text-3xl font-bold">Votre planning de cours</h2><p className="mt-2 text-sm text-indigo-100">Tous vos créneaux, groupes et salles au même endroit.</p></div><div className="flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-4"><CalendarDays className="h-8 w-8" /></div><div><p className="text-3xl font-bold">{entries.length}</p><p className="text-xs text-indigo-100">séance{entries.length === 1 ? '' : 's'} planifiée{entries.length === 1 ? '' : 's'}</p></div></div></div></section>
                    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div><h2 className="font-semibold text-slate-900">Planning hebdomadaire</h2><p className="mt-1 text-sm text-slate-500">Les créneaux sont affichés chaque semaine pour l’année sélectionnée.</p></div>
                        <label className="text-sm font-medium text-slate-700">Année universitaire
                            <select value={selectedYearId ?? ''} onChange={(event) => router.get(route('teacher.timetable'), { academic_year_id: event.target.value }, { preserveState: true, replace: true })} className="mt-1 block rounded-lg border-slate-300">
                                {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}
                            </select>
                        </label>
                    </section>

                    {academicYears.length === 0 ? (
                        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Aucune affectation pédagogique ne vous est attribuée.</section>
                    ) : entries.length === 0 ? (
                        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm text-slate-600">Aucun cours n’est encore planifié pour cette année.</p></section>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {byDay.map((day) => <section key={day.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-800">{day.name}</h2>
                                {day.entries.length === 0 ? <p className="p-4 text-sm text-slate-400">Aucun cours</p> : <div className="divide-y divide-slate-100">{day.entries.map((entry) => <article key={entry.id} className="p-4">
                                    <p className="font-semibold text-indigo-700">{entry.start_time}–{entry.end_time} <span className="ml-2 text-slate-900">{entry.subject?.name ?? 'Matière'}</span></p>
                                    <p className="mt-1 text-sm text-slate-500">{entry.subject?.code}{entry.courseUnit ? ` · ${entry.courseUnit.code} — ${entry.courseUnit.name}` : ''}</p>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span>{entry.group ? `${entry.group.level_code} · ${entry.group.code} — ${entry.group.name}` : 'Cours commun aux groupes concernés'}</span>
                                        {entry.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{entry.room.code} — {entry.room.name}{entry.room.campus ? ` · ${entry.room.campus}` : ''}</span>}
                                    </div>
                                </article>)}</div>}
                            </section>)}
                        </div>
                    )}

                    <div><Link href={route('teacher.grades.index')} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Accéder à la saisie des notes →</Link></div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
