import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, GraduationCap, UsersRound, CreditCard } from 'lucide-react';

type Student = {
    first_name: string;
    last_name: string;
    registration_number: string;
    status: string;
    department?: { name: string; faculty?: { name: string } };
};
type Enrollment = {
    level: string;
    academic_year?: { name: string };
    program?: { name: string };
    class_group?: { code: string; name: string };
} | null;

const services = [
    { title: 'Mon emploi du temps', description: 'Consultez vos cours, horaires et salles.', href: 'student.timetable', icon: CalendarDays, action: 'Voir mon planning' },
    { title: 'Mes évaluations', description: 'Retrouvez les épreuves ouvertes et vos copies remises.', href: 'student.assessments.index', icon: ClipboardList, action: 'Consulter les évaluations' },
    { title: 'Mes résultats', description: 'Consultez les notes publiées pour vos matières.', href: 'student.grades.index', icon: BookOpen, action: 'Voir mes résultats' },
    { title: 'Mon groupe', description: 'Retrouvez votre groupe pédagogique et ses informations.', href: 'student.group', icon: UsersRound, action: 'Voir mon groupe' },
    { title: 'Frais et paiements', description: 'Consultez les frais dus, votre solde et vos règlements.', href: 'student.finance.index', icon: CreditCard, action: 'Voir ma situation' },
];

export default function StudentDashboard({ student, enrollment, currentAcademicYear, publishedGradesCount = 0, pendingFinancialEnrollment = false }: {
    student: Student | null;
    enrollment: Enrollment;
    currentAcademicYear: string | null;
    publishedGradesCount?: number;
    pendingFinancialEnrollment?: boolean;
}) {
    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Portail étudiant</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Tableau de bord</h1><p className="mt-1 text-sm text-slate-500">Vos informations et services universitaires au même endroit.</p></div>}>
        <Head title="Portail étudiant" />
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-7">
            {pendingFinancialEnrollment && <section role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><h2 className="font-bold text-amber-950">Finalisez votre étape de scolarité</h2><p className="mt-1 text-sm text-amber-900">Votre inscription académique sera activée après le règlement complet des frais d’inscription auprès du service scolarité.</p></div><Link href={route('student.finance.index')} className="inline-flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white">Voir mes frais <ArrowRight className="h-4 w-4" /></Link></section>}
            {!student ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-950">Aucun dossier étudiant associé</h2><p className="mt-2 text-sm text-amber-900">Contactez la scolarité pour associer votre compte à votre dossier.</p></section> : <>
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 p-7 text-white shadow-lg sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div className="max-w-2xl"><p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100"><GraduationCap className="h-4 w-4" />Espace étudiant</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Bonjour, {student.first_name}</h2><p className="mt-3 text-sm leading-6 text-emerald-100">Accédez rapidement à votre planning, vos évaluations, vos résultats et votre groupe.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4"><p className="text-xs uppercase tracking-wider text-emerald-200">Matricule</p><p className="mt-1 font-semibold">{student.registration_number}</p></div><div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4"><p className="text-xs uppercase tracking-wider text-emerald-200">Année universitaire</p><p className="mt-1 font-semibold">{enrollment?.academic_year?.name ?? currentAcademicYear ?? 'Non définie'}</p></div></div></div></section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résumé de mon inscription">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filière</p><p className="mt-2 font-bold text-slate-900">{enrollment?.program?.name ?? 'Non renseignée'}</p></article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Département</p><p className="mt-2 font-bold text-slate-900">{student.department?.name ?? 'Non renseigné'}</p><p className="mt-1 text-xs text-slate-500">{student.department?.faculty?.name ?? ''}</p></article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Niveau</p><p className="mt-2 font-bold text-slate-900">{enrollment?.level ?? 'Non renseigné'}</p></article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes publiées</p><p className="mt-2 text-2xl font-bold text-slate-900">{publishedGradesCount}</p><Link href={route('student.grades.index')} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Consulter <ArrowRight className="h-4 w-4" /></Link></article>
                </section>

                <section><div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Mes services</h2><p className="mt-1 text-sm text-slate-500">Choisissez une rubrique pour ouvrir sa page dédiée.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{services.map(({ title, description, href, icon: Icon, action }) => <Link key={href} href={route(href)} className="group flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><span className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-1 flex-1 text-sm leading-5 text-slate-500">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">{action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div></section>

                {enrollment?.class_group && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Groupe pédagogique</p><p className="mt-1 font-bold text-emerald-950">{enrollment.class_group.code} · {enrollment.class_group.name}</p></div><Link href={route('student.group')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">Détails du groupe <ArrowRight className="h-4 w-4" /></Link></section>}
            </>}
            <div className="border-t border-slate-200 pt-4"><Link href={route('profile.edit')} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">Gérer mon compte et mon mot de passe</Link></div>
        </div></main>
    </AuthenticatedLayout>;
}
