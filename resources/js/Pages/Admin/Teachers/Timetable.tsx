import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { CalendarDays, MapPin, Plus, List, Building2 } from 'lucide-react';

type Campus = { id: number; name: string; code: string };
type Room = { id: number; campus_id: number; code: string; name: string; capacity: number; type: string; is_active: boolean; campus: Campus; timetable_entries_count: number };
type Assignment = { id: number; subject: { code: string; name: string; course_unit: { code: string; name: string } }; teacher: { name: string }; academic_year_id: number; academic_year: { id: number; name: string; is_current: boolean } };
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function Timetable({ campuses, rooms, assignments, currentYearId }: { campuses: Campus[]; rooms: Room[]; assignments: Assignment[]; currentYearId?: number }) {
    const [yearId, setYearId] = React.useState(String(currentYearId ?? ''));
    const roomForm = useForm({ campus_id: '', code: '', name: '', capacity: 30, type: 'classroom' });
    const slotForm = useForm({ subject_teacher_assignment_id: '', room_id: '', weekday: 1, start_time: '08:00', end_time: '10:00' });
    const years = Array.from(new Map(assignments.map((assignment) => [assignment.academic_year_id, assignment.academic_year])).values());
    const yearAssignments = assignments.filter((assignment) => String(assignment.academic_year_id) === yearId);

    const addRoom = (event: React.FormEvent) => {
        event.preventDefault();
        roomForm.post(route('admin.timetable.rooms.store'), { onSuccess: () => roomForm.reset('code', 'name') });
    };
    const addSlot = (event: React.FormEvent) => {
        event.preventDefault();
        slotForm.post(route('admin.timetable.entries.store'), { onSuccess: () => slotForm.reset('subject_teacher_assignment_id', 'room_id') });
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Emploi du temps hebdomadaire</h1><p className="mt-1 text-sm text-slate-500">Planifiez les cours et évitez les doubles réservations d’enseignant ou de salle.</p></div>}>
            <Head title="Emploi du temps" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><BackButton href={route('admin.teachers.index')} label="Retour aux enseignants"/><div className="flex flex-wrap items-center gap-2"><Link href={route('admin.timetable.entries.index')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"><List className="h-4 w-4"/>Voir les emplois du temps</Link><Link href={route('admin.timetable.rooms.index')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"><Building2 className="h-4 w-4"/>Voir les salles</Link><label className="flex items-center gap-2 text-sm font-medium text-slate-700">Année académique<select value={yearId} onChange={(e) => { setYearId(e.target.value); slotForm.setData('subject_teacher_assignment_id', ''); }} className="rounded-lg border-slate-300 bg-white">{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? ' (en cours)' : ''}</option>)}</select></label></div></div>

                <section className="grid gap-5 xl:grid-cols-2">
                    <form onSubmit={addSlot} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800"><CalendarDays className="h-5 w-5 text-indigo-600" />Ajouter un cours</h2>
                        <label className="block text-sm font-medium text-slate-700">Matière, enseignant et année
                            <select required value={slotForm.data.subject_teacher_assignment_id} onChange={(e) => slotForm.setData('subject_teacher_assignment_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner une affectation</option>{yearAssignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.subject.code} — {assignment.subject.name} · {assignment.teacher.name}</option>)}</select>
                            {slotForm.errors.subject_teacher_assignment_id && <span className="mt-1 block text-xs text-red-600">{slotForm.errors.subject_teacher_assignment_id}</span>}
                        </label>
                        <label className="block text-sm font-medium text-slate-700">Salle
                            <select required value={slotForm.data.room_id} onChange={(e) => slotForm.setData('room_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner une salle</option>{rooms.filter((room) => room.is_active !== false).map((room) => <option key={room.id} value={room.id}>{room.code} — {room.name} ({room.campus?.name}, {room.capacity} places)</option>)}</select>
                            {slotForm.errors.room_id && <span className="mt-1 block text-xs text-red-600">{slotForm.errors.room_id}</span>}
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="text-sm font-medium text-slate-700">Jour<select value={slotForm.data.weekday} onChange={(e) => slotForm.setData('weekday', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300">{days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
                            <label className="text-sm font-medium text-slate-700">Début<input required type="time" value={slotForm.data.start_time} onChange={(e) => slotForm.setData('start_time', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{slotForm.errors.start_time && <span className="text-xs text-red-600">{slotForm.errors.start_time}</span>}</label>
                            <label className="text-sm font-medium text-slate-700">Fin<input required type="time" value={slotForm.data.end_time} onChange={(e) => slotForm.setData('end_time', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{slotForm.errors.end_time && <span className="text-xs text-red-600">{slotForm.errors.end_time}</span>}</label>
                        </div>
                        <button disabled={slotForm.processing || !yearAssignments.length || !rooms.length} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Ajouter au planning</button>
                        {yearAssignments.length === 0 && <p className="text-xs text-amber-700">Aucune affectation enseignant/matière pour cette année.</p>}
                        {rooms.length === 0 && <p className="text-xs text-amber-700">Créez d’abord une salle depuis le formulaire ci-dessous.</p>}
                    </form>

                    <form onSubmit={addRoom} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800"><MapPin className="h-5 w-5 text-indigo-600" />Créer une salle</h2>
                        <label className="block text-sm font-medium text-slate-700">Campus<select required value={roomForm.data.campus_id} onChange={(e) => roomForm.setData('campus_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Sélectionner un campus</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name} ({campus.code})</option>)}</select>{roomForm.errors.campus_id && <span className="text-xs text-red-600">{roomForm.errors.campus_id}</span>}</label>
                        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Code<input required maxLength={30} value={roomForm.data.code} onChange={(e) => roomForm.setData('code', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{roomForm.errors.code && <span className="text-xs text-red-600">{roomForm.errors.code}</span>}</label><label className="text-sm font-medium text-slate-700">Nom<input required maxLength={150} value={roomForm.data.name} onChange={(e) => roomForm.setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{roomForm.errors.name && <span className="text-xs text-red-600">{roomForm.errors.name}</span>}</label></div>
                        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Type<select value={roomForm.data.type} onChange={(e) => roomForm.setData('type', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="classroom">Salle de cours</option><option value="amphitheatre">Amphithéâtre</option><option value="laboratory">Laboratoire</option><option value="other">Autre</option></select></label><label className="text-sm font-medium text-slate-700">Capacité<input required type="number" min={1} max={10000} value={roomForm.data.capacity} onChange={(e) => roomForm.setData('capacity', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300" /></label></div>
                        <button disabled={roomForm.processing || !campuses.length} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-50"><Plus className="h-4 w-4" />Créer la salle</button>
                    </form>
                </section>

                {(Object.values(slotForm.errors).length > 0 || Object.values(roomForm.errors).length > 0) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{Object.values(slotForm.errors).concat(Object.values(roomForm.errors)).join(' ')}</div>}
              </div>
            </main>
        </AuthenticatedLayout>
    );
}
