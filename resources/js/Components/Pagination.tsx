import { Link } from '@inertiajs/react';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    itemLabel: string;
};

export default function Pagination({ links, from, to, total, itemLabel }: Props) {
    if (total <= 20) return null;

    return (
        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4" aria-label="Pagination">
            <p className="text-sm text-slate-500">Affichage de {from} à {to} sur {total} {itemLabel}</p>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        aria-current={link.active ? 'page' : undefined}
                        className={`rounded border px-3 py-1 text-sm ${link.active ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        aria-disabled="true"
                        className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </nav>
    );
}
