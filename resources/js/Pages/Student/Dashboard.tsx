import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, CreditCard, FileText, GraduationCap, ArrowRight, UsersRound, ClipboardList } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface StudentProfile {
    first_name: string;
    last_name: string;
    registration_number: string;
    status: string;
    department?: { name: string; faculty?: { name: string } };
    enrollments?: Array<{ level: string; academic_year?: { name: string }; program?: { name: string }; class_group?: { code: string; name: string } }>;
}

export default function StudentDashboard({ student }: { student: StudentProfile | null }) {
    const enrollment = student?.enrollments?.[0];

    const sections = [
        {
            title: 'Mon emploi du temps',
            detail: 'Retrouvez vos cours, salles et planning d\'examens.',
            icon: CalendarDays,
            href: route('student.timetable'),
            active: true,
        },
        {
            title: 'Mon groupe',
            detail: enrollment?.class_group ? `${enrollment.class_group.code} — ${enrollment.class_group.name}` : 'Aucun groupe ne vous a encore été attribué.',
            icon: UsersRound,
            href: route('student.group'),
            active: Boolean(enrollment?.class_group),
        },
        {
            title: 'Mes résultats',
            detail: 'Consultez vos notes et résultats d\'examens publiés.',
            icon: BookOpen,
            href: route('student.grades.index'),
            active: true,
        },
        {
            title: 'Évaluations en cours',
            detail: 'Consultez et passez les évaluations ouvertes pour vos matières.',
            icon: ClipboardList,
            href: route('student.assessments.index'),
            active: true,
        },
        {
            title: 'Ma situation financière',
            detail: 'Consultez l\'état de vos frais et paiements scolaires.',
            icon: CreditCard,
            href: '#',
            active: false,
        },
        {
            title: 'Mes documents',
            detail: 'Accédez à vos attestation d\'inscription et relevés.',
            icon: FileText,
            href: '#',
            active: false,
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Portail étudiant</p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                        {student ? `Bonjour, ${student.first_name} ${student.last_name}` : 'Votre dossier étudiant'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {student ? `Matricule : ${student.registration_number}` : 'Aucun dossier étudiant n’est encore associé à ce compte. Contactez la scolarité.'}
                    </p>
                </div>
            }
        >
            <Head title="Portail étudiant" />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-7">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 p-7 text-white shadow-lg sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm text-emerald-200">Portail étudiant</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{student ? `Bonjour, ${student.first_name}` : 'Votre espace universitaire'}</h2><p className="mt-2 text-sm text-emerald-100">Retrouvez votre parcours, vos cours et vos résultats depuis vos espaces dédiés.</p></div>{student && <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4"><p className="text-xs uppercase tracking-wider text-emerald-200">Matricule</p><p className="mt-1 font-semibold">{student.registration_number}</p></div>}</div></section>
                {student && (
                    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Filière</p>
                            <p className="mt-1 font-bold text-slate-900">{enrollment?.program?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Département</p>
                            <p className="mt-1 font-bold text-slate-900">{student.department?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Niveau</p>
                            <p className="mt-1 font-bold text-slate-900">{enrollment?.level ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Année académique</p>
                            <p className="mt-1 font-bold text-slate-900">{enrollment?.academic_year?.name ?? '—'}</p>
                        </div>
                        <div className="lg:col-span-4">
                            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Groupe pédagogique</p>
                            <p className="mt-1 font-bold text-slate-900">{enrollment?.class_group ? `${enrollment.class_group.code} — ${enrollment.class_group.name}` : 'Non affecté'}</p>
                        </div>
                    </section>
                )}

                <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {sections.map(({ title, detail, icon: Icon, href, active }) => {
                        const CardContent = (
                            <div className="flex h-full flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className={`rounded-xl p-2.5 ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        {active && <ArrowRight className="h-5 w-5 text-blue-600 transition-transform group-hover:translate-x-1" />}
                                    </div>

                                    <h2 className="mt-4 font-bold text-slate-900 group-hover:text-blue-600">{title}</h2>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
                                </div>

                                <div className="mt-4 border-t border-slate-100 pt-3">
                                    {active ? (
                                        <span className="text-xs font-bold text-blue-600">Accéder au service →</span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-slate-400 italic">Bientôt disponible</span>
                                    )}
                                </div>
                            </div>
                        );

                        return active ? (
                            <Link
                                key={title}
                                href={href}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md"
                            >
                                {CardContent}
                            </Link>
                        ) : (
                            <div
                                key={title}
                                className="group rounded-2xl border border-slate-200/80 bg-white/60 p-5 opacity-75"
                            >
                                {CardContent}
                            </div>
                        );
                    })}
                </section>

                <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
                    <Link href={route('profile.edit')} className="font-semibold text-blue-700 hover:underline">
                        Gérer mon compte & mot de passe
                    </Link>
                </div>
            </div></main>
        </AuthenticatedLayout>
    );
}
