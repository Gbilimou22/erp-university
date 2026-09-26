import { Building2 } from 'lucide-react';

export default function UniversityLogo() {
    return (
        <span className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-700 text-white">
                <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
                <span className="block text-sm font-bold tracking-wide text-slate-900">UNIVERSITÉ</span>
                <span className="block text-xs text-slate-500">Portail numérique</span>
            </span>
        </span>
    );
}
