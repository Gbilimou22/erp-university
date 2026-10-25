import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BookOpen, CalendarDays, GraduationCap, LogOut, UsersRound } from 'lucide-react';

type Subject = { id: number; code: string; name: string; coefficient: string | number; course_unit?: { code: string; name: string } };

export default function TeacherDashboard({ academicYear, subjects = [] }: { academicYear: { id: number; name: string } | null; subjects: Subject[] }) {
    const quickActions = [
        {
            title: 'Mes matières',
            description: subjects.length > 0 ? `${subjects.length} matière${subjects.length > 1 ? 's' : ''} assignée${subjects.length > 1 ? 's' : ''}` : 'Aucune matière assignée pour le moment',
            href: '#subjects',
            icon: BookOpen,
            active: true,
        },
        {
            title: 'Mon emploi du temps',
            description: 'Voir mon planning de cours et mes créneaux.',
            href: '#',
            icon: CalendarDays,
            active: false,
        },
        {
            title: 'Mes groupes',
            description: 'Consulter les groupes pédagogiques associés.',
            href: '#',
            icon: UsersRound,
            active: false,
        },
    ];

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Espace enseignant</h2>
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </Link>
            </div>
        }>
            <Head title="Espace enseignant" />
            <main className="min-h-screen space-y-6 bg-slate-50 p-6">
                <header className="rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shadow-sm">
                    <p className="text-sm text-blue-100">Portail enseignant</p>
                    <h1 className="mt-1 text-2xl font-bold">Bienvenue dans votre espace</h1>
                    <p className="mt-2 text-sm text-blue-100">Retrouvez vos enseignements, votre planning et les groupes pédagogiques associés.</p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {quickActions.map(({ title, description, href, icon: Icon, active }) => (
                        <div key={title} className={`rounded-2xl border bg-white p-5 shadow-sm ${active ? 'border-indigo-200' : 'border-slate-200 opacity-80'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className={`rounded-xl p-2.5 ${active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className={`text-[11px] font-medium uppercase tracking-[0.14em] ${active ? 'text-indigo-700' : 'text-slate-400'}`}>
                                    {active ? 'Actif' : 'Suivant'}
                                </span>
                            </div>
                            <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
                            <a href={href} className={`mt-4 inline-flex text-sm font-medium ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {active ? 'Voir la liste' : 'Bientôt disponible'}
                            </a>
                        </div>
                    ))}
                </section>

                <section id="subjects" className="rounded-xl border bg-white p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800"><BookOpen className="h-5 w-5 text-indigo-600" />Mes matières</h2><p className="mt-1 text-sm text-slate-500">{academicYear ? `Année universitaire ${academicYear.name}` : 'Aucune année académique active.'}</p></div>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{subjects.length} matière{subjects.length > 1 ? 's' : ''}</span>
                    </div>
                    {!academicYear ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">L’administration n’a pas encore défini l’année académique en cours.</p> : subjects.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 font-medium text-slate-700">Aucune matière ne vous est affectée pour cette année.</p><p className="mt-1 text-sm text-slate-500">Contactez l’administration pour vérifier votre répartition pédagogique.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <article key={subject.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-sm"><p className="font-mono text-xs text-indigo-700">{subject.code}</p><h3 className="mt-1 font-semibold text-slate-800">{subject.name}</h3><p className="mt-2 text-sm text-slate-500">{subject.course_unit?.code} — {subject.course_unit?.name}</p><p className="mt-3 text-xs text-slate-500">Coefficient : {subject.coefficient}</p></article>)}</div>}
                </section>
            </main>
        </AuthenticatedLayout>
    );
}
