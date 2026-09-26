import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { BookOpen, CalendarDays, Copy, KeyRound, UserPlus, Users } from 'lucide-react';

type Teacher = { id: number; name: string; email: string; is_active: boolean; created_at: string; taught_subjects_count: number };
type FlashProps = { flash?: { success?: string; temporaryCredentials?: { email: string; password: string } } };

export default function TeachersIndex({ teachers }: { teachers: Teacher[] }) {
    const { flash } = usePage().props as FlashProps;
    const [copied, setCopied] = React.useState(false);
    const copyCredentials = async () => {
        if (!flash?.temporaryCredentials) return;
        await navigator.clipboard.writeText(`Identifiant : ${flash.temporaryCredentials.email}\nMot de passe temporaire : ${flash.temporaryCredentials.password}`);
        setCopied(true);
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Comptes enseignants</h1>
                    <p className="mt-1 text-sm text-slate-500">Gestion des accès et des comptes du corps enseignant.</p>
                </div>
            }
        >
            <Head title="Comptes enseignants" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <BackButton href={route('admin.dashboard')} label="Retour au tableau de bord" />
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('admin.teachers.create')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800"><UserPlus className="h-4 w-4" />Créer un compte enseignant</Link>
                            <Link href={route('admin.teaching.index')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><BookOpen className="h-4 w-4" />Gérer les UE / ECUE</Link>
                            <Link href={route('admin.teaching.assignments')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Users className="h-4 w-4" />Gérer les affectations</Link>
                            <Link href={route('admin.timetable.index')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800"><CalendarDays className="h-4 w-4" />Emploi du temps</Link>
                        </div>
                    </div>

                {flash?.success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
                {flash?.temporaryCredentials && <section className="rounded-xl border border-amber-300 bg-amber-50 p-5" role="alert">
                    <div className="flex items-center gap-2 font-semibold text-amber-950"><KeyRound className="h-5 w-5" />Compte créé : identifiants temporaires</div>
                    <p className="mt-1 text-sm text-amber-900">Remettez ces identifiants à l’enseignant maintenant. Il devra choisir un nouveau mot de passe à sa première connexion. Ils ne seront plus affichés après avoir quitté ou actualisé cette page.</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-amber-800">Identifiant</dt><dd className="font-medium text-slate-900">{flash.temporaryCredentials.email}</dd></div><div><dt className="text-amber-800">Mot de passe temporaire</dt><dd className="select-all font-mono font-semibold text-slate-900">{flash.temporaryCredentials.password}</dd></div></dl>
                    <button type="button" onClick={copyCredentials} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-900 px-3 py-2 text-sm font-medium text-white"><Copy className="h-4 w-4" />{copied ? 'Identifiants copiés' : 'Copier les identifiants'}</button>
                </section>}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4"><h2 className="font-semibold text-slate-800">Enseignants enregistrés <span className="ml-1 text-sm font-normal text-slate-500">({teachers.length})</span></h2></div>
                    {teachers.length === 0 ? <div className="p-8 text-center"><p className="text-sm text-slate-500">Aucun compte enseignant enregistré.</p><Link href={route('admin.teachers.create')} className="mt-3 inline-flex items-center gap-2 font-semibold text-indigo-700"><UserPlus className="h-4 w-4"/>Créer le premier compte</Link></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Enseignant</th><th className="p-4">Statut du compte</th><th className="p-4">Matières affectées</th></tr></thead><tbody className="divide-y">{teachers.map((teacher) => <tr key={teacher.id}><td className="p-4"><p className="font-medium text-slate-800">{teacher.name}</p><p className="text-xs text-slate-500">{teacher.email}</p></td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${teacher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{teacher.is_active ? 'Actif' : 'Désactivé'}</span></td><td className="p-4">{teacher.taught_subjects_count}</td></tr>)}</tbody></table></div>}
                </section>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
