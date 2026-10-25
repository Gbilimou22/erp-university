import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, CreditCard, FileText, GraduationCap, ArrowRight, UsersRound } from 'lucide-react';
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
            href: '#',
            active: false,
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
            <main className="mx-auto max-w-7xl space-y-8 p-6">
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
            </main>
        </AuthenticatedLayout>
    );
}
