import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type Option = { id: number; option_text: string };
type Question = { id: number; question_text: string; type: 'qcm' | 'direct'; points: string; options: Option[] };
type Assessment = { id: number; title: string; instructions: string | null; type: string; anti_cheat_enabled: boolean; duration_minutes: number | null; deadline: string; subject: { code: string; name: string } };

export default function Show({ assessment, attempt, questions, savedAnswers }: { assessment: Assessment; attempt: { status: string; score: string | null; submitted_at: string | null; submission_reason: string } | null; questions: Question[]; savedAnswers: Record<number, { option_id: number | null; answer_text: string | null }> }) {
    const { flash } = usePage().props as unknown as { flash: { success?: string } };
    const form = useForm({ answers: questions.map(q => ({ question_id: q.id, option_id: String(savedAnswers[q.id]?.option_id ?? ''), answer_text: savedAnswers[q.id]?.answer_text ?? '' })) });
    const autoSubmitted = useRef(false);
    const violationSubmitted = useRef(false);
    const normalSubmission = useRef(false);
    const answersRef = useRef(form.data.answers);
    const [violationTriggered, setViolationTriggered] = useState(false);
    answersRef.current = form.data.answers;
    const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.floor((new Date(assessment.deadline).getTime() - Date.now()) / 1000)));
    useEffect(() => {
        if (!attempt || attempt.status !== 'in_progress') return;
        const timer = window.setInterval(() => setSecondsLeft(Math.max(0, Math.floor((new Date(assessment.deadline).getTime() - Date.now()) / 1000))), 1000);
        return () => window.clearInterval(timer);
    }, [assessment.deadline, attempt]);
    const submit = (event: React.FormEvent) => { event.preventDefault(); normalSubmission.current = true; form.post(route('student.assessments.submit', assessment.id), { preserveScroll: true, onFinish: () => { normalSubmission.current = false; } }); };
    const updateAnswer = (index: number, field: 'option_id' | 'answer_text', value: string) => form.setData('answers', form.data.answers.map((answer, i) => i === index ? { ...answer, [field]: value } : answer));
    const submitForViolation = (reason: 'focus_lost' | 'tab_hidden' | 'navigation') => {
        if (!assessment.anti_cheat_enabled || !attempt || attempt.status !== 'in_progress' || normalSubmission.current || violationSubmitted.current) return;
        violationSubmitted.current = true;
        setViolationTriggered(true);
        const payload = new FormData();
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (csrf) payload.append('_token', csrf);
        payload.append('reason', reason);
        answersRef.current.forEach((answer, index) => {
            payload.append(`answers[${index}][question_id]`, String(answer.question_id));
            if (answer.option_id) payload.append(`answers[${index}][option_id]`, String(answer.option_id));
            if (answer.answer_text) payload.append(`answers[${index}][answer_text]`, answer.answer_text);
        });

        const url = route('student.assessments.submit', assessment.id);
        const queued = navigator.sendBeacon?.(url, payload) ?? false;
        if (!queued) {
            void fetch(url, { method: 'POST', body: payload, credentials: 'same-origin', keepalive: true, headers: { Accept: 'application/json' } }).catch(() => undefined);
        }
    };
    useEffect(() => {
        if (!attempt || attempt.status !== 'in_progress' || secondsLeft > 0 || autoSubmitted.current) return;
        autoSubmitted.current = true;
        normalSubmission.current = true;
        form.post(route('student.assessments.submit', assessment.id), { preserveScroll: true, onFinish: () => { normalSubmission.current = false; } });
    }, [secondsLeft, attempt?.status, assessment.id]);
    useEffect(() => {
        if (!attempt || attempt.status !== 'in_progress' || secondsLeft <= 0) return;
        const timeout = window.setTimeout(() => form.put(route('student.assessments.answers.save', assessment.id), { preserveScroll: true, preserveState: true }), 800);
        return () => window.clearTimeout(timeout);
    }, [form.data.answers, assessment.id, attempt?.status]);
    useEffect(() => {
        if (!assessment.anti_cheat_enabled || !attempt || attempt.status !== 'in_progress') return;
        const onBlur = () => submitForViolation('focus_lost');
        const onVisibility = () => { if (document.visibilityState === 'hidden') submitForViolation('tab_hidden'); };
        const onPageHide = () => submitForViolation('navigation');
        const onBeforeUnload = () => submitForViolation('navigation');
        const onClick = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Element && target.closest('a[href]')) submitForViolation('navigation');
        };
        const onPopState = () => submitForViolation('navigation');
        const onFocus = () => {
            if (violationSubmitted.current) window.setTimeout(() => router.reload({ only: ['attempt', 'questions', 'savedAnswers'] }), 700);
        };
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('beforeunload', onBeforeUnload);
        document.addEventListener('click', onClick, true);
        window.addEventListener('popstate', onPopState);
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('beforeunload', onBeforeUnload);
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('focus', onFocus);
        };
    }, [attempt?.status, assessment.anti_cheat_enabled, assessment.id]);
    const time = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{assessment.subject.code} · {assessment.subject.name}</p><h1 className="mt-1 text-2xl font-semibold">{assessment.title}</h1></div>}>
        <Head title={assessment.title} />
        <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
            {flash.success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</p>}
            {assessment.instructions && <p className="rounded-xl border bg-white p-4 text-sm leading-6">{assessment.instructions}</p>}
            {!attempt ? <section className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-700">Une seule tentative est autorisée. {assessment.duration_minutes ? `Vous aurez ${assessment.duration_minutes} minutes après le démarrage.` : ''} La copie doit être remise avant la fin de l’évaluation.</p>{assessment.anti_cheat_enabled && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">Restez sur cette page pendant toute l’épreuve. Changer d’onglet ou de fenêtre, suivre un lien ou quitter la page soumet immédiatement votre copie.</p>}<button onClick={() => router.post(route('student.assessments.start', assessment.id))} className="mt-4 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white">Démarrer l’évaluation</button></section> : attempt.status === 'in_progress' ? <>
                <div className="sticky top-2 z-10 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4"><span className="text-sm font-medium text-amber-950">Temps restant</span><strong className="font-mono text-xl text-amber-950">{time}</strong></div>
                <form onSubmit={submit} className="space-y-4">{questions.map((q, qi) => <fieldset key={q.id} className="rounded-xl border border-slate-200 bg-white p-5"><legend className="px-2 text-sm font-semibold">Question {qi + 1} · {q.points} point(s)</legend><p className="mb-4 whitespace-pre-wrap text-sm leading-6">{q.question_text}</p>{q.type === 'qcm' ? <div className="space-y-2">{q.options.map(option => <label key={option.id} className="flex gap-3 rounded-lg border p-3 text-sm"><input type="radio" name={`question-${q.id}`} checked={String(form.data.answers[qi]?.option_id) === String(option.id)} onChange={() => updateAnswer(qi, 'option_id', String(option.id))} />{option.option_text}</label>)}</div> : <textarea rows={5} maxLength={10000} value={form.data.answers[qi]?.answer_text ?? ''} onChange={e => updateAnswer(qi, 'answer_text', e.target.value)} className="w-full rounded-lg border-slate-300 text-sm" placeholder="Votre réponse" />}</fieldset>)}<button disabled={form.processing || secondsLeft <= 0} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{form.processing ? 'Remise en cours…' : 'Remettre ma copie'}</button></form>
            </> : violationTriggered && attempt.status === 'in_progress' ? <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-900">Évaluation soumise automatiquement</h2><p className="mt-2 text-sm text-red-800">La page a perdu le focus ou a été quittée. Votre copie est en cours d’enregistrement ; elle est verrouillée.</p></section> : <section className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Copie remise</h2><p className="mt-2 text-sm text-slate-600">{attempt.submission_reason === 'timeout' ? 'Le temps imparti est écoulé. Votre copie a été remise automatiquement.' : ['focus_lost', 'tab_hidden', 'navigation'].includes(attempt.submission_reason) ? 'Soumission automatique : la page d’évaluation a perdu le focus ou a été quittée.' : ''}</p>{['focus_lost', 'tab_hidden', 'navigation'].includes(attempt.submission_reason) && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">La règle anti-triche a attribué automatiquement la note de 0 / 10.</p>}<p className="mt-2 text-sm text-slate-600">{attempt.status === 'corrected' ? `Note : ${attempt.score ?? '—'} / 10` : attempt.score !== null ? `Note automatique provisoire : ${attempt.score} / 10. Les réponses écrites restent à corriger par l’enseignant.` : 'Correction écrite en attente par l’enseignant.'}</p></section>}
        </main>
    </AuthenticatedLayout>;
}
