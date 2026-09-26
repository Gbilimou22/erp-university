import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Mail, Phone, GraduationCap } from 'lucide-react';
import BackButton from '@/Components/BackButton';

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
    enrollments?: Array<{ level: string; status: string; academic_year?: { name: string }; program?: { name: string } }>;
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
        <>
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
                        <div><p className="font-mono text-sm text-slate-500">{student.registration_number}</p><h1 className="mt-1 text-2xl font-bold text-slate-800">{student.first_name} {student.last_name}</h1><p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{student.status}</p></div>
                        <div className="space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Mail className="h-4 w-4" />{student.email}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4" />{student.phone || 'Téléphone non renseigné'}</p></div>
                    </div>
                    <div className="grid gap-6 pt-5 sm:grid-cols-2">
                        <div><h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Informations personnelles</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Date de naissance</dt><dd>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Genre</dt><dd>{student.gender === 'M' ? 'Masculin' : 'Féminin'}</dd></div></dl></div>
                        <div><h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase text-slate-500"><GraduationCap className="h-4 w-4" />Inscription académique</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Faculté</dt><dd>{student.department?.faculty?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Département</dt><dd>{student.department?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Filière</dt><dd>{enrollment?.program?.name ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Niveau</dt><dd>{enrollment?.level ?? '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Année</dt><dd>{enrollment?.academic_year?.name ?? '—'}</dd></div></dl></div>
                    </div>
                </section>
            </main>
        </>
    );
}
