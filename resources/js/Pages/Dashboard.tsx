import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

// 1. Définition des interfaces TypeScript
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

interface DashboardProps {
    stats?: any;
    studentsByFaculty?: FacultyStat[];
    monthlyRegistrations?: MonthlyStat[];
    recentStudents?: Student[];
}

// 2. Application des types dans la signature du composant
export default function Dashboard({
    stats,
    studentsByFaculty = [],
    monthlyRegistrations = [],
    recentStudents = [],
}: DashboardProps) {

    // Utilisation typée des maps
    const facultyLabels = studentsByFaculty.map((f) => f.name);
    const facultyData = studentsByFaculty.map((f) => f.count);

    const monthlyLabels = monthlyRegistrations.map((r) => r.month);
    const monthlyData = monthlyRegistrations.map((r) => r.count);

    return (
        <div>
            {/* ... reste du code ... */}

            {/* Correction du colSpan ligne 215 : utiliser un nombre {4} et non une chaîne "4" */}
            <td colSpan={4} className="p-4 text-center text-slate-400 text-xs">
                Aucun étudiant récent trouvé.
            </td>
        </div>
    );
}

// export default function Dashboard() {
//     return (
//         <AuthenticatedLayout
//             header={
//                 <h2 className="text-xl font-semibold leading-tight text-gray-800">
//                     Dashboard
//                 </h2>
//             }
//         >
//             <Head title="Dashboard" />

//             <div className="py-12">
//                 <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
//                     <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
//                         <div className="p-6 text-gray-900">
//                             You're logged in!
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </AuthenticatedLayout>
//     );
// }
