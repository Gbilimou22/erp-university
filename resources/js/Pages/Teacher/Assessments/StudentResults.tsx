import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Head, Link } from '@inertiajs/react';

type StudentResult = { id: number; status: string; score: string | null; rank: number | null; submitted_at: string | null; assessment_id: number; assessment_title: string; subject: { code: string; name: string }; student: { registration_number: string; first_name: string; last_name: string } };

export default function StudentResults({ results }: { results: StudentResult[] }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Espace enseignant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Étudiants et notes</h1><p className="mt-1 text-sm text-slate-500">Résultats des étudiants ayant remis vos évaluations.</p></div>}>
        <Head title="Étudiants et notes" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-5">
            <BackButton href={route('teacher.assessments.index')} label="Retour aux rubriques" />
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Résultats par étudiant</h2><p className="mt-1 text-sm text-slate-500">{results.length} copie(s) remise(s), y compris les copies en attente de correction.</p></div>
                {results.length === 0 ? <p className="p-6 text-sm text-slate-600">Aucune copie remise pour le moment.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Étudiant</th><th className="px-5 py-3">Matricule</th><th className="px-5 py-3">Matière / évaluation</th><th className="px-5 py-3">Remise</th><th className="px-5 py-3">Note / 10</th><th className="px-5 py-3">Rang</th><th className="px-5 py-3">État</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{results.map(item => <tr key={item.id}><td className="px-5 py-3 font-medium text-slate-900">{item.student.first_name} {item.student.last_name}</td><td className="px-5 py-3">{item.student.registration_number}</td><td className="px-5 py-3"><span className="font-medium">{item.subject.code}</span><span className="block text-xs text-slate-500">{item.assessment_title}</span></td><td className="px-5 py-3">{item.submitted_at ? new Date(item.submitted_at).toLocaleString('fr-FR') : '—'}</td><td className="px-5 py-3 font-semibold">{item.score === null ? '—' : `${Number(item.score).toFixed(2)} / 10`}</td><td className="px-5 py-3">{item.rank ?? '—'}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'corrected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{item.status === 'corrected' ? 'Corrigée' : 'À corriger'}</span></td><td className="px-5 py-3"><Link href={route('teacher.assessments.results', item.assessment_id)} className="font-semibold text-indigo-700 hover:text-indigo-900">Ouvrir</Link></td></tr>)}</tbody></table></div>}
            </section>
        </div></main>
    </AuthenticatedLayout>;
}
