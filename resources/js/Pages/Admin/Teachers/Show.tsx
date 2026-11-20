import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Head } from '@inertiajs/react';
import { BookOpen, CalendarDays, Mail, ShieldCheck } from 'lucide-react';

interface Assignment {
    id: number;
    planned_hours: number;
    subject: { code: string; name: string };
    academic_year: { name: string };
}

interface Teacher {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    must_change_password: boolean;
    created_at: string;
    taught_subject_assignments: Assignment[];
}

export default function TeacherShow({ teacher }: { teacher: Teacher }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Dossier enseignant</h1></div>}>
        <Head title={`Enseignant ${teacher.name}`} />
        <main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-slate-50 p-6">
            <BackButton href={route('admin.teachers.index')} label="Retour aux enseignants" />
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div><p className="font-mono text-xs text-slate-400">COMPTE #{teacher.id}</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{teacher.name}</h2><p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600"><Mail className="h-4 w-4" />{teacher.email}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${teacher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{teacher.is_active ? 'Compte actif' : 'Compte désactivé'}</span>
                </div>
                <div className="grid gap-4 pt-5 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><ShieldCheck className="h-4 w-4" />Sécurité</p><p className="mt-2 text-sm text-slate-800">{teacher.must_change_password ? 'Changement de mot de passe requis' : 'Accès confirmé'}</p></div>
                    <div className="rounded-lg border border-slate-200 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><BookOpen className="h-4 w-4" />Affectations</p><p className="mt-2 text-lg font-bold text-slate-900">{teacher.taught_subject_assignments.length}</p></div>
                    <div className="rounded-lg border border-slate-200 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><CalendarDays className="h-4 w-4" />Créé le</p><p className="mt-2 text-sm text-slate-800">{new Date(teacher.created_at).toLocaleDateString('fr-FR')}</p></div>
                </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-semibold text-slate-900">Matières affectées</h2></div>{teacher.taught_subject_assignments.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Aucune affectation pédagogique.</p> : <div className="divide-y divide-slate-100">{teacher.taught_subject_assignments.map((assignment) => <article key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium text-slate-900">{assignment.subject.code} · {assignment.subject.name}</p><p className="text-xs text-slate-500">{assignment.academic_year.name}</p></div><span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{assignment.planned_hours} h prévues</span></article>)}</div>}</section>
        </main>
    </AuthenticatedLayout>;
}
