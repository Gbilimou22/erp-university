import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Banknote, Search } from 'lucide-react';

type Payment = { id: number; reference_number: string; amount: string | number; payment_method: string; paid_at: string };
type Fee = { id: number; title: string; fee_type: string; installment_number: number | null; amount: string | number; due_date: string; paid_amount: number; balance: number; computed_status: 'paid' | 'overdue' | 'partial' | 'due'; enrollment: { student: { registration_number: string; first_name: string; last_name: string; email: string }; academic_year: { name: string } }; payments: Payment[] };
type Paginated<T> = { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }> };
const money = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
const states = { paid: ['Soldé', 'bg-emerald-50 text-emerald-800'], overdue: ['En retard', 'bg-red-50 text-red-800'], partial: ['Partiel', 'bg-amber-50 text-amber-800'], due: ['À payer', 'bg-slate-100 text-slate-700'] } as const;

function PaymentEntry({ fee }: { fee: Fee }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ amount: '', payment_method: 'cash', reference_number: '' });
    const submit = (event: FormEvent) => { event.preventDefault(); post(route('admin.finance.payments.store', fee.id), { onSuccess: () => { reset(); setOpen(false); } }); };
    if (fee.balance <= 0) return <span className="text-sm font-semibold text-emerald-700">Échéance soldée</span>;
    return <div>{!open ? <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Banknote className="h-4 w-4" />Enregistrer un paiement</button> : <form onSubmit={submit} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600">Montant (solde : {money(fee.balance)})<input required type="number" min="0.01" max={fee.balance} step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 text-sm" />{errors.amount && <span className="text-red-600">{errors.amount}</span>}</label>
        <label className="text-xs font-medium text-slate-600">Mode de paiement<select value={data.payment_method} onChange={e => setData('payment_method', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="cash">Espèces</option><option value="bank_transfer">Virement</option><option value="mobile_money">Mobile money</option><option value="card">Carte bancaire</option><option value="other">Autre</option></select></label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Référence (facultative)<input value={data.reference_number} onChange={e => setData('reference_number', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
        <div className="flex gap-2 sm:col-span-2"><button disabled={processing} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{processing ? 'Enregistrement…' : 'Confirmer le règlement'}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Annuler</button></div>
    </form>}</div>;
}

function FeeCard({ fee }: { fee: Fee }) {
    return <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
            <p className="font-semibold text-slate-900">{fee.enrollment.student.first_name} {fee.enrollment.student.last_name}</p>
            <p className="text-xs text-slate-500">{fee.enrollment.student.registration_number} · {fee.enrollment.academic_year.name}</p>
            <p className="mt-3 font-medium text-slate-800">{fee.title}</p>
            {fee.installment_number && <p className="text-xs text-slate-500">Tranche {fee.installment_number} sur 3</p>}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Date limite</dt><dd className="mt-1 font-medium">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${fee.due_date}T00:00:00`))}</dd></div>
            <div><dt className="text-xs text-slate-500">Montant dû</dt><dd className="mt-1 font-medium">{money(Number(fee.amount))}</dd></div>
            <div><dt className="text-xs text-slate-500">Déjà payé</dt><dd className="mt-1 font-medium text-emerald-700">{money(fee.paid_amount)}</dd></div>
            <div><dt className="text-xs text-slate-500">Solde restant</dt><dd className="mt-1 font-bold">{money(fee.balance)} <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${states[fee.computed_status][1]}`}>{states[fee.computed_status][0]}</span></dd></div>
        </dl>
        <div className="border-t border-slate-100 pt-3">
            <PaymentEntry fee={fee} />
            {fee.payments.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-blue-700">{fee.payments.length} règlement(s) enregistré(s)</summary><ul className="mt-2 space-y-1 text-xs text-slate-600">{fee.payments.map(payment => <li key={payment.id}>{money(Number(payment.amount))} · {payment.reference_number}</li>)}</ul></details>}
        </div>
    </article>;
}

export default function FinanceAdminIndex({ fees, filters }: { fees: Paginated<Fee>; filters: { search?: string } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    return <AuthenticatedLayout header={<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold tracking-widest text-blue-700 uppercase">Administration · Service scolarité</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Frais et règlements</h1><p className="mt-1 text-sm text-slate-500">Suivez les frais d’inscription et les trois échéances de scolarité.</p></div><Link href={route('admin.students.index')} className="inline-flex self-start shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:self-auto"><ArrowLeft className="h-4 w-4" />Étudiants</Link></div>}>
        <Head title="Service scolarité" />
        <main className="min-h-screen bg-slate-50 p-4 sm:p-7"><div className="mx-auto max-w-7xl space-y-5">
            <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-800 p-6 text-white"><h2 className="text-xl font-bold">Suivi des échéances</h2><p className="mt-1 max-w-3xl text-sm text-blue-100">Les frais sont créés à l’inscription. Enregistrez ici chaque règlement reçu; les retards sont signalés dès le lendemain de la date limite et les paiements sont plafonnés au solde dû.</p></section>
            <form onSubmit={e => { e.preventDefault(); router.get(route('admin.finance.index'), { search }, { preserveState: true }); }} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un étudiant ou un matricule" className="w-full rounded-lg border-slate-300 pl-9" /></div><button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Rechercher</button></form>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-3 p-3 md:hidden">
                {fees.data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">Aucun frais à afficher.</p> : fees.data.map(fee => <FeeCard key={fee.id} fee={fee} />)}
            </div>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Étudiant</th><th className="p-4">Frais / échéance</th><th className="p-4">Date limite</th><th className="p-4">Montant dû</th><th className="p-4">Payé</th><th className="p-4">Solde / état</th><th className="p-4">Règlement</th></tr></thead><tbody className="divide-y divide-slate-100">{fees.data.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">Aucun frais à afficher.</td></tr> : fees.data.map(fee => <tr key={fee.id} className="align-top hover:bg-slate-50"><td className="p-4"><p className="font-semibold text-slate-900">{fee.enrollment.student.first_name} {fee.enrollment.student.last_name}</p><p className="text-xs text-slate-500">{fee.enrollment.student.registration_number} · {fee.enrollment.academic_year.name}</p></td><td className="p-4"><p className="font-medium text-slate-800">{fee.title}</p>{fee.installment_number && <p className="text-xs text-slate-500">Tranche {fee.installment_number} sur 3</p>}</td><td className="p-4">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${fee.due_date}T00:00:00`))}</td><td className="p-4">{money(Number(fee.amount))}</td><td className="p-4 text-emerald-700">{money(fee.paid_amount)}</td><td className="p-4"><p className="font-bold">{money(fee.balance)}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${states[fee.computed_status][1]}`}>{states[fee.computed_status][0]}</span></td><td className="p-4"><PaymentEntry fee={fee} />{fee.payments.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-blue-700">{fee.payments.length} règlement(s) enregistré(s)</summary><ul className="mt-2 space-y-1 text-xs text-slate-600">{fee.payments.map(p => <li key={p.id}>{money(Number(p.amount))} · {p.reference_number}</li>)}</ul></details>}</td></tr>)}</tbody></table></div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">{fees.links.map((link, index) => <button key={index} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-blue-700 text-white' : 'border border-slate-200 text-slate-600'} disabled:opacity-40`}>{link.label.replace('&laquo;', '«').replace('&raquo;', '»')}</button>)}</div>
        </section>
        </div></main>
    </AuthenticatedLayout>;
}
