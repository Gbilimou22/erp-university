import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Account = { id: number; name: string; email: string; role: string; is_active: boolean };
type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

export default function Index({ users, filters, temporaryPassword, recoveredUser }: {
    users: Paginated<Account>;
    filters: { search: string };
    temporaryPassword?: string;
    recoveredUser?: string;
}) {
    const { data, setData, get, processing } = useForm({ search: filters.search ?? '' });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        get(route('admin.account-recovery.index'), { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-slate-900">Récupération des comptes</h1>}>
            <Head title="Récupération des comptes" />
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                    Vérifiez l’identité de la personne en personne ou par un canal institutionnel fiable avant toute réinitialisation. Le mot de passe temporaire s’affiche une seule fois : transmettez-le directement au titulaire et demandez-lui de le changer dès sa connexion.
                </div>
                {temporaryPassword && (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                        <p>Mot de passe temporaire créé pour <strong>{recoveredUser}</strong>. Transmettez-le directement à la personne vérifiée.</p>
                        <p className="mt-2 select-all rounded-lg bg-white p-3 font-mono text-base">{temporaryPassword}</p>
                    </div>
                )}
                <form onSubmit={submit} className="flex gap-3">
                    <input value={data.search} onChange={(event) => setData('search', event.target.value)} placeholder="Nom ou adresse e-mail" className="w-full max-w-md rounded-lg border-slate-300 text-sm" />
                    <button disabled={processing} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Rechercher</button>
                </form>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="divide-y divide-slate-100">
                        {users.data.map((user) => (
                            <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{user.name}</p>
                                    <p className="text-sm text-slate-600">{user.email} · {user.role} · {user.is_active ? 'Actif' : 'Désactivé'}</p>
                                </div>
                                <button type="button" onClick={() => {
                                    if (window.confirm(`Après vérification d’identité, réinitialiser le mot de passe de ${user.name} ?`)) {
                                        router.post(route('admin.account-recovery.reset', user.id));
                                    }
                                }} className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-50">Générer un mot de passe temporaire</button>
                            </div>
                        ))}
                        {users.data.length === 0 && <p className="p-6 text-sm text-slate-500">Aucun compte trouvé.</p>}
                    </div>
                </div>
                <nav className="flex flex-wrap gap-2" aria-label="Pagination">
                    {users.links.map((link, index) => link.url ? <Link key={index} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : null)}
                </nav>
            </div>
        </AuthenticatedLayout>
    );
}
