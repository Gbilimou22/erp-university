import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';

type Assessment = { id: number; title: string; type: string; status: string; starts_at: string; ends_at: string; subject: { code: string; name: string }; department: { name: string } | null; academic_year: { name: string } | null; attempts_count: number; corrected_attempts_count: number };
type PageLink = { url: string | null; label: string; active: boolean };

const typeLabels: Record<string, string> = { qcm: 'QCM', direct: 'Questions directes', mixed: 'Mixte', other: 'Autre' };

export default function List({ title, description, assessments }: { title: string; description: string; assessments: { data: Assessment[]; links: PageLink[] } }) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Espace enseignant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div>}>
        <Head title={title} />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-5">
            <BackButton href={route('teacher.assessments.index')} label="Retour aux rubriques" />
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-5"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><ClipboardList className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{assessments.data.length} évaluation(s) sur cette page</p></div></div>
                {assessments.data.length === 0 ? <p className="p-6 text-sm text-slate-600">Aucune évaluation dans cette rubrique pour le moment.</p> : <div className="divide-y divide-slate-100">{assessments.data.map(item => { const canLaunch = item.status === 'draft' && Date.now() >= new Date(item.starts_at).getTime() && Date.now() < new Date(item.ends_at).getTime(); return <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><p className="font-semibold text-slate-900">{item.subject.code} · {item.title}</p><p className="mt-1 text-sm text-slate-600">{item.subject.name}{item.department ? ` · ${item.department.name}` : ''} · {typeLabels[item.type] ?? item.type}{item.academic_year ? ` · ${item.academic_year.name}` : ''}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.starts_at).toLocaleString('fr-FR')} – {new Date(item.ends_at).toLocaleString('fr-FR')}</p><p className="mt-2 text-xs text-slate-500">{item.attempts_count} copie(s) reçue(s) · {item.corrected_attempts_count} corrigée(s)</p></div><div className="flex gap-2">{item.status === 'draft' && <button type="button" disabled={!canLaunch} onClick={() => router.post(route('teacher.assessments.launch', item.id), {}, { preserveScroll: true })} className="rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Lancer</button>}<Link href={route('teacher.assessments.results', item.id)} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">{item.corrected_attempts_count ? 'Voir la fiche de résultats' : 'Voir les copies'}</Link></div></article>; })}</div>}
            </section>
            {assessments.links.length > 3 && <nav className="flex flex-wrap justify-center gap-2" aria-label="Pagination">{assessments.links.map((item, index) => <Link key={`${item.label}-${index}`} href={item.url ?? '#'} preserveScroll className={`rounded-lg border px-3 py-2 text-sm ${item.active ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-200 bg-white text-slate-700'} ${!item.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: item.label }} />)}</nav>}
        </div></main>
    </AuthenticatedLayout>;
}
