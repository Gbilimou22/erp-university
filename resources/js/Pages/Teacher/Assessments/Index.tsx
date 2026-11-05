import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ClipboardCheck, ClipboardList, FileBarChart2, Plus, UsersRound } from 'lucide-react';

type Counts = { scheduled: number; active: number; completed: number; results: number; students: number };

const sections = [
    { title: 'Créer une évaluation', description: 'Préparez une épreuve, ses questions, son horaire et ses règles.', href: 'teacher.assessments.create', icon: Plus, count: null },
    { title: 'Évaluations à lancer', description: 'Retrouvez les brouillons planifiés et lancez-les pendant leur créneau.', href: 'teacher.assessments.to-launch', icon: ClipboardList, count: 'scheduled' as const },
    { title: 'Évaluations en cours', description: 'Consultez les épreuves actuellement ouvertes aux étudiants.', href: 'teacher.assessments.active', icon: ClipboardList, count: 'active' as const },
    { title: 'Évaluations terminées', description: 'Retrouvez les épreuves dont le créneau est terminé.', href: 'teacher.assessments.completed', icon: ClipboardCheck, count: 'completed' as const },
    { title: 'Fiches de résultats', description: 'Classements, copies corrigées et synthèse par évaluation.', href: 'teacher.assessments.result-sheets', icon: FileBarChart2, count: 'results' as const },
    { title: 'Étudiants et notes', description: 'Liste des étudiants ayant remis une épreuve et leurs notes.', href: 'teacher.assessments.students', icon: UsersRound, count: 'students' as const },
];

export default function Index({ counts }: { counts: Counts }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Espace enseignant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Évaluations</h1><p className="mt-1 text-sm text-slate-500">Choisissez une rubrique pour gérer vos épreuves et consulter les résultats.</p></div>}>
        <Head title="Évaluations" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-sm sm:p-8"><p className="text-sm text-indigo-200">Espace d’évaluation</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Que souhaitez-vous faire ?</h2><p className="mt-2 max-w-2xl text-sm text-indigo-100">La création, le suivi des épreuves et les résultats sont organisés dans des rubriques séparées.</p></section>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sections.map(({ title, description, href, icon: Icon, count }) => <Link key={href} href={route(href)} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><div className="flex items-start justify-between"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon className="h-5 w-5" /></span>{count && <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{counts[count]}</span>}</div><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">Ouvrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</section>
        </div></main>
    </AuthenticatedLayout>;
}
