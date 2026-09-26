import { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import UniversityLogo from '@/Components/UniversityLogo';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Eye,
    EyeOff,
    GraduationCap,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';

const portals = [
    { id: 'student', label: 'Étudiant', icon: GraduationCap },
    { id: 'teacher', label: 'Enseignant', icon: BookOpen },
    { id: 'parent', label: 'Parent', icon: UsersRound },
    { id: 'admin', label: 'Administration', icon: ShieldCheck },
] as const;

type PortalId = (typeof portals)[number]['id'];

export default function Login({
    status,
    canResetPassword,
    role = 'student',
}: {
    status?: string;
    canResetPassword?: boolean;
    role?: string;
}) {
    const initialPortal = portals.some((portal) => portal.id === role)
        ? (role as PortalId)
        : 'student';
    const [selectedPortal, setSelectedPortal] = useState<PortalId>(initialPortal);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const activePortal = portals.find((portal) => portal.id === selectedPortal)!;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title={`Connexion · ${activePortal.label}`} />
            <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-8 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
                    <header className="flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            <UniversityLogo />
                        </Link>
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Retour au portail</span>
                        </Link>
                    </header>

                    <div className="my-auto w-full py-8">
                        <div className="mx-auto grid max-w-[880px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[0.8fr_1.2fr]">
                            <aside className="flex flex-col justify-between bg-[#17264a] p-7 text-white sm:p-9">
                                <div className="hidden md:block">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Espace sécurisé</p>
                                    <h1 className="mt-5 text-3xl font-semibold leading-tight">Votre université, simplement.</h1>
                                    <p className="mt-4 text-sm leading-6 text-slate-300">Connectez-vous pour retrouver les services liés à votre activité universitaire.</p>
                                </div>
                                <div className="md:hidden">
                                    <p className="text-xl font-semibold">Accès au portail</p>
                                    <p className="mt-1 text-sm text-slate-300">Connectez-vous à votre espace universitaire.</p>
                                </div>
                                <p className="mt-6 hidden text-xs text-slate-400 md:block">© {new Date().getFullYear()} · Portail universitaire</p>
                            </aside>

                            <section className="p-6 sm:p-9">
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Connexion</h2>
                                    <p className="mt-1 text-sm text-slate-500">Sélectionnez votre espace et entrez vos identifiants.</p>
                                </div>

                                <div className="mt-6">
                                    <p className="mb-2 text-xs font-medium text-slate-600">Je suis</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Choisir un espace utilisateur">
                                        {portals.map((portal) => {
                                            const Icon = portal.icon;
                                            const selected = selectedPortal === portal.id;

                                            return (
                                                <button
                                                    key={portal.id}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => setSelectedPortal(portal.id)}
                                                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${selected ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                                >
                                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                                    {portal.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {status && (
                                    <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Adresse e-mail</label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            aria-invalid={Boolean(errors.email)}
                                            aria-describedby={errors.email ? 'email-error' : undefined}
                                            placeholder="nom@universite.edu"
                                            className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'}`}
                                        />
                                        {errors.email && <p id="email-error" className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between gap-3">
                                            <label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</label>
                                            {canResetPassword && (
                                                <Link href={route('password.request')} className="text-xs font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus:underline">
                                                    Mot de passe oublié ?
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={data.password}
                                                onChange={(event) => setData('password', event.target.value)}
                                                autoComplete="current-password"
                                                required
                                                aria-invalid={Boolean(errors.password)}
                                                aria-describedby={errors.password ? 'password-error' : undefined}
                                                placeholder="Votre mot de passe"
                                                className={`block w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((visible) => !visible)}
                                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                                            </button>
                                        </div>
                                        {errors.password && <p id="password-error" className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                                    </div>

                                    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(event) => setData('remember', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Se souvenir de moi
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? 'Connexion en cours…' : 'Se connecter'}
                                        {!processing && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                                    </button>
                                </form>
                                <p className="mt-4 text-xs leading-5 text-slate-400">L’espace accessible après connexion dépend du profil associé à votre compte.</p>
                            </section>
                        </div>
                    </div>

                    <footer className="text-center text-xs text-slate-400 md:hidden">© {new Date().getFullYear()} · Portail universitaire</footer>
                </div>
            </main>
        </>
    );
}
