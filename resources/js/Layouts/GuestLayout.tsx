import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import UniversityLogo from '@/Components/UniversityLogo';

interface GuestLayoutProps extends PropsWithChildren {
    title: string;
    description?: string;
}

export default function GuestLayout({ title, description, children }: GuestLayoutProps) {
    const platform = usePage().props.platformSettings;
    const platformName = platform?.platform_name || 'Université';

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
                <Link href="/" className="mb-7 inline-flex w-fit items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <UniversityLogo />
                </Link>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <header className="border-b border-slate-100 px-6 py-5 sm:px-8">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
                        {description && <p className="mt-1.5 text-sm leading-5 text-slate-500">{description}</p>}
                    </header>
                    <div className="p-6 sm:p-8">{children}</div>
                </section>

                <Link href="/" className="mt-5 inline-flex items-center justify-center gap-2 text-sm text-slate-500 transition hover:text-slate-800">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Retour au portail
                </Link>
                <footer className="mt-8 space-y-2 text-center text-xs text-slate-400">
                    <p>© {new Date().getFullYear()} · {platformName}</p>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                        {platform?.website && <a href={platform.website} className="hover:text-slate-600">{platform.website}</a>}
                        {platform?.contact_email && <a href={`mailto:${platform.contact_email}`} className="hover:text-slate-600">{platform.contact_email}</a>}
                        {platform?.contact_phone && <a href={`tel:${platform.contact_phone}`} className="hover:text-slate-600">{platform.contact_phone}</a>}
                    </div>
                </footer>
            </div>
        </main>
    );
}
