import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Mail, Phone, GraduationCap, Pencil, FileText, ShieldAlert, Award } from 'lucide-react';
import BackButton from '@/Components/BackButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    gender: string;
    birth_date?: string;
    registration_number: string;
    status: string;
    department?: { name: string; faculty?: { name: string } };
    enrollments?: Array<{ level: string; status: string; administrative_status?: string; pedagogical_status?: string; academic_year?: { name: string }; program?: { name: string } }>;
    documents?: Array<{ id: number; document_type: string; title: string; original_name: string; verification_status: string }>;
    sanctions?: Array<{ id: number; sanction_type: string; reason: string; authority: string; imposed_at: string }>;
    certificates?: Array<{ id: number; certificate_type: string; reference_number: string; issued_at: string }>;
}

interface Props {
    student: Student;
    flash?: { temporaryCredentials?: { email: string; password: string } };
}

export default function ShowStudent({ student, flash }: Props) {
    const enrollment = student.enrollments?.[0];
    const [copied, setCopied] = useState(false);
    const temporaryCredentials = flash?.temporaryCredentials;

    const copyTemporaryPassword = async () => {
        if (!temporaryCredentials) return;
        await navigator.clipboard.writeText(`Identifiant : ${temporaryCredentials.email}\nMot de passe temporaire : ${temporaryCredentials.password}`);
        setCopied(true);
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Administration · Scolarité</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dossier étudiant</h1><p className="mt-1 text-sm text-slate-500">{student.first_name} {student.last_name} · {student.registration_number}</p></div>}>
            <Head title={`Étudiant ${student.registration_number}`} />
            <main className="mx-auto min-h-screen max-w-4xl space-y-6 bg-slate-50 p-6">
                <BackButton href={route('admin.students.index')} label="Retour à la liste des étudiants" />
                {temporaryCredentials && (
                    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5" role="alert">
                        <h2 className="font-semibold text-amber-950">Compte portail créé — identifiants temporaires</h2>
                        <p className="mt-1 text-sm text-amber-900">Remettez ces identifiants à l’étudiant maintenant. Le mot de passe ne sera plus affiché après avoir quitté ou actualisé cette page.</p>
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-amber-800">Identifiant</dt><dd className="font-medium text-slate-900">{temporaryCredentials.email}</dd></div><div><dt className="text-amber-800">Mot de passe temporaire</dt><dd className="select-all font-mono font-semibold text-slate-900">{temporaryCredentials.password}</dd></div></dl>
                        <button type="button" onClick={copyTemporaryPassword} className="mt-3 rounded-lg bg-amber-900 px-3 py-2 text-sm font-medium text-white">{copied ? 'Identifiants copiés' : 'Copier les identifiants'}</button>
                    </section>
                )}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                        <div><p className="font-mono text-sm text-slate-500">{student.registration_number}</p><h1 className="mt-1 text-2xl font-bold text-slate-800">{student.first_name} {student.last_name}</h1><p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${student.status === 'archived' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>{student.status === 'archived' ? 'Archivé' : student.status}</p></div>
                        <Link href={route('admin.students.edit', student.id)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Pencil className="h-4 w-4" />Modifier le dossier</Link>
                        <div className="space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Mail className="h-4 w-4" />{student.email}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4" />{student.phone || 'Téléphone non renseigné'}</p></div>
                    </div>
                    <div className="grid gap-6 pt-5 sm:grid-cols-2">
                        <div><h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Informations personnelles</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Date de naissance</dt><dd>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Genre</dt><dd>{student.gender === 'M' ? 'Masculin' : 'Féminin'}</dd></div></dl></div>
                        <div><h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase text-slate-500"><GraduationCap className="h-4 w-4" />Inscription académique</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Faculté</dt><dd>{student.department?.faculty?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Département</dt><dd>{student.department?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Filière</dt><dd>{enrollment?.program?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Niveau</dt><dd>{enrollment?.level ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Année</dt><dd>{enrollment?.academic_year?.name ?? '—'}</dd></div></dl></div>
                        <div><h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Statut des inscriptions</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Administrative</dt><dd>{enrollment?.administrative_status ?? 'pending'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Pédagogique</dt><dd>{enrollment?.pedagogical_status ?? 'pending'}</dd></div></dl></div>
                    </div>
                </section>
                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-4 w-4 text-blue-700" />Pièces du dossier</h2>{student.documents?.length ? <ul className="mt-3 space-y-2 text-sm">{student.documents.map(document => <li key={document.id} className="flex justify-between gap-3"><span>{document.title}</span><span className="text-slate-500">{document.verification_status}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aucune pièce enregistrée.</p>}</article>
                    <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldAlert className="h-4 w-4 text-red-700" />Sanctions disciplinaires</h2>{student.sanctions?.length ? <ul className="mt-3 space-y-2 text-sm">{student.sanctions.map(sanction => <li key={sanction.id}><p className="font-medium">{sanction.sanction_type}</p><p className="text-xs text-slate-500">{sanction.authority} · {sanction.imposed_at}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aucune sanction enregistrée.</p>}</article>
                    <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><Award className="h-4 w-4 text-amber-700" />Diplômes et attestations</h2>{student.certificates?.length ? <ul className="mt-3 space-y-2 text-sm">{student.certificates.map(certificate => <li key={certificate.id}><p className="font-medium">{certificate.certificate_type}</p><p className="text-xs text-slate-500">{certificate.reference_number}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Aucun acte enregistré.</p>}</article>
                </section>
            </main>
        </AuthenticatedLayout>
    );
}
