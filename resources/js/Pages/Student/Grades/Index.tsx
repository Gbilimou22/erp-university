import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Award } from 'lucide-react';

type Grade = {
    id: number;
    score: string;
    type: 'cc' | 'exam' | 'rattrapage';
    assessment_label: string | null;
    published_at: string | null;
    subject: { code: string; name: string };
    enrollment: { academic_year: { name: string } | null };
};

const typeLabels = { cc: 'Contrôle continu', exam: 'Examen', rattrapage: 'Rattrapage' };

export default function Index({ grades }: { grades: Grade[] }) {
    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Portail étudiant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Mes résultats publiés</h1></div>}>
            <Head title="Mes résultats" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl space-y-6">
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950 to-emerald-800 p-6 text-white shadow-sm"><div><p className="text-sm text-emerald-200">Parcours académique</p><h2 className="mt-2 text-3xl font-bold">Mes résultats</h2><p className="mt-2 text-sm text-emerald-100">Notes publiées pour vos évaluations et matières.</p></div><Award className="h-9 w-9 text-emerald-100" /></section>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {grades.length === 0 ? <p className="p-6 text-sm text-slate-600">Aucune note n’a encore été publiée pour votre dossier.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Année</th><th className="px-5 py-3">Matière</th><th className="px-5 py-3">Évaluation</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Note</th></tr></thead><tbody className="divide-y divide-slate-100">{grades.map((grade) => <tr key={grade.id}><td className="px-5 py-3">{grade.enrollment.academic_year?.name ?? '—'}</td><td className="px-5 py-3">{grade.subject.code} · {grade.subject.name}</td><td className="px-5 py-3">{grade.assessment_label || 'Évaluation historique'}</td><td className="px-5 py-3">{typeLabels[grade.type]}</td><td className="px-5 py-3 font-semibold">{Number(grade.score).toFixed(2)} / 10</td></tr>)}</tbody></table></div>}
                </section>
            </div></main>
        </AuthenticatedLayout>
    );
}
