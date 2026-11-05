import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type Assessment = {
    subject_id: number;
    academic_year_id: number;
    type: 'cc' | 'exam' | 'rattrapage';
    assessment_label: string | null;
    subject_code: string;
    subject_name: string;
    academic_year_name: string;
    student_count: number;
};

const typeLabels = { cc: 'Contrôle continu', exam: 'Examen', rattrapage: 'Rattrapage' };

export default function Index({ assessments, flash }: {
    assessments: { data: Assessment[]; links: { url: string | null; label: string; active: boolean }[] };
    flash: { success?: string; error?: string };
}) {
    const publish = (assessment: Assessment) => {
        const title = assessment.assessment_label || 'Évaluation historique';
        if (!window.confirm(`Publier « ${title} » en ${assessment.subject_name} pour ${assessment.student_count} étudiant(s) ? Les notes publiées ne peuvent plus être modifiées par l’enseignant.`)) return;

        router.post(route('admin.grades.publish'), {
            subject_id: assessment.subject_id,
            academic_year_id: assessment.academic_year_id,
            type: assessment.type,
            assessment_label: assessment.assessment_label,
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Administration</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Validation et publication des notes</h1></div>}>
            <Head title="Publication des notes" />
            <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Vérifiez les notes auprès de l’enseignant avant publication. La publication rend les notes visibles aux étudiants et bloque leur modification par l’enseignant. Les règles de calcul de moyenne et de validation des crédits restent à définir par l’université.</p>
                {flash.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</p>}
                {flash.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</p>}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {assessments.data.length === 0 ? <p className="p-6 text-sm text-slate-600">Aucune évaluation en attente de publication.</p> : <div className="divide-y divide-slate-100">
                        {assessments.data.map((assessment) => <article key={`${assessment.subject_id}-${assessment.academic_year_id}-${assessment.type}-${assessment.assessment_label ?? 'legacy'}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">{assessment.subject_code} · {assessment.subject_name}</h2>
                                <p className="mt-1 text-sm text-slate-600">{assessment.academic_year_name} · {typeLabels[assessment.type]} · {assessment.assessment_label || 'Évaluation historique'}</p>
                                <p className="mt-1 text-xs text-slate-500">{assessment.student_count} étudiant(s) avec une note</p>
                            </div>
                            <button onClick={() => publish(assessment)} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">Publier cette évaluation</button>
                        </article>)}
                    </div>}
                </section>
                <nav className="flex flex-wrap gap-2" aria-label="Pagination">
                    {assessments.links.map((link, index) => link.url ? <a key={index} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : null)}
                </nav>
            </main>
        </AuthenticatedLayout>
    );
}
