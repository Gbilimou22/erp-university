import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, CalendarDays, MapPin, Plus, Trash2 } from 'lucide-react';

type Campus = { id: number; name: string; code: string };
type Room = { id: number; campus_id: number; code: string; name: string; capacity: number; type: string; is_active: boolean; campus: Campus; timetable_entries_count: number };
type Assignment = { id: number; subject: { code: string; name: string; course_unit: { code: string; name: string } }; teacher: { name: string }; academic_year_id: number; academic_year: { id: number; name: string; is_current: boolean } };
type Entry = { id: number; weekday: number; start_time: string; end_time: string; room_id: number; assignment: Assignment; room: Room };
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const roomTypes: Record<string, string> = { classroom: 'Salle de cours', amphitheatre: 'Amphithéâtre', laboratory: 'Laboratoire', other: 'Autre' };

export default function Timetable({ campuses, rooms, assignments, entries, currentYearId }: { campuses: Campus[]; rooms: Room[]; assignments: Assignment[]; entries: Entry[]; currentYearId?: number }) {
    const [yearId, setYearId] = React.useState(String(currentYearId ?? ''));
    const roomForm = useForm({ campus_id: '', code: '', name: '', capacity: 30, type: 'classroom' });
    const slotForm = useForm({ subject_teacher_assignment_id: '', room_id: '', weekday: 1, start_time: '08:00', end_time: '10:00' });
    const years = Array.from(new Map(assignments.map((assignment) => [assignment.academic_year_id, assignment.academic_year])).values());
    const yearAssignments = assignments.filter((assignment) => String(assignment.academic_year_id) === yearId);
    const yearEntries = entries.filter((entry) => String(entry.assignment.academic_year_id) === yearId);

    const addRoom = (event: React.FormEvent) => {
        event.preventDefault();
        roomForm.post(route('admin.timetable.rooms.store'), { onSuccess: () => roomForm.reset('code', 'name') });
    };
    const addSlot = (event: React.FormEvent) => {
        event.preventDefault();
        slotForm.post(route('admin.timetable.entries.store'), { onSuccess: () => slotForm.reset('subject_teacher_assignment_id', 'room_id') });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-800">Emploi du temps</h2>}>
            <Head title="Emploi du temps" />
            <main className="min-h-screen space-y-6 bg-slate-50 p-6">
                <header className="flex flex-wrap items-end justify-between gap-3"><div><Link href={route('admin.teachers.index')} className="mb-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Gestion des enseignants</Link><h1 className="text-2xl font-bold text-slate-800">Emploi du temps hebdomadaire</h1><p className="mt-1 text-sm text-slate-500">Planifiez les cours et évitez les doubles réservations d’enseignant ou de salle.</p></div><label className="text-sm font-medium text-slate-700">Année académique<select value={yearId} onChange={(e) => { setYearId(e.target.value); slotForm.setData('subject_teacher_assignment_id', ''); }} className="ml-2 rounded-lg border-slate-300">{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select></label></header>

                <section className="grid gap-5 xl:grid-cols-2">
                    <form onSubmit={addSlot} className="space-y-3 rounded-xl border bg-white p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800"><CalendarDays className="h-5 w-5 text-indigo-600" />Ajouter un cours</h2>
                        <label className="block text-sm font-medium text-slate-700">Matière, enseignant et année
                            <select required value={slotForm.data.subject_teacher_assignment_id} onChange={(e) => slotForm.setData('subject_teacher_assignment_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner une affectation</option>{yearAssignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.subject.code} — {assignment.subject.name} · {assignment.teacher.name}</option>)}</select>
                            {slotForm.errors.subject_teacher_assignment_id && <span className="mt-1 block text-xs text-red-600">{slotForm.errors.subject_teacher_assignment_id}</span>}
                        </label>
                        <label className="block text-sm font-medium text-slate-700">Salle
                            <select required value={slotForm.data.room_id} onChange={(e) => slotForm.setData('room_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner une salle</option>{rooms.filter((room) => room.is_active !== false).map((room) => <option key={room.id} value={room.id}>{room.code} — {room.name} ({room.campus?.name}, {room.capacity} places)</option>)}</select>
                            {slotForm.errors.room_id && <span className="mt-1 block text-xs text-red-600">{slotForm.errors.room_id}</span>}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="text-sm font-medium text-slate-700">Jour<select value={slotForm.data.weekday} onChange={(e) => slotForm.setData('weekday', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300">{days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
                            <label className="text-sm font-medium text-slate-700">Début<input required type="time" value={slotForm.data.start_time} onChange={(e) => slotForm.setData('start_time', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{slotForm.errors.start_time && <span className="text-xs text-red-600">{slotForm.errors.start_time}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">Fin<input required type="time" value={slotForm.data.end_time} onChange={(e) => slotForm.setData('end_time', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{slotForm.errors.end_time && <span className="text-xs text-red-600">{slotForm.errors.end_time}</span>}</label>
                        </div>
                        <button disabled={slotForm.processing || !yearAssignments.length || !rooms.length} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Ajouter au planning</button>
                        {yearAssignments.length === 0 && <p className="text-xs text-amber-700">Aucune affectation enseignant/matière pour cette année.</p>}
                        {rooms.length === 0 && <p className="text-xs text-amber-700">Créez d’abord une salle ci-dessous.</p>}
                    </form>

                    <form onSubmit={addRoom} className="space-y-3 rounded-xl border bg-white p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800"><MapPin className="h-5 w-5 text-blue-600" />Créer une salle</h2>
                        <label className="block text-sm font-medium text-slate-700">Campus<select required value={roomForm.data.campus_id} onChange={(e) => roomForm.setData('campus_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner un campus</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name} ({campus.code})</option>)}</select>{roomForm.errors.campus_id && <span className="text-xs text-red-600">{roomForm.errors.campus_id}</span>}</label>
                        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Code<input required maxLength={30} value={roomForm.data.code} onChange={(e) => roomForm.setData('code', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{roomForm.errors.code && <span className="text-xs text-red-600">{roomForm.errors.code}</span>}</label><label className="text-sm font-medium text-slate-700">Nom<input required maxLength={150} value={roomForm.data.name} onChange={(e) => roomForm.setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{roomForm.errors.name && <span className="text-xs text-red-600">{roomForm.errors.name}</span>}</label></div>
                        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Type<select value={roomForm.data.type} onChange={(e) => roomForm.setData('type', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="classroom">Salle de cours</option><option value="amphitheatre">Amphithéâtre</option><option value="laboratory">Laboratoire</option><option value="other">Autre</option></select></label><label className="text-sm font-medium text-slate-700">Capacité<input required type="number" min={1} max={10000} value={roomForm.data.capacity} onChange={(e) => roomForm.setData('capacity', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300" /></label></div>
                        <button disabled={roomForm.processing || !campuses.length} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Créer la salle</button>
                    </form>
                </section>

                {Object.values(slotForm.errors).length > 0 && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{Object.values(slotForm.errors).join(' ')}</div>}
                <section className="space-y-4"><h2 className="text-lg font-semibold text-slate-800">Planning — {years.find((year) => String(year.id) === yearId)?.name ?? 'Année non sélectionnée'}</h2>{days.map((day, index) => {
                    const dayEntries = yearEntries.filter((entry) => entry.weekday === index + 1);
                    return <div key={day} className="overflow-hidden rounded-xl border bg-white"><h3 className="border-b bg-slate-50 px-4 py-3 font-semibold text-slate-800">{day}</h3>{dayEntries.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucun cours planifié.</p> : <div className="divide-y">{dayEntries.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-semibold text-indigo-700">{entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)} <span className="ml-2 text-slate-800">{entry.assignment.subject.name}</span></p><p className="mt-1 text-sm text-slate-600">{entry.assignment.teacher.name} · {entry.assignment.subject.course_unit?.code}</p><p className="text-xs text-slate-500">{entry.room.code} — {entry.room.name} · {entry.room.campus?.name}</p></div><button type="button" aria-label="Supprimer ce créneau" onClick={() => { if (confirm('Supprimer ce créneau de l’emploi du temps ?')) router.delete(route('admin.timetable.entries.destroy', entry.id)); }} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div>;
                })}</section>

                <section className="overflow-hidden rounded-xl border bg-white"><h2 className="border-b p-4 font-semibold text-slate-800">Salles enregistrées</h2>{rooms.length === 0 ? <p className="p-5 text-sm text-slate-500">Aucune salle enregistrée.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Salle</th><th className="p-3">Campus</th><th className="p-3">Type</th><th className="p-3">Places</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y">{rooms.map((room) => <tr key={room.id}><td className="p-3 font-medium">{room.code} — {room.name}</td><td className="p-3">{room.campus?.name}</td><td className="p-3">{roomTypes[room.type] ?? room.type}</td><td className="p-3">{room.capacity}</td><td className="p-3"><button type="button" disabled={room.timetable_entries_count > 0} title={room.timetable_entries_count > 0 ? 'Supprimez d’abord les créneaux associés' : 'Supprimer'} onClick={() => { if (confirm(`Supprimer la salle ${room.code} ?`)) router.delete(route('admin.timetable.rooms.destroy', room.id)); }} className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}</section>
            </main>
        </AuthenticatedLayout>
    );
}
