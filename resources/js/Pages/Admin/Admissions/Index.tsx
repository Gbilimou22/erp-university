import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage, Link } from '@inertiajs/react';
import { Ban, CheckCircle2, Clock3, FilePlus2, Plus, Search, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Program { id: number; name: string; code: string }
interface AdmissionDocument { id: number; document_type: string; original_name: string; verification_status: string }
interface Admission { id: number; candidate_first_name: string; candidate_last_name: string; email: string; phone?: string; desired_level?: string; status: string; decision?: string; decision_reason?: string; student_id?: number | null; program?: Program; documents: AdmissionDocument[] }
interface Paginator<T> { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }> }

export default function AdmissionsIndex({ admissions, programs, filters }: { admissions: Paginator<Admission>; programs: Program[]; filters: { search?: string; status?: string } }) {
    const { flash } = usePage().props as unknown as { flash?: { success?: string } };
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [decisionModal, setDecisionModal] = useState<{ admission: Admission; decision: string } | null>(null);
    const [decisionReason, setDecisionReason] = useState('');
    const [decisionProcessing, setDecisionProcessing] = useState(false);
    const form = useForm({
        candidate_first_name: '', candidate_last_name: '', email: '', phone: '', birth_date: '', birth_place: '',
        desired_program_id: '', desired_level: '', documents: [] as Array<{ document_type: string; file: File | null; is_required: boolean }>,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('admin.admissions.store'), {
            forceFormData: true,
            onSuccess: () => { form.reset(); setOpen(false); },
        });
    };

    const openDecision = (admission: Admission, decision: string) => {
        setDecisionReason(admission.decision_reason ?? '');
        setDecisionModal({ admission, decision });
    };

    const submitDecision = (event: FormEvent) => {
        event.preventDefault();
        if (!decisionModal) return;

        setDecisionProcessing(true);
        router.post(route('admin.admissions.decide', decisionModal.admission.id), {
            decision: decisionModal.decision,
            decision_reason: decisionReason.trim(),
        }, {
            preserveScroll: true,
            onFinish: () => setDecisionProcessing(false),
            onSuccess: () => setDecisionModal(null),
        });
    };

    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('admin.admissions.index'), { search, status: statusFilter }, { preserveState: true, replace: true });
    };

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Administration · Scolarité</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Admissions</h1></div>}>
        <Head title="Admissions" />
        <main className="min-h-screen bg-slate-50 p-4 sm:p-7">
            <div className="mx-auto max-w-7xl space-y-5">
                {flash?.success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={filter} className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, prénom ou email" className="w-full rounded-lg border-slate-300 pl-9" /></div>
                        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-lg border-slate-300"><option value="">Tous les statuts</option><option value="pending">En attente</option><option value="processing">En étude</option><option value="admitted">Admis</option><option value="rejected">Refusé</option></select>
                        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Filtrer</button>
                    </form>
                    <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Nouvelle candidature</button>
                </div>

                {open && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Enregistrer une candidature</h2>
                    <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">Prénom<input required value={form.data.candidate_first_name} onChange={event => form.setData('candidate_first_name', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Nom<input required value={form.data.candidate_last_name} onChange={event => form.setData('candidate_last_name', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Email<input required type="email" value={form.data.email} onChange={event => form.setData('email', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Téléphone<input value={form.data.phone} onChange={event => form.setData('phone', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Date de naissance<input type="date" value={form.data.birth_date} onChange={event => form.setData('birth_date', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Lieu de naissance<input value={form.data.birth_place} onChange={event => form.setData('birth_place', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <label className="text-sm">Filière souhaitée<select value={form.data.desired_program_id} onChange={event => form.setData('desired_program_id', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300"><option value="">Choisir une filière</option>{programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
                        <label className="text-sm">Niveau<input value={form.data.desired_level} onChange={event => form.setData('desired_level', event.target.value)} placeholder="Ex. L1" className="mt-1 w-full rounded-lg border-slate-300" /></label>
                        <div className="sm:col-span-2"><button type="button" onClick={() => form.setData('documents', [...form.data.documents, { document_type: '', file: null, is_required: true }])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Ajouter une pièce</button>{form.data.documents.map((document, index) => <div key={index} className="mt-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]"><input required placeholder="Type (BAC, CNI…)" value={document.document_type} onChange={event => form.setData('documents', form.data.documents.map((item, itemIndex) => itemIndex === index ? { ...item, document_type: event.target.value } : item))} className="rounded-lg border-slate-300" /><input required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={event => form.setData('documents', form.data.documents.map((item, itemIndex) => itemIndex === index ? { ...item, file: event.target.files?.[0] ?? null } : item))} /><button type="button" onClick={() => form.setData('documents', form.data.documents.filter((_, itemIndex) => itemIndex !== index))} className="text-sm text-red-700">Retirer</button></div>)}</div>
                        <div className="flex gap-2 sm:col-span-2"><button disabled={form.processing || !form.data.candidate_first_name.trim() || !form.data.candidate_last_name.trim() || !form.data.email.trim()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{form.processing ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Annuler</button></div>
                    </form>
                </section>}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{admissions.data.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Aucune candidature enregistrée.</p> : admissions.data.map(admission => <article key={admission.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold text-slate-900">{admission.candidate_first_name} {admission.candidate_last_name}</h2><p className="text-sm text-slate-500">{admission.email} · {admission.phone || 'Téléphone non renseigné'}</p><p className="mt-1 text-sm text-slate-600">{admission.program?.name ?? 'Filière non renseignée'} · {admission.desired_level || 'Niveau non renseigné'}</p><p className="mt-2 text-xs text-slate-500">{admission.documents.length} pièce(s) · statut {admission.status}</p></div><div className="flex flex-wrap gap-2">{admission.status === 'admitted' && !admission.student_id && <Link href={route('admin.students.create', { admission: admission.id })} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">Inscrire cet étudiant</Link>}<button onClick={() => openDecision(admission, 'accepted')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Admettre</button><button onClick={() => openDecision(admission, 'waiting')} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800">Mettre en étude</button><button onClick={() => openDecision(admission, 'additional_documents')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Pièces complémentaires</button><button onClick={() => openDecision(admission, 'rejected')} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Refuser</button></div></div></article>)}</div></section>
            </div>

            {decisionModal && (() => {
                const configs = {
                    accepted: { title: 'Admettre le candidat', description: 'Cette décision permettra de convertir ensuite la candidature en inscription étudiant.', icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-700', buttonClass: 'bg-emerald-700 hover:bg-emerald-800', buttonLabel: 'Confirmer l’admission', required: false },
                    waiting: { title: 'Mettre la candidature en étude', description: 'La candidature restera en cours d’examen par le service de scolarité.', icon: Clock3, iconClass: 'bg-amber-100 text-amber-700', buttonClass: 'bg-amber-700 hover:bg-amber-800', buttonLabel: 'Mettre en étude', required: false },
                    additional_documents: { title: 'Demander des pièces complémentaires', description: 'Indiquez clairement les pièces ou informations encore attendues.', icon: FilePlus2, iconClass: 'bg-blue-100 text-blue-700', buttonClass: 'bg-blue-700 hover:bg-blue-800', buttonLabel: 'Demander les pièces', required: true },
                    rejected: { title: 'Refuser la candidature', description: 'Ajoutez un motif précis. Cette décision sera conservée dans l’historique.', icon: Ban, iconClass: 'bg-red-100 text-red-700', buttonClass: 'bg-red-700 hover:bg-red-800', buttonLabel: 'Confirmer le refus', required: true },
                } as const;
                const config = configs[decisionModal.decision as keyof typeof configs];
                const DecisionIcon = config.icon;

                return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDecisionModal(null); }}>
                    <form onSubmit={submitDecision} role="dialog" aria-modal="true" aria-labelledby="decision-modal-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start gap-4 border-b border-slate-100 p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}><DecisionIcon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h2 id="decision-modal-title" className="text-lg font-semibold text-slate-900">{config.title}</h2><p className="mt-1 text-sm text-slate-500">Candidat : {decisionModal.admission.candidate_first_name} {decisionModal.admission.candidate_last_name}</p></div><button type="button" aria-label="Fermer" onClick={() => setDecisionModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
                        <div className="p-5"><p className="text-sm text-slate-600">{config.description}</p><label className="mt-4 block text-sm font-medium text-slate-700">Motif de la décision {config.required ? <span className="text-red-600">*</span> : <span className="font-normal text-slate-400">(facultatif)</span>}<textarea autoFocus required={config.required} rows={4} value={decisionReason} onChange={event => setDecisionReason(event.target.value)} placeholder="Expliquez la décision…" className="mt-2 w-full resize-none rounded-xl border-slate-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" /></label></div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><button type="button" onClick={() => setDecisionModal(null)} disabled={decisionProcessing} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button><button type="submit" disabled={decisionProcessing || (config.required && !decisionReason.trim())} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClass}`}>{decisionProcessing ? 'Enregistrement…' : config.buttonLabel}</button></div>
                    </form>
                </div>;
            })()}
        </main>
    </AuthenticatedLayout>;
}
