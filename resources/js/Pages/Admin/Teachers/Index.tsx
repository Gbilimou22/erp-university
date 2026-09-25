import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, BookOpen, CalendarDays, Copy, KeyRound, UserPlus, Users } from 'lucide-react';

type Teacher = { id: number; name: string; email: string; is_active: boolean; created_at: string; taught_subjects_count: number };
type FlashProps = { flash?: { success?: string; temporaryCredentials?: { email: string; password: string } } };

export default function TeachersIndex({ teachers }: { teachers: Teacher[] }) {
    const { flash } = usePage().props as FlashProps;
    const form = useForm({ name: '', email: '' });
    const [copied, setCopied] = React.useState(false);

    const createTeacher = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('admin.teachers.store'), { onSuccess: () => form.reset() });
    };
    const copyCredentials = async () => {
        if (!flash?.temporaryCredentials) return;
        await navigator.clipboard.writeText(`Identifiant : ${flash.temporaryCredentials.email}\nMot de passe temporaire : ${flash.temporaryCredentials.password}`);
        setCopied(true);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-800">Comptes enseignants</h2>}>
            <Head title="Comptes enseignants" />
            <main className="min-h-screen space-y-6 bg-slate-50 p-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div><Link href={route('admin.teaching.assignments')} className="mb-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Retour aux affectations</Link><h1 className="text-2xl font-bold text-slate-800">Comptes enseignants</h1><p className="mt-1 text-sm text-slate-500">Créez les comptes avant de répartir les matières.</p></div>
                    <div className="flex flex-wrap gap-2"><Link href={route('admin.teaching.index')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><BookOpen className="h-4 w-4" />Gérer les UE / ECUE</Link><Link href={route('admin.teaching.assignments')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Users className="h-4 w-4" />Gérer les affectations</Link><Link href={route('admin.timetable.index')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"><CalendarDays className="h-4 w-4" />Emploi du temps</Link></div>
                </header>

                {flash?.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
                {flash?.temporaryCredentials && <section className="rounded-xl border border-amber-300 bg-amber-50 p-5" role="alert">
                    <div className="flex items-center gap-2 font-semibold text-amber-950"><KeyRound className="h-5 w-5" />Compte créé : identifiants temporaires</div>
                    <p className="mt-1 text-sm text-amber-900">Remettez ces identifiants à l’enseignant maintenant. Il devra choisir un nouveau mot de passe à sa première connexion. Ils ne seront plus affichés après avoir quitté ou actualisé cette page.</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-amber-800">Identifiant</dt><dd className="font-medium text-slate-900">{flash.temporaryCredentials.email}</dd></div><div><dt className="text-amber-800">Mot de passe temporaire</dt><dd className="select-all font-mono font-semibold text-slate-900">{flash.temporaryCredentials.password}</dd></div></dl>
                    <button type="button" onClick={copyCredentials} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-900 px-3 py-2 text-sm font-medium text-white"><Copy className="h-4 w-4" />{copied ? 'Identifiants copiés' : 'Copier les identifiants'}</button>
                </section>}

                <form onSubmit={createTeacher} className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="text-sm font-medium text-slate-700">Nom complet<input required maxLength={255} autoComplete="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.name && <span className="mt-1 block text-xs text-red-600">{form.errors.name}</span>}</label>
                    <label className="text-sm font-medium text-slate-700">Adresse e-mail<input required type="email" maxLength={255} autoComplete="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />{form.errors.email && <span className="mt-1 block text-xs text-red-600">{form.errors.email}</span>}</label>
                    <button disabled={form.processing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><UserPlus className="h-4 w-4" />Créer le compte</button>
                </form>

                <section className="overflow-hidden rounded-xl border bg-white">
                    <div className="border-b p-4"><h2 className="font-semibold text-slate-800">Enseignants enregistrés <span className="ml-1 text-sm font-normal text-slate-500">({teachers.length})</span></h2></div>
                    {teachers.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Aucun compte enseignant. Utilisez le formulaire ci-dessus pour commencer.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Enseignant</th><th className="p-4">Statut du compte</th><th className="p-4">Matières affectées</th></tr></thead><tbody className="divide-y">{teachers.map((teacher) => <tr key={teacher.id}><td className="p-4"><p className="font-medium text-slate-800">{teacher.name}</p><p className="text-xs text-slate-500">{teacher.email}</p></td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${teacher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{teacher.is_active ? 'Actif' : 'Désactivé'}</span></td><td className="p-4">{teacher.taught_subjects_count}</td></tr>)}</tbody></table></div>}
                </section>
            </main>
        </AuthenticatedLayout>
    );
}
