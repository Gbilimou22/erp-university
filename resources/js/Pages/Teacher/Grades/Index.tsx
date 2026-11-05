import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ClipboardCheck } from 'lucide-react';

type Subject = { id: number; code: string; name: string; course_unit?: { code: string; name: string } };
type Student = { id: number; level: string; student: { registration_number: string; first_name: string; last_name: string } };
type Grade = {
    id: number;
    score: string;
    type: 'cc' | 'exam' | 'rattrapage';
    assessment_label: string | null;
    status: 'draft' | 'published';
    enrollment: { student: { registration_number: string; first_name: string; last_name: string } };
    entered_by: { name: string } | null;
};

const typeLabels = { cc: 'Contrôle continu', exam: 'Examen', rattrapage: 'Rattrapage' };

export default function GradeEntry({
    academicYear,
    subjects,
    selectedSubjectId,
    students,
    grades,
}: {
    academicYear: { id: number; name: string } | null;
    subjects: Subject[];
    selectedSubjectId: number | null;
    students: Student[];
    grades: Grade[];
}) {
    const { flash } = usePage().props as unknown as { flash: { success?: string } };
    const form = useForm({
        subject_id: String(selectedSubjectId ?? ''),
        enrollment_id: '',
        type: 'cc',
        assessment_label: '',
        score: '',
    });

    React.useEffect(() => {
        form.setData('subject_id', String(selectedSubjectId ?? ''));
    }, [selectedSubjectId]);

    const selectSubject = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const subjectId = event.target.value;
        router.get(route('teacher.grades.index'), subjectId ? { subject_id: subjectId } : {}, { preserveState: true, replace: true });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('teacher.grades.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('enrollment_id', 'assessment_label', 'score'),
        });
    };

    return (
        <AuthenticatedLayout header={
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Espace enseignant</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Saisie des notes</h1>
                <p className="mt-1 text-sm text-slate-500">Saisissez les évaluations des étudiants inscrits pour l’année en cours.</p>
            </div>
        }>
            <Head title="Saisie des notes" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm text-indigo-200">Suivi des résultats</p><h2 className="mt-2 text-3xl font-bold">Saisie des notes</h2><p className="mt-2 text-sm text-indigo-100">Enregistrez et consultez les résultats des étudiants de vos matières.</p></div><div className="rounded-2xl bg-white/10 p-4"><ClipboardCheck className="h-8 w-8" /></div></div></section>
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <h2 className="font-semibold text-slate-900">Année universitaire</h2>
                                <p className="mt-1 text-sm text-slate-600">{academicYear?.name ?? 'Aucune année courante définie.'}</p>
                            </div>
                            <label className="text-sm font-medium text-slate-700">Matière
                                <select value={selectedSubjectId ?? ''} onChange={selectSubject} className="mt-1 w-full rounded-lg border-slate-300">
                                    <option value="">Choisir une matière</option>
                                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}
                                </select>
                            </label>
                        </div>
                    </section>

                    {flash.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{flash.success}</div>}

                    {!academicYear ? (
                        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Définissez une année universitaire courante avant de saisir des notes.</section>
                    ) : subjects.length === 0 ? (
                        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Aucune matière ne vous est affectée pour cette année.</section>
                    ) : selectedSubjectId && <>
                        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-5">
                            <label className="text-sm font-medium text-slate-700">Étudiant
                                <select required value={form.data.enrollment_id} onChange={(e) => form.setData('enrollment_id', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                    <option value="">Choisir</option>
                                    {students.map(({ id, student }) => <option key={id} value={id}>{student.registration_number} — {student.first_name} {student.last_name}</option>)}
                                </select>
                                {form.errors.enrollment_id && <span className="mt-1 block text-xs text-red-600">{form.errors.enrollment_id}</span>}
                            </label>
                            <label className="text-sm font-medium text-slate-700">Type
                                <select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                    {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                                {form.errors.type && <span className="mt-1 block text-xs text-red-600">{form.errors.type}</span>}
                            </label>
                            <label className="text-sm font-medium text-slate-700">Évaluation
                                <input required maxLength={100} value={form.data.assessment_label} onChange={(e) => form.setData('assessment_label', e.target.value)} placeholder="Ex. CC 1, Examen final" className="mt-1 w-full rounded-lg border-slate-300" />
                                {form.errors.assessment_label && <span className="mt-1 block text-xs text-red-600">{form.errors.assessment_label}</span>}
                            </label>
                            <label className="text-sm font-medium text-slate-700">Note / 10
                                <input required type="number" min="0" max="10" step="0.01" value={form.data.score} onChange={(e) => form.setData('score', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                                {form.errors.score && <span className="mt-1 block text-xs text-red-600">{form.errors.score}</span>}
                            </label>
                            <div className="flex items-end"><button disabled={form.processing || students.length === 0} className="w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{form.processing ? 'Enregistrement…' : 'Enregistrer la note'}</button></div>
                        </form>

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Notes déjà saisies</h2><p className="mt-1 text-sm text-slate-500">{grades.length} résultat{grades.length > 1 ? 's' : ''} pour cette matière</p></div>
                            {grades.length === 0 ? <p className="p-5 text-sm text-slate-500">Aucune note saisie pour le moment.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Étudiant</th><th className="px-5 py-3">Évaluation</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Note</th><th className="px-5 py-3">État</th></tr></thead><tbody className="divide-y divide-slate-100">{grades.map((grade) => <tr key={grade.id}><td className="px-5 py-3 font-medium text-slate-900">{grade.enrollment.student.registration_number} — {grade.enrollment.student.first_name} {grade.enrollment.student.last_name}</td><td className="px-5 py-3 text-slate-600">{grade.assessment_label ?? 'Évaluation historique'}</td><td className="px-5 py-3 text-slate-600">{typeLabels[grade.type]}</td><td className="px-5 py-3 font-semibold text-slate-900">{Number(grade.score).toFixed(2)} / 10</td><td className="px-5 py-3">{grade.status === 'published' ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">Publiée</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Brouillon</span>}</td></tr>)}</tbody></table></div>}
                        </section>
                    </>}
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
