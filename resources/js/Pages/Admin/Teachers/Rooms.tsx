import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Trash2 } from 'lucide-react';

type Room = { id: number; code: string; name: string; capacity: number; type: string; campus: { name: string }; timetable_entries_count: number };
type PageProps = { flash?: { success?: string } };
const labels: Record<string, string> = { classroom: 'Salle de cours', amphitheatre: 'Amphithéâtre', laboratory: 'Laboratoire', other: 'Autre' };

export default function Rooms({ rooms }: { rooms: Room[] }) {
    const { flash } = usePage().props as PageProps;
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Salles enregistrées</h1><p className="mt-1 text-sm text-slate-500">Consultez les salles disponibles sur les différents campus.</p></div>}>
        <Head title="Salles enregistrées"/><main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><BackButton href={route('admin.timetable.index')} label="Retour à la planification"/><Link href={route('admin.timetable.index')} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Créer une salle</Link></div>
            {flash?.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-semibold text-slate-800">Salles ({rooms.length})</h2></div>{rooms.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Aucune salle enregistrée.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Salle</th><th className="p-4">Campus</th><th className="p-4">Type</th><th className="p-4">Capacité</th><th className="p-4">Créneaux</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{rooms.map(room => <tr key={room.id}><td className="p-4 font-medium text-slate-800">{room.code} — {room.name}</td><td className="p-4">{room.campus?.name}</td><td className="p-4">{labels[room.type] ?? room.type}</td><td className="p-4">{room.capacity}</td><td className="p-4">{room.timetable_entries_count}</td><td className="p-4"><button type="button" disabled={room.timetable_entries_count > 0} title={room.timetable_entries_count ? 'Supprimez d’abord les créneaux associés' : 'Supprimer'} onClick={() => { if (confirm(`Supprimer la salle ${room.code} ?`)) router.delete(route('admin.timetable.rooms.destroy', room.id)); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></td></tr>)}</tbody></table></div>}</section>
        </div></main>
    </AuthenticatedLayout>;
}
