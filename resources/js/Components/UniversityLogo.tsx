import { Building2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function UniversityLogo({ compact = false }: { compact?: boolean }) {
    const settings = usePage().props.platformSettings;
    const platformName = settings?.platform_name || 'Université';
    const tagline = settings?.platform_tagline || 'Portail numérique';
    const imageUrl = compact
        ? settings?.emblem_url || settings?.logo_url
        : settings?.logo_url || settings?.emblem_url;

    if (compact) {
        return (
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white text-indigo-700">
                {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}
            </span>
        );
    }

    return (
        <span className="inline-flex max-w-full items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-700">
                {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}
            </span>
            <span className="leading-tight">
                <span className="block max-w-60 truncate text-sm font-bold tracking-wide text-slate-900">{platformName}</span>
                <span className="block max-w-60 truncate text-xs text-slate-500">{tagline}</span>
            </span>
        </span>
    );
}
