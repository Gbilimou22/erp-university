import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Building2,
    GraduationCap,
    Users,
    UserCheck,
    Folder,
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
    name?: string;
}

interface StudentEnrollment {
    faculty?: {
        name: string;
    };
}

interface Student {
    id: string | number;
    first_name?: string;
    last_name?: string;
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

    const registrationChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0 },
            },
        },
    };

    const statusLabels: Record<string, string> = {
        active: 'Actif',
        pending: 'En attente',
        suspended: 'Suspendu',
        graduated: 'Diplômé',
    };

    return (
        <>
            <Head title="Tableau de Bord Administration" />

            <AuthenticatedLayout
                header={
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Administration</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Tableau de bord</h1>
                            <p className="mt-1 text-sm text-slate-500">Vue d’ensemble des données universitaires.</p>
                        </div>
                        <Link
                            href={route('admin.academic.index')}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                        >
                            <Building2 className="h-4 w-4" aria-hidden="true" />
                            Structure académique
                        </Link>
                    </div>
                }
            >
                <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-6">

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
                            <p className="mt-1 text-xs text-slate-400">
                                Structure académique
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
                            {monthlyRegistrations.some((month) => month.count > 0) ? (
                                <Line data={registrationChartData} options={registrationChartOptions} />
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
                                    recentStudents.map((student: Student) => {
                                        const status = student.status?.toLowerCase() ?? 'active';

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 font-mono font-medium text-slate-700">
                                                    {student.registration_number || 'N/A'}
                                                </td>
                                                <td className="p-3 font-semibold text-slate-800">
                                                    {[student.first_name, student.last_name].filter(Boolean).join(' ')
                                                        || student.user?.name
                                                        || 'Nom non renseigné'}
                                                </td>
                                                <td className="p-3 text-slate-600">
                                                    {student.enrollments?.[0]?.faculty?.name || 'Non affecté'}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {statusLabels[status] ?? student.status ?? 'Statut inconnu'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                </div>
            </AuthenticatedLayout>
        </>
    );
}
