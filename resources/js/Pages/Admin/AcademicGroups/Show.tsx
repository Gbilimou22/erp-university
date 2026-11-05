import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, MapPin, UsersRound, UserPlus } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

type Group = {
    id: string;
    code: string;
    name: string;
    level_code: string;
    capacity: number;
    program: { id: string; code: string; name: string };
    academic_year: { id: number; name: string };
};

type Student = {
    id: string;
    name: string;
    registration_number: string;
    email: string;
};

type MatchingGroup = {
    id: string;
    code: string;
    name: string;
    capacity: number;
    enrollments_count: number;
};

type RoomAssignment = {
    id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    room: { code: string; name: string; campus: { name: string } };
    assignment: { subject: { code: string; name: string }; teacher: { name: string } };
};

type PageProps = {
    flash?: { success?: string };
    errors?: Record<string, string>;
};

export default function AcademicGroupsShow({
    group,
    students,
    matchingGroups,
    availableStudents,
    roomAssignments,
}: {
    group: Group;
    students: Student[];
    matchingGroups: MatchingGroup[];
    availableStudents: Student[];
    roomAssignments: RoomAssignment[];
}) {
    const { flash, errors } = usePage().props as PageProps;
    const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>({});
    const [selectedStudent, setSelectedStudent] = useState('');

    const occupancy = useMemo(() => students.length, [students]);

    const moveStudent = (studentId: string) => {
        const newGroupId = selectedGroups[studentId];

        if (!newGroupId) {
            return;
        }

        router.post(route('admin.academic-groups.students.move', [group.id, studentId]), {
            new_group_id: newGroupId,
        });
    };

    const assignStudent = () => {
        if (!selectedStudent) return;
        router.post(route('admin.academic-groups.students.assign', [group.id, selectedStudent]), {}, {
            onSuccess: () => setSelectedStudent(''),
        });
    };

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Administration · Pédagogie</p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">{group.code} — {group.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">{group.program.code} · {group.academic_year.name} · Niveau {group.level_code}</p>
                </div>
            }
        >
            <Head title={`Groupe ${group.code}`} />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <BackButton href={route('admin.academic-groups.index')} label="Retour aux groupes" />
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            {occupancy} / {group.capacity} étudiants
                        </span>
                    </div>

                    {flash?.success && (
                        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {Object.values(errors ?? {}).length > 0 && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {Object.values(errors ?? {}).join(' ')}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Filière</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{group.program.name}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Année académique</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{group.academic_year.name}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Capacité</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{group.capacity} places</p>
                        </div>
                    </div>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div><h2 className="font-semibold text-slate-900">Affecter un étudiant sans groupe</h2><p className="mt-1 text-sm text-slate-500">Seuls les étudiants actifs de cette filière, année et niveau sont proposés.</p></div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{Math.max(0, group.capacity - occupancy)} place{group.capacity - occupancy === 1 ? '' : 's'} restante{group.capacity - occupancy === 1 ? '' : 's'}</span>
                        </div>
                        {availableStudents.length === 0 ? <p className="text-sm text-slate-500">Aucun étudiant éligible sans groupe.</p> : <div className="flex flex-col gap-3 sm:flex-row">
                            <select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)} className="min-w-0 flex-1 rounded-lg border-slate-300" aria-label="Étudiant à affecter">
                                <option value="">Sélectionner un étudiant</option>
                                {availableStudents.map((student) => <option key={student.id} value={student.id}>{student.registration_number} — {student.name}</option>)}
                            </select>
                            <button type="button" onClick={assignStudent} disabled={!selectedStudent || occupancy >= group.capacity} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"><UserPlus className="h-4 w-4" />Affecter au groupe</button>
                        </div>}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                            <div><h2 className="flex items-center gap-2 font-semibold text-slate-800"><MapPin className="h-5 w-5 text-indigo-600" />Salles et créneaux du groupe</h2><p className="mt-1 text-sm text-slate-500">Les salles sont affectées aux cours dans l’emploi du temps.</p></div>
                            <div className="flex gap-2"><Link href={route('admin.timetable.index')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Gérer l’emploi du temps</Link><Link href={route('admin.timetable.rooms.index')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Gérer les salles</Link></div>
                        </div>
                        {roomAssignments.length === 0 ? <p className="p-5 text-sm text-slate-500">Aucun cours de ce groupe n’a encore de salle affectée.</p> : <div className="divide-y divide-slate-100">{roomAssignments.map((entry) => <div key={entry.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-indigo-600" /><div><p className="font-medium text-slate-800">{entry.assignment.subject.code} — {entry.assignment.subject.name}</p><p className="text-sm text-slate-500">{days[entry.weekday - 1]} · {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)} · {entry.assignment.teacher.name}</p></div></div><p className="text-sm font-medium text-slate-700">{entry.room.code} — {entry.room.name}<span className="block text-xs font-normal text-slate-500">{entry.room.campus.name}</span></p></div>)}</div>}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 p-4">
                            <UsersRound className="h-5 w-5 text-emerald-700" />
                            <h2 className="font-semibold text-slate-800">Étudiants du groupe</h2>
                        </div>

                        {students.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-500">Aucun étudiant inscrit dans ce groupe.</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {students.map((student) => (
                                    <div key={student.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">{student.name}</p>
                                            <p className="text-sm text-slate-500">{student.registration_number} · {student.email}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <label className="text-sm text-slate-600">
                                                <span className="sr-only">Déplacer vers</span>
                                                <select
                                                    value={selectedGroups[student.id] ?? ''}
                                                    onChange={(event) => setSelectedGroups((current) => ({ ...current, [student.id]: event.target.value }))}
                                                    className="rounded-lg border-slate-300 text-sm"
                                                >
                                                    <option value="">Choisir un autre groupe</option>
                                                    {matchingGroups.map((matchingGroup) => (
                                                        <option key={matchingGroup.id} value={matchingGroup.id}>
                                                            {matchingGroup.code} ({matchingGroup.enrollments_count} / {matchingGroup.capacity})
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => moveStudent(student.id)}
                                                disabled={!selectedGroups[student.id]}
                                                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                Déplacer
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
