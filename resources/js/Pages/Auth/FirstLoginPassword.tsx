import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';

export default function FirstLoginPassword() {
    const { data, setData, put, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        put(route('first-login.password.update'));
    };

    return (
        <>
            <Head title="Changer le mot de passe temporaire" />
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
                <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><KeyRound className="h-6 w-6" /></div>
                    <h1 className="text-2xl font-bold text-slate-900">Sécurisez votre compte</h1>
                    <p className="mt-2 text-sm text-slate-600">Votre compte a été créé avec un mot de passe temporaire. Choisissez un nouveau mot de passe pour accéder à votre portail.</p>
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe
                            <input autoComplete="new-password" type="password" minLength={12} required value={data.password} onChange={(event) => setData('password', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                            <span className="mt-1 block text-xs font-normal text-slate-500">12 caractères minimum.</span>
                            {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password}</span>}
                        </label>
                        <label className="block text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe
                            <input autoComplete="new-password" type="password" minLength={12} required value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                        </label>
                        <button disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                            <ShieldCheck className="h-4 w-4" />{processing ? 'Enregistrement…' : 'Enregistrer et ouvrir mon portail'}
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
