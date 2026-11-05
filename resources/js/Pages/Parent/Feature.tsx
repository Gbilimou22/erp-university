import { Head } from '@inertiajs/react';
import { BellRing, FileText, ShieldCheck } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';

export default function ParentFeature({ title, description }: { title: string; description: string }) {
    const Icon = title === 'Documents' ? FileText : ShieldCheck;
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Portail parent</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1></div>}>
        <Head title={`${title} · Portail parent`} />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl space-y-6">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-violet-800 p-7 text-white shadow-lg sm:p-10"><div className="flex flex-wrap items-center justify-between gap-6"><div className="max-w-2xl"><p className="text-sm text-violet-200">Espace famille</p><h2 className="mt-2 text-3xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-violet-100">{description}</p></div><div className="rounded-2xl bg-white/10 p-4"><Icon className="h-8 w-8" /></div></div></section>
            <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="rounded-xl bg-violet-50 p-3 text-violet-700"><BellRing className="h-5 w-5" /></div><div><h3 className="font-semibold text-slate-900">Espace préparé</h3><p className="mt-2 text-sm leading-6 text-slate-600">Cette rubrique est maintenant séparée du tableau de bord. Les informations apparaîtront ici lorsque le lien parent-enfant et les services associés seront activés dans la plateforme.</p><p className="mt-3 text-xs text-slate-500">Aucune donnée scolaire ou document n’est affiché tant qu’il n’est pas rattaché à votre compte.</p></div></div></section>
            <BackButton href={route('parent.dashboard')} label="Retour au tableau de bord" />
        </div></main>
    </AuthenticatedLayout>;
}
