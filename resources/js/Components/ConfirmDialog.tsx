import { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from '@/Components/Modal';

interface Props {
    show: boolean;
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'warning' | 'primary';
    processing?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

const tones = {
    danger: 'bg-red-700 hover:bg-red-800 focus:ring-red-200',
    warning: 'bg-amber-700 hover:bg-amber-800 focus:ring-amber-200',
    primary: 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-200',
};

export default function ConfirmDialog({
    show,
    title,
    description,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    tone = 'warning',
    processing = false,
    onConfirm,
    onClose,
}: Props) {
    return <Modal show={show} maxWidth="md" closeable={!processing} onClose={onClose}>
        <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
                <button type="button" aria-label="Fermer" disabled={processing} onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
        <div className="px-5 py-5 text-sm leading-6 text-slate-600">{description}</div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button type="button" disabled={processing} onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{cancelLabel}</button>
            <button type="button" disabled={processing} onClick={onConfirm} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}>{processing ? 'Traitement…' : confirmLabel}</button>
        </div>
    </Modal>;
}
