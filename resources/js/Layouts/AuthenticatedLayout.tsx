import UniversityLogo from '@/Components/UniversityLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import {
    BookOpen,
    Building2,
    CalendarDays,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    Users,
    UsersRound,
} from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const role = (user.role ?? 'admin').toLowerCase();
    const isAdmin = role === 'admin';
    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';
    const isParent = role === 'parent';

    const navItems = [
        ...(isAdmin ? [
            { label: 'Tableau de bord', href: route('dashboard'), active: route().current('dashboard') || route().current('admin.dashboard'), icon: LayoutDashboard },
            { label: 'Structure académique', href: route('admin.academic.index'), active: route().current('admin.academic.*'), icon: Building2 },
            { label: 'Étudiants', href: route('admin.students.index'), active: route().current('admin.students.*'), icon: Users },
            { label: 'Enseignants', href: route('admin.teachers.index'), active: route().current('admin.teachers.*') || route().current('admin.teaching.*'), icon: GraduationCap },
        ] : []),
        ...(isStudent ? [
            { label: 'Tableau de bord', href: route('student.dashboard'), active: route().current('student.dashboard'), icon: LayoutDashboard },
            { label: 'Mon emploi du temps', href: route('student.timetable'), active: route().current('student.timetable'), icon: CalendarDays },
            { label: 'Mon groupe', href: route('student.group'), active: route().current('student.group'), icon: UsersRound },
        ] : []),
        ...(isTeacher ? [
            { label: 'Tableau de bord', href: route('teacher.dashboard'), active: route().current('teacher.dashboard'), icon: LayoutDashboard },
            { label: 'Mes matières', href: route('teacher.dashboard'), active: route().current('teacher.dashboard'), icon: BookOpen },
            { label: 'Mes groupes', href: route('teacher.dashboard'), active: route().current('teacher.dashboard'), icon: UsersRound },
        ] : []),
        ...(isParent ? [
            { label: 'Tableau de bord', href: route('parent.dashboard'), active: route().current('parent.dashboard'), icon: LayoutDashboard },
            { label: 'Suivi élève', href: route('parent.dashboard'), active: route().current('parent.dashboard'), icon: ShieldCheck },
            { label: 'Documents', href: route('parent.dashboard'), active: route().current('parent.dashboard'), icon: BookOpen },
        ] : []),
    ];

    return (
        <div className="min-h-screen bg-slate-100 lg:flex">
            <aside className="w-full bg-slate-900 text-slate-100 lg:w-72 lg:min-h-screen lg:shrink-0">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-5 lg:justify-start">
                    <Link href={route('dashboard')} className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/10 p-2">
                            <UniversityLogo />
                        </div>
                        <div className="leading-tight">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ERP</p>
                            <p className="text-sm font-semibold text-white">Université</p>
                        </div>
                    </Link>
                </div>

                <nav className="space-y-1 px-3 py-5">
                    {navItems.map(({ label, href, active, icon: Icon }) => (
                        <Link
                            key={label}
                            href={href}
                            className={[
                                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                            ].join(' ')}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto border-t border-slate-800 p-4">
                    <div className="rounded-xl bg-slate-800/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Connecté</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                            <div>
                                <p className="font-medium text-white">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-300">
                                <UsersRound className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <Link
                            href={route('profile.edit')}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Profil
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                        >
                            <LogOut className="h-4 w-4" />
                            Déconnexion
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                {header && (
                    <header className="border-b border-slate-200 bg-white">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
