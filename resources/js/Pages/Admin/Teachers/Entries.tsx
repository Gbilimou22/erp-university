import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { CalendarDays, Trash2 } from 'lucide-react';

type Year = { id: number; name: string; is_current: boolean };
type Entry = { id: number; weekday: number; start_time: string; end_time: string; assignment: { academic_year_id: number; academicYear: Year; teacher: { name: string }; subject: { name: string; courseUnit: { code: string } } }; room: { code: string; name: string; campus: { name: string } } };
type PageProps = { flash?: { success?: string } };
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Entries({ entries, academicYears, currentYearId }: { entries: Entry[]; academicYears: Year[]; currentYearId?: number }) {
    const { flash } = usePage().props as PageProps;
    const [yearId, setYearId] = React.useState(String(currentYearId ?? academicYears[0]?.id ?? ''));
    const visible = entries.filter(entry => String(entry.assignment.academic_year_id) === yearId);
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Emplois du temps créés</h1><p className="mt-1 text-sm text-slate-500">Consultez les cours planifiés par jour et par année académique.</p></div>}>
        <Head title="Emplois du temps créés"/><main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><BackButton href={route('admin.timetable.index')} label="Retour à la planification"/><div className="flex flex-wrap items-center gap-3"><Link href={route('admin.timetable.rooms.index')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Voir les salles</Link><Link href={route('admin.timetable.index')} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Planifier un cours</Link></div></div>
            {flash?.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-600"/><h2 className="text-lg font-semibold text-slate-900">Planning hebdomadaire</h2></div><label className="flex items-center gap-2 text-sm text-slate-600">Année<select value={yearId} onChange={e => setYearId(e.target.value)} className="rounded-lg border-slate-300 bg-white">{academicYears.map(year => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select></label></div>
            {days.map((day, i) => { const list = visible.filter(entry => entry.weekday === i + 1); return <section key={day} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">{day}</h3>{list.length ? <div className="divide-y divide-slate-100">{list.map(entry => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-indigo-700">{entry.start_time.slice(0,5)} – {entry.end_time.slice(0,5)} <span className="ml-2 text-slate-800">{entry.assignment.subject.name}</span></p><p className="mt-1 text-sm text-slate-600">{entry.assignment.teacher.name} · {entry.assignment.subject.courseUnit?.code}</p><p className="text-xs text-slate-500">{entry.room.code} — {entry.room.name} · {entry.room.campus?.name}</p></div><button type="button" aria-label="Supprimer ce créneau" onClick={() => { if (confirm('Supprimer ce créneau de l’emploi du temps ?')) router.delete(route('admin.timetable.entries.destroy', entry.id)); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></div>)}</div> : <p className="p-4 text-sm text-slate-500">Aucun cours planifié.</p>}</section>; })}
        </div></main>
    </AuthenticatedLayout>;
}
