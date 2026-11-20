import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart3, ClipboardCheck, ClipboardList, Clock3, GraduationCap, PlayCircle, Plus, UsersRound } from 'lucide-react';

type Counts = { scheduled: number; active: number; completed: number; results: number; students: number };

const modules = [
    { title: 'Créer une évaluation', description: 'Préparez le sujet, les questions, le public, le créneau et les règles.', href: 'teacher.assessments.create', icon: Plus, tone: 'bg-indigo-600 text-white', action: 'Créer un brouillon' },
    { title: 'À lancer', description: 'Lancez vos brouillons uniquement lorsque leur créneau est ouvert.', href: 'teacher.assessments.to-launch', icon: PlayCircle, count: 'scheduled' as const, tone: 'bg-amber-50 text-amber-800', action: 'Préparer le lancement' },
    { title: 'En cours', description: 'Surveillez les épreuves ouvertes et le nombre de copies reçues.', href: 'teacher.assessments.active', icon: Clock3, count: 'active' as const, tone: 'bg-blue-50 text-blue-800', action: 'Suivre les épreuves' },
    { title: 'À corriger', description: 'Ouvrez les copies terminées, lisez les réponses et attribuez la note finale.', href: 'teacher.assessments.completed', icon: ClipboardCheck, count: 'completed' as const, tone: 'bg-violet-50 text-violet-800', action: 'Corriger les copies' },
    { title: 'Résultats', description: 'Consultez les fiches de résultats, les moyennes et le classement.', href: 'teacher.assessments.result-sheets', icon: BarChart3, count: 'results' as const, tone: 'bg-emerald-50 text-emerald-800', action: 'Voir les résultats' },
    { title: 'Étudiants et notes', description: 'Retrouvez toutes les copies rendues et leur état de correction.', href: 'teacher.assessments.students', icon: UsersRound, count: 'students' as const, tone: 'bg-slate-100 text-slate-800', action: 'Voir les étudiants' },
];

export default function AssessmentIndex({ counts }: { counts: Counts }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Espace enseignant</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Gestion des évaluations</h1><p className="mt-1 text-sm text-slate-500">Créez, lancez, corrigez et suivez vos évaluations depuis un seul espace.</p></div>}>
        <Head title="Gestion des évaluations" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-6 text-white shadow-lg sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100"><GraduationCap className="h-4 w-4" />Espace d’évaluation</span><h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Un parcours clair, de la préparation aux résultats.</h2><p className="mt-3 text-sm leading-6 text-indigo-100">Les copies sont remises automatiquement à la fin du temps. Si l’anti-triche est activée, toute perte de focus entraîne une remise et une note de 0 / 10.</p></div><Link href={route('teacher.assessments.create')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-50"><Plus className="h-4 w-4" />Nouvelle évaluation</Link></div></section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résumé des évaluations">
                {[['À lancer', counts.scheduled, 'text-amber-700'], ['En cours', counts.active, 'text-blue-700'], ['Terminées', counts.completed, 'text-violet-700'], ['Copies remises', counts.students, 'text-emerald-700']].map(([label, count, color]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{count}</p></article>)}
            </section>

            <section><div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Mes actions</h2><p className="mt-1 text-sm text-slate-500">Ouvrez uniquement l’étape dont vous avez besoin.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(({ title, description, href, icon: Icon, count, tone, action }) => <Link key={href} href={route(href)} className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></span>{count && <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{counts[count]}</span>}</div><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-1 flex-1 text-sm leading-5 text-slate-500">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">{action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div></section>
        </div></main>
    </AuthenticatedLayout>;
}
