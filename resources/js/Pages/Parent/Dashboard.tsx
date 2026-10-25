import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookUser, GraduationCap, LogOut, ShieldCheck } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const cards = [
    {
        title: 'Suivi des élèves',
        detail: 'Consultez l’état académique et le groupe de vos enfants.',
        icon: GraduationCap,
        href: '#',
        active: false,
    },
    {
        title: 'Documents',
        detail: 'Accédez aux relevés, attestations et pièces administratives.',
        icon: BookUser,
        href: '#',
        active: false,
    },
    {
        title: 'Sécurité',
        detail: 'Vérifiez les informations de compte et la confidentialité.',
        icon: ShieldCheck,
        href: '#',
        active: false,
    },
];

export default function ParentDashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Portail parent</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Bienvenue</h1>
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                    </Link>
                </div>
            }
        >
            <Head title="Portail parent" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <header className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 p-6 text-white shadow-sm">
                        <p className="text-sm text-indigo-100">Espace parent</p>
                        <h2 className="mt-1 text-2xl font-bold">Suivi scolaire de votre enfant</h2>
                        <p className="mt-2 text-sm text-indigo-100">Consultez les informations de scolarité et les services disponibles.</p>
                    </header>

                    <section className="grid gap-4 md:grid-cols-3">
                        {cards.map(({ title, detail, icon: Icon, active }) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-80"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {active && <ArrowRight className="h-4 w-4 text-indigo-700" />}
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">{detail}</p>
                                <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                                    Bientôt disponible
                                </div>
                            </div>
                        ))}
                    </section>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
