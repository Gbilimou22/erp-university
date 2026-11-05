import UniversityLogo from '@/Components/UniversityLogo';
import BackButton from '@/Components/BackButton';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import {
    BookMarked, BookOpen, Building2, CalendarDays, ChevronDown, ClipboardList,
    DoorOpen, GraduationCap, LayoutDashboard, LogOut, School, ShieldCheck,
    Users, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = { label: string; href: string; active: boolean; icon: LucideIcon };

export default function Authenticated({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const role = (user.role ?? 'admin').toLowerCase();
    const isAdmin = role === 'admin';
    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';
    const isParent = role === 'parent';

    const navItems: NavItem[] = [
        ...(isAdmin ? [
            { label: 'Tableau de bord', href: route('admin.dashboard'), active: route().current('admin.dashboard'), icon: LayoutDashboard },
            { label: 'Structure académique', href: route('admin.academic.index'), active: route().current('admin.academic.*'), icon: Building2 },
            { label: 'Années universitaires', href: route('admin.academic-years.index'), active: route().current('admin.academic-years.*'), icon: CalendarDays },
            { label: 'Programmes et maquettes', href: route('admin.curricula.index'), active: route().current('admin.curricula.*'), icon: BookMarked },
            { label: 'Groupes pédagogiques', href: route('admin.academic-groups.index'), active: route().current('admin.academic-groups.*'), icon: School },
            { label: 'Étudiants', href: route('admin.students.index'), active: route().current('admin.students.*'), icon: Users },
            { label: 'Enseignants', href: route('admin.teachers.index'), active: route().current('admin.teachers.*'), icon: GraduationCap },
            { label: 'Unités d’enseignement', href: route('admin.teaching.index'), active: route().current('admin.teaching.index'), icon: BookMarked },
            { label: 'Matières', href: route('admin.teaching.subjects.index'), active: route().current('admin.teaching.subjects.index'), icon: BookOpen },
            { label: 'Affectations enseignants', href: route('admin.teaching.assignments'), active: route().current('admin.teaching.assignments'), icon: GraduationCap },
            { label: 'Emploi du temps', href: route('admin.timetable.index'), active: route().current('admin.timetable.index'), icon: CalendarDays },
            { label: 'Salles', href: route('admin.timetable.rooms.index'), active: route().current('admin.timetable.rooms.*'), icon: DoorOpen },
            { label: 'Séances planifiées', href: route('admin.timetable.entries.index'), active: route().current('admin.timetable.entries.*'), icon: ClipboardList },
            { label: 'Publication des notes', href: route('admin.grades.index'), active: route().current('admin.grades.*'), icon: ClipboardList },
            { label: 'Récupération des comptes', href: route('admin.account-recovery.index'), active: route().current('admin.account-recovery.*'), icon: ShieldCheck },
        ] : []),
        ...(isStudent ? [
            { label: 'Tableau de bord', href: route('student.dashboard'), active: route().current('student.dashboard'), icon: LayoutDashboard },
            { label: 'Mon emploi du temps', href: route('student.timetable'), active: route().current('student.timetable'), icon: CalendarDays },
            { label: 'Mon groupe', href: route('student.group'), active: route().current('student.group'), icon: UsersRound },
            { label: 'Mes résultats', href: route('student.grades.index'), active: route().current('student.grades.*'), icon: ClipboardList },
            { label: 'Évaluations en cours', href: route('student.assessments.index'), active: route().current('student.assessments.*'), icon: ClipboardList },
        ] : []),
        ...(isTeacher ? [
            { label: 'Tableau de bord', href: route('teacher.dashboard'), active: route().current('teacher.dashboard'), icon: LayoutDashboard },
            { label: 'Mes matières', href: route('teacher.subjects.index'), active: route().current('teacher.subjects.*'), icon: BookOpen },
            { label: 'Mon emploi du temps', href: route('teacher.timetable'), active: route().current('teacher.timetable'), icon: CalendarDays },
            { label: 'Saisie des notes', href: route('teacher.grades.index'), active: route().current('teacher.grades.*'), icon: ClipboardList },
            { label: 'Évaluations', href: route('teacher.assessments.index'), active: route().current('teacher.assessments.*'), icon: ClipboardList },
            { label: 'Mes groupes', href: route('teacher.groups.index'), active: route().current('teacher.groups.*'), icon: UsersRound },
        ] : []),
        ...(isParent ? [
            { label: 'Tableau de bord', href: route('parent.dashboard'), active: route().current('parent.dashboard'), icon: LayoutDashboard },
            { label: 'Suivi élève', href: route('parent.tracking'), active: route().current('parent.tracking'), icon: ShieldCheck },
            { label: 'Documents', href: route('parent.documents'), active: route().current('parent.documents'), icon: BookOpen },
        ] : []),
    ];

    const adminGroups = [
        { title: 'Vue générale', labels: ['Tableau de bord'] },
        { title: 'Structure et cursus', labels: ['Structure académique', 'Années universitaires', 'Programmes et maquettes', 'Groupes pédagogiques'] },
        { title: 'Étudiants et équipe', labels: ['Étudiants', 'Enseignants'] },
        { title: 'Enseignements', labels: ['Unités d’enseignement', 'Matières', 'Affectations enseignants'] },
        { title: 'Planning', labels: ['Emploi du temps', 'Salles', 'Séances planifiées'] },
        { title: 'Notes et sécurité', labels: ['Publication des notes', 'Récupération des comptes'] },
    ].map(group => ({ ...group, items: navItems.filter(item => group.labels.includes(item.label)) }));
    const activeGroup = adminGroups.find(group => group.items.some(item => item.active))?.title ?? 'Vue générale';
    const [expandedGroup, setExpandedGroup] = useState(activeGroup);
    useEffect(() => setExpandedGroup(activeGroup), [activeGroup]);

    const hasContextualBack = [
        'admin.academic.index', 'admin.academic-groups.index', 'admin.academic-groups.show', 'admin.curricula.index',
        'admin.students.create', 'admin.students.show', 'admin.students.edit', 'admin.teachers.index', 'admin.teachers.create',
        'admin.teaching.index', 'admin.teaching.subjects.index', 'admin.teaching.assignments', 'admin.timetable.index',
        'admin.timetable.rooms.index', 'admin.timetable.entries.index', 'student.group', 'student.timetable',
        'parent.tracking', 'parent.documents', 'teacher.assessments.results',
    ].some(name => route().current(name));

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;
        return <Link key={item.label} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${item.active ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
        </Link>;
    };

    const sidebarColor = isTeacher ? 'from-slate-950 via-indigo-950 to-slate-950' : isStudent ? 'from-slate-950 via-emerald-950 to-slate-950' : isParent ? 'from-slate-950 via-violet-950 to-slate-950' : 'from-slate-950 via-blue-950 to-slate-950';
    const portalLabel = isAdmin ? 'Administration' : isTeacher ? 'Espace pédagogique' : isStudent ? 'Espace étudiant' : 'Espace parent';

    return <div className="min-h-screen bg-slate-100 lg:flex">
        <aside className={`w-full bg-gradient-to-b ${sidebarColor} text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:overflow-y-auto`}>
            <div className="border-b border-white/10 px-4 py-4"><Link href={route('dashboard')} className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-2"><UniversityLogo /></div><div className="leading-tight"><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">ERP</p><p className="text-sm font-semibold text-white">Université</p></div></Link></div>
            <nav className="px-3 py-4"><p className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/70 lg:block">{portalLabel}</p>
                {isAdmin ? <div className="space-y-1">{adminGroups.map(group => {
                    const open = expandedGroup === group.title;
                    if (group.title === 'Vue générale') return <div key={group.title}>{group.items.map(renderNavItem)}</div>;
                    return <section key={group.title}><button type="button" aria-expanded={open} onClick={() => setExpandedGroup(open ? '' : group.title)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"><span>{group.title}</span><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="ml-2 space-y-1 border-l border-white/10 py-1 pl-2">{group.items.map(renderNavItem)}</div>}</section>;
                })}</div> : <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">{navItems.map(renderNavItem)}</div>}
            </nav>
            <div className="border-t border-white/10 p-4 lg:mt-4"><div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Connecté</p><p className="mt-1 truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs text-slate-400">{user.email}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><Link href={route('profile.edit')} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"><ShieldCheck className="h-4 w-4" />Profil</Link><Link href={route('logout')} method="post" as="button" className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"><LogOut className="h-4 w-4" />Sortir</Link></div></div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{header && <header className={`border-b border-slate-200 bg-white ${isAdmin ? 'border-t-4 border-t-blue-700' : ''}`}><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="min-w-0 flex-1">{header}</div>{!route().current('admin.dashboard') && !route().current('student.dashboard') && !route().current('teacher.dashboard') && !route().current('parent.dashboard') && !route().current('student.assessments.show') && <div id="page-back-button" className="flex shrink-0 self-start sm:self-center">{!hasContextualBack && <Link href={route(isAdmin ? 'admin.dashboard' : isTeacher ? 'teacher.dashboard' : isStudent ? 'student.dashboard' : 'parent.dashboard')} className="group inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"><span aria-hidden="true">←</span><span>Retour au tableau de bord</span></Link>}</div>}</div></header>}{children}
        </div>
    </div>;
}
