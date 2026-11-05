import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { ClipboardList } from 'lucide-react';

type Assessment = { id: number; title: string; type: string; ends_at: string; duration_minutes: number | null; subject: { code: string; name: string }; attempt: { status: string; score: string | null; submission_reason: string } | null };
const labels: Record<string, string> = { qcm: 'QCM', direct: 'Questions directes', mixed: 'Mixte', other: 'Autre' };

export default function Index({ assessments }: { assessments: Assessment[] }) {
    useEffect(() => {
        const refresh = window.setInterval(() => router.reload({ only: ['assessments'] }), 15000);
        return () => window.clearInterval(refresh);
    }, []);
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Portail étudiant</p><h1 className="mt-1 text-2xl font-semibold">Évaluations en cours</h1></div>}>
        <Head title="Évaluations en cours" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl space-y-6">
            <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950 to-emerald-800 p-6 text-white shadow-sm"><div><p className="text-sm text-emerald-200">Épreuves de vos matières</p><h2 className="mt-2 text-3xl font-bold">Évaluations en ligne</h2><p className="mt-2 text-sm text-emerald-100">Les évaluations ouvertes apparaissent ici automatiquement.</p></div><ClipboardList className="h-8 w-8" /></section>
            {assessments.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Aucune évaluation ouverte ou déjà commencée pour vos matières.</p> : assessments.map(a => <article key={a.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">{a.title}</h2><p className="mt-1 text-sm text-slate-600">{a.subject.code} · {a.subject.name} · {labels[a.type] ?? a.type}</p><p className="mt-1 text-sm text-slate-600">Fin : {new Date(a.ends_at).toLocaleString()}{a.duration_minutes ? ` · Durée : ${a.duration_minutes} min` : ''}</p>{a.attempt && <p className="mt-1 text-xs font-medium text-indigo-700">{a.attempt.submission_reason !== 'student' ? 'Soumission automatique après sortie de la page · ' : ''}{a.attempt.status === 'corrected' ? `Terminée · ${a.attempt.score ?? '—'} / 10` : a.attempt.status === 'submitted' ? 'Remise · correction en attente' : 'Tentative commencée'}</p>}</div><Link href={route('student.assessments.show', a.id)} className="rounded-xl bg-indigo-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-800">{a.attempt ? 'Ouvrir' : 'Commencer'}</Link></article>)}
        </div></main>
    </AuthenticatedLayout>;
}
