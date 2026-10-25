import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, UsersRound } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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

type PageProps = {
    flash?: { success?: string };
    errors?: Record<string, string>;
};

export default function AcademicGroupsShow({
    group,
    students,
    matchingGroups,
}: {
    group: Group;
    students: Student[];
    matchingGroups: MatchingGroup[];
}) {
    const { flash, errors } = usePage().props as PageProps;
    const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>({});

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
                        <Link href={route('admin.academic-groups.index')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" /> Retour aux groupes
                        </Link>
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
