import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, UserPlus } from 'lucide-react';
import BackButton from '@/Components/BackButton';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    registration_number: string;
    status: string;
    department?: { name: string; faculty?: { name: string } };
    enrollments?: Array<{ academic_year?: { name: string }; program?: { name: string } }>;
}
interface Option { id: number | string; name: string; faculty_id?: number; department_id?: number }
interface Paginator<T> { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }> }
interface Props {
    students: Paginator<Student>;
    faculties: Option[];
    departments: Option[];
    academicYears: Option[];
    programs: Option[];
    filters: Record<string, string | undefined>;
}

export default function StudentsIndex({ students, faculties, departments, programs, academicYears, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const applyFilter = (key: string, value: string) => {
        const params: Record<string, string | undefined> = { ...filters, search, [key]: value || undefined };
        if (key === 'faculty_id') {
            delete params.department_id;
            delete params.program_id;
        }
        if (key === 'department_id') delete params.program_id;
        Object.keys(params).forEach((name) => params[name] === undefined && delete params[name]);
        router.get(route('admin.students.index'), params, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Étudiants" />
            <main className="mx-auto min-h-screen max-w-7xl space-y-6 bg-slate-50 p-6">
                <BackButton href={route('admin.dashboard')} label="Retour au tableau de bord" />
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-slate-800">Étudiants</h1><p className="text-sm text-slate-500">Rechercher et filtrer les inscriptions.</p></div>
                    <Link href={route('admin.students.create')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><UserPlus className="h-4 w-4" />Nouvelle inscription</Link>
                </header>
                <form onSubmit={(event) => { event.preventDefault(); applyFilter('search', search); }} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-7">
                    <label className="relative md:col-span-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, e-mail ou matricule" className="w-full rounded-lg border-slate-300 pl-9" /></label>
                    <select value={filters.faculty_id ?? ''} onChange={(e) => applyFilter('faculty_id', e.target.value)} className="rounded-lg border-slate-300"><option value="">Toutes les facultés</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <select value={filters.department_id ?? ''} onChange={(e) => applyFilter('department_id', e.target.value)} className="rounded-lg border-slate-300"><option value="">Tous les départements</option>{departments.filter((item) => !filters.faculty_id || String(item.faculty_id) === filters.faculty_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <select value={filters.program_id ?? ''} onChange={(e) => applyFilter('program_id', e.target.value)} className="rounded-lg border-slate-300"><option value="">Toutes les filières</option>{programs.filter((item) => !filters.department_id || String(item.department_id) === filters.department_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <select value={filters.academic_year_id ?? ''} onChange={(e) => applyFilter('academic_year_id', e.target.value)} className="rounded-lg border-slate-300"><option value="">Toutes les années</option>{academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <select value={filters.status ?? ''} onChange={(e) => applyFilter('status', e.target.value)} className="rounded-lg border-slate-300"><option value="">Tous les statuts</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="graduated">Diplômé</option></select>
                </form>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="p-4">Étudiant</th><th className="p-4">Matricule</th><th className="p-4">Département</th><th className="p-4">Filière</th><th className="p-4">Année</th><th className="p-4">Statut</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {students.data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucun étudiant trouvé.</td></tr> : students.data.map((student) => <tr key={student.id} className="hover:bg-slate-50"><td className="p-4"><Link className="font-medium text-blue-700 hover:underline" href={route('admin.students.show', student.id)}>{student.first_name} {student.last_name}</Link><div className="text-xs text-slate-500">{student.email}</div></td><td className="p-4 font-mono text-xs">{student.registration_number}</td><td className="p-4">{student.department?.name ?? '—'}<div className="text-xs text-slate-500">{student.department?.faculty?.name}</div></td><td className="p-4">{student.enrollments?.[0]?.program?.name ?? '—'}</td><td className="p-4">{student.enrollments?.[0]?.academic_year?.name ?? '—'}</td><td className="p-4"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{student.status}</span></td></tr>)}
                    </tbody></table></div>
                    <nav className="flex flex-wrap gap-2 border-t p-4" aria-label="Pagination">{students.links.map((link, index) => <button key={index} disabled={!link.url} onClick={() => link.url && router.visit(link.url)} className={`rounded border px-3 py-1 text-sm disabled:opacity-40 ${link.active ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>
                </div>
            </main>
        </>
    );
}
