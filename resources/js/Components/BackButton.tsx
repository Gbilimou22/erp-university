import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    href: string;
    label?: string;
    className?: string;
}

export default function BackButton({ href, label = 'Retour', className = '' }: BackButtonProps) {
    return (
        <Link
            href={href}
            className={`group inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${className}`}
        >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{label}</span>
        </Link>
    );
}
