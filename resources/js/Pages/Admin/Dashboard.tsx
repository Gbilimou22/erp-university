import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    GraduationCap,
    Users,
    UserCheck,
    Folder,
    Clock,
    TrendingUp
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Interfaces de typage
interface FacultyStat {
    name: string;
    count: number;
}

interface MonthlyStat {
    month: string;
    count: number;
}

interface StudentUser {
    first_name: string;
    last_name: string;
}

interface StudentEnrollment {
    faculty?: {
        name: string;
    };
}

interface Student {
    id: string | number;
    registration_number?: string;
    status?: string;
    user?: StudentUser;
    enrollments?: StudentEnrollment[];
}

interface StatsData {
    total_students?: number;
    active_students?: number;
    total_users?: number;
    total_faculties?: number;
    total_departments?: number;
    pending_students?: number;
}

interface DashboardProps {
    stats?: StatsData;
    studentsByFaculty?: FacultyStat[];
    monthlyRegistrations?: MonthlyStat[];
    recentStudents?: Student[];
}

export default function Dashboard({
    stats = {},
    studentsByFaculty = [],
    monthlyRegistrations = [],
    recentStudents = [],
}: DashboardProps) {

    // Configuration des données pour Chart.js
    const registrationChartData = {
        labels: monthlyRegistrations.map((r: MonthlyStat) => r.month),
        datasets: [
            {
                label: 'Inscriptions',
                data: monthlyRegistrations.map((r: MonthlyStat) => r.count),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const facultyChartData = {
        labels: studentsByFaculty.map((f: FacultyStat) => f.name),
        datasets: [
            {
                data: studentsByFaculty.map((f: FacultyStat) => f.count),
                backgroundColor: [
                    '#2563eb',
                    '#4f46e5',
                    '#d97706',
                    '#059669',
                    '#dc2626',
                    '#9333ea',
                ],
            },
        ],
    };

    return (
        <>
            <Head title="Tableau de Bord Administration" />

            <div className="min-h-screen p-6 space-y-6 bg-slate-50">
                {/* En-tête avec raccourcis */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord Super Admin</h1>
                        <p className="text-sm text-slate-500">Vue d'ensemble et statistiques de l'université en temps réel</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={route('admin.academic.index')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                        >
                            <Building2 className="w-4 h-4" /> Structure Académique
                        </Link>
                    </div>
                </div>

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center justify-between p-5 bg-white border shadow-sm rounded-xl border-slate-200">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Étudiants Inscrits</p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-800">{stats.total_students ?? 0}</h3>
                            <p className="flex items-center gap-1 mt-1 text-xs font-medium text-emerald-600">
                                <UserCheck className="w-3.5 h-3.5" /> {stats.active_students ?? 0} actifs
                            </p>
                        </div>
                        <div className="p-3 text-blue-600 bg-blue-50 rounded-xl">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white border shadow-sm rounded-xl border-slate-200">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Utilisateurs Système</p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-800">{stats.total_users ?? 0}</h3>
                            <p className="mt-1 text-xs text-slate-400">Tous rôles confondus</p>
                        </div>
                        <div className="p-3 text-indigo-600 bg-indigo-50 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white border shadow-sm rounded-xl border-slate-200">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Facultés / UFR</p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-800">{stats.total_faculties ?? 0}</h3>
                            <p className="mt-1 text-xs text-slate-400">Unités de formation</p>
                        </div>
                        <div className="p-3 text-amber-600 bg-amber-50 rounded-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white border shadow-sm rounded-xl border-slate-200">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Départements</p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-800">{stats.total_departments ?? 0}</h3>
                            <p className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-600">
                                <Clock className="w-3.5 h-3.5" /> {stats.pending_students ?? 0} en attente
                            </p>
                        </div>
                        <div className="p-3 text-emerald-600 bg-emerald-50 rounded-xl">
                            <Folder className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Section Graphiques */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Évolution Inscriptions */}
                    <div className="p-5 space-y-4 bg-white border shadow-sm lg:col-span-2 rounded-xl border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Évolution des Inscriptions
                            </h2>
                        </div>
                        <div className="flex items-center justify-center h-64">
                            {monthlyRegistrations.length > 0 ? (
                                <Line data={registrationChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            ) : (
                                <p className="text-xs text-slate-400">Données insuffisantes pour afficher l'évolution.</p>
                            )}
                        </div>
                    </div>

                    {/* Répartition par Faculté */}
                    <div className="p-5 space-y-4 bg-white border shadow-sm rounded-xl border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Par Faculté</h2>
                        </div>
                        <div className="flex items-center justify-center h-64">
                            {studentsByFaculty.length > 0 ? (
                                <Doughnut data={facultyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            ) : (
                                <p className="text-xs text-slate-400">Aucune faculté enregistrée.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Dernières Inscriptions */}
                <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800">Derniers Étudiants Inscrits</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold uppercase border-b bg-slate-50 border-slate-100 text-slate-500">
                                    <th className="p-3">Matricule</th>
                                    <th className="p-3">Étudiant</th>
                                    <th className="p-3">Faculté</th>
                                    <th className="p-3">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentStudents.length > 0 ? (
                                    recentStudents.map((student: Student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50">
                                            <td className="p-3 font-mono font-medium text-slate-700">
                                                {student.registration_number || 'N/A'}
                                            </td>
                                            <td className="p-3 font-semibold text-slate-800">
                                                {student.user ? `${student.user.first_name} ${student.user.last_name}` : 'N/A'}
                                            </td>
                                            <td className="p-3 text-slate-600">
                                                {student.enrollments?.[0]?.faculty?.name || 'Non affecté'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    student.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {student.status || 'actif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-xs text-center text-slate-400">
                                            Aucun étudiant récent trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
