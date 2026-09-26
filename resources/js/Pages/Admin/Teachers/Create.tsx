import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { UserPlus } from 'lucide-react';

export default function CreateTeacher() {
    const form = useForm({ name: '', email: '' });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('admin.teachers.store'), { onSuccess: () => form.reset() });
    };

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration · Pédagogie</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Créer un compte enseignant</h1><p className="mt-1 text-sm text-slate-500">Renseignez les informations de base. Les identifiants temporaires seront affichés après la création.</p></div>}>
        <Head title="Créer un compte enseignant"/><main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl space-y-6">
            <BackButton href={route('admin.teachers.index')} label="Retour à la liste des enseignants" />
            <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div><h2 className="font-semibold text-slate-900">Informations du compte</h2><p className="mt-1 text-sm text-slate-500">L’enseignant devra définir un nouveau mot de passe à sa première connexion.</p></div>
                <label className="block text-sm font-medium text-slate-700">Nom complet<input required maxLength={255} autoComplete="name" value={form.data.name} onChange={e => form.setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"/>{form.errors.name && <span className="mt-1 block text-xs text-red-600">{form.errors.name}</span>}</label>
                <label className="block text-sm font-medium text-slate-700">Adresse e-mail<input required type="email" maxLength={255} autoComplete="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300"/>{form.errors.email && <span className="mt-1 block text-xs text-red-600">{form.errors.email}</span>}</label>
                <div className="flex flex-wrap gap-3"><button disabled={form.processing} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4"/>{form.processing ? 'Création…' : 'Créer le compte'}</button><Link href={route('admin.teachers.index')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">Annuler</Link></div>
            </form>
        </div></main>
    </AuthenticatedLayout>;
}
