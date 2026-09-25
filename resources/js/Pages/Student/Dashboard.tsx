import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, CreditCard, FileText, GraduationCap } from 'lucide-react';

interface StudentProfile {
    first_name: string;
    last_name: string;
    registration_number: string;
    status: string;
    department?: { name: string; faculty?: { name: string } };
    enrollments?: Array<{ level: string; academic_year?: { name: string }; program?: { name: string } }>;
}

export default function StudentDashboard({ student }: { student: StudentProfile | null }) {
    const enrollment = student?.enrollments?.[0];
    const sections = [
        { title: 'Mes résultats', detail: 'Consultez les résultats publiés.', icon: BookOpen },
        { title: 'Mon emploi du temps', detail: 'Retrouvez vos cours et examens.', icon: CalendarDays },
        { title: 'Ma situation financière', detail: 'Consultez vos frais et paiements.', icon: CreditCard },
        { title: 'Mes documents', detail: 'Accédez à vos documents administratifs.', icon: FileText },
    ];

    return (
        <>
            <Head title="Portail étudiant" />
            <main className="mx-auto min-h-screen max-w-7xl space-y-8 bg-slate-50 p-6">
                <header className="rounded-2xl bg-slate-900 p-8 text-white">
                    <div className="flex items-center gap-3 text-blue-300"><GraduationCap className="h-6 w-6" /><span className="text-sm font-semibold uppercase tracking-wide">Portail étudiant</span></div>
                    {student ? <><h1 className="mt-4 text-3xl font-bold">Bonjour, {student.first_name}</h1><p className="mt-2 text-slate-300">Matricule : {student.registration_number}</p></> : <><h1 className="mt-4 text-3xl font-bold">Votre dossier étudiant</h1><p className="mt-2 text-slate-300">Aucun dossier étudiant n’est encore associé à ce compte. Contactez la scolarité.</p></>}
                </header>
                {student && <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Filière</p><p className="mt-1 font-medium text-slate-900">{enrollment?.program?.name ?? '—'}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Département</p><p className="mt-1 font-medium text-slate-900">{student.department?.name ?? '—'}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Niveau</p><p className="mt-1 font-medium text-slate-900">{enrollment?.level ?? '—'}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Année académique</p><p className="mt-1 font-medium text-slate-900">{enrollment?.academic_year?.name ?? '—'}</p></div>
                </section>}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sections.map(({ title, detail, icon: Icon }) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-blue-600" /><h2 className="mt-4 font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p><span className="mt-4 inline-block text-xs text-slate-400">Disponible après activation du module</span></article>)}
                </section>
                <div className="text-sm text-slate-500"><Link href={route('profile.edit')} className="text-blue-700 hover:underline">Gérer mon compte</Link></div>
            </main>
        </>
    );
}
