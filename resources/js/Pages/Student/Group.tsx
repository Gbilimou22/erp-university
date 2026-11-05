import { Head } from '@inertiajs/react';
import { BookOpen, CalendarDays, GraduationCap, UsersRound } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

type Enrollment = {
    level: string;
    program: { code: string; name: string; degree_level: string } | null;
    academicYear: { name: string } | null;
    group: { code: string; name: string; level_code: string; capacity: number } | null;
};

export default function StudentGroup({ studentName, enrollment }: { studentName: string | null; enrollment: Enrollment | null }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Portail étudiant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Mon groupe pédagogique</h1></div>}>
        <Head title="Mon groupe" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <BackButton href={route('student.dashboard')} label="Retour au tableau de bord" />
                {!studentName || !enrollment ? <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Aucun dossier ou aucune inscription n’est associé à votre compte. Contactez la scolarité.</section> : !enrollment.group ? <section className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><UsersRound className="h-6 w-6 text-emerald-700" /><h2 className="font-semibold text-slate-900">Vous n’êtes pas encore affecté à un groupe</h2></div><p className="mt-2 text-sm text-slate-600">Votre inscription est enregistrée. La scolarité pourra vous affecter à un groupe lorsque la répartition sera prête.</p></section> : <>
                    <section className="rounded-xl border border-emerald-200 bg-emerald-950 p-6 text-white shadow-sm sm:p-8">
                        <div className="flex items-center gap-3 text-emerald-200"><UsersRound className="h-6 w-6" /><span className="text-sm font-semibold uppercase">{enrollment.group.level_code}</span></div>
                        <h2 className="mt-4 text-3xl font-bold">{enrollment.group.code}</h2>
                        <p className="mt-1 text-lg text-emerald-100">{enrollment.group.name}</p>
                        <p className="mt-4 text-sm text-emerald-100">Étudiant : {studentName}</p>
                    </section>
                    <section className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5"><BookOpen className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-xs font-semibold uppercase text-slate-500">Filière</p><p className="mt-1 font-semibold text-slate-900">{enrollment.program?.name ?? '—'}</p><p className="text-sm text-slate-500">{enrollment.program?.code ?? ''}</p></div></div>
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5"><CalendarDays className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-xs font-semibold uppercase text-slate-500">Année académique</p><p className="mt-1 font-semibold text-slate-900">{enrollment.academicYear?.name ?? '—'}</p></div></div>
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2"><GraduationCap className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-xs font-semibold uppercase text-slate-500">Niveau d’inscription</p><p className="mt-1 font-semibold text-slate-900">{enrollment.level}</p></div></div>
                    </section>
                </>}
            </div>
        </main>
    </AuthenticatedLayout>;
}
