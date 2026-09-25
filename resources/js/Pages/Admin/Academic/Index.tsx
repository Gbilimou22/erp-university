import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Building2, Landmark, Plus, Folder, X, Loader2, Edit2, Trash2, MapPin } from 'lucide-react';

interface Department {
    id: number | string;
    code: string;
    name: string;
    faculty_id?: number | string;
    programs?: Program[];
}

interface Program {
    id: string;
    code: string;
    name: string;
    degree_level: string;
    duration_years: number;
}

interface Faculty {
    id: number | string;
    code: string;
    name: string;
    campus_id?: number | string;
    departments?: Department[];
}

interface Campus {
    id: number | string;
    code: string;
    name: string;
    address?: string;
    faculties?: Faculty[];
}

interface Props {
    campuses?: Campus[];
}

export default function Index({ campuses = [] }: Props) {
    // États pour l'ouverture des modales
    const [showCampusModal, setShowCampusModal] = useState(false);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [showProgramModal, setShowProgramModal] = useState(false);

    // États pour l'édition
    const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

    // Formulaires Inertia
    const campusForm = useForm({
        code: '',
        name: '',
        address: '',
    });

    const facultyForm = useForm({
        campus_id: '' as number | string,
        code: '',
        name: '',
    });

    const departmentForm = useForm({
        faculty_id: '' as number | string,
        code: '',
        name: '',
    });

    const programForm = useForm({
        department_id: '' as number | string,
        code: '',
        name: '',
        degree_level: 'LICENCE',
        duration_years: 3,
    });

    // Fermeture & Reset des modales
    const closeCampusModal = () => {
        campusForm.reset();
        campusForm.clearErrors();
        setEditingCampus(null);
        setShowCampusModal(false);
    };

    const closeFacultyModal = () => {
        facultyForm.reset();
        facultyForm.clearErrors();
        setEditingFaculty(null);
        setShowFacultyModal(false);
    };

    const closeDepartmentModal = () => {
        departmentForm.reset();
        departmentForm.clearErrors();
        setEditingDepartment(null);
        setShowDepartmentModal(false);
    };

    const closeProgramModal = () => {
        programForm.reset();
        programForm.clearErrors();
        setSelectedDepartment(null);
        setShowProgramModal(false);
    };

    // Préparation pour l'édition
    const openEditCampus = (campus: Campus) => {
        setEditingCampus(campus);
        campusForm.setData({
            code: campus.code,
            name: campus.name,
            address: campus.address || '',
        });
        setShowCampusModal(true);
    };

    const openEditFaculty = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        facultyForm.setData({
            campus_id: faculty.campus_id || '',
            code: faculty.code,
            name: faculty.name,
        });
        setShowFacultyModal(true);
    };

    const openEditDepartment = (dept: Department) => {
        setEditingDepartment(dept);
        departmentForm.setData({
            faculty_id: dept.faculty_id || '',
            code: dept.code,
            name: dept.name,
        });
        setShowDepartmentModal(true);
    };

    // Handlers de soumission
    const handleCampusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCampus) {
            campusForm.put(route('admin.academic.campuses.update', editingCampus.id), {
                onSuccess: () => closeCampusModal(),
            });
        } else {
            campusForm.post(route('admin.academic.campuses.store'), {
                onSuccess: () => closeCampusModal(),
            });
        }
    };

    const handleFacultySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaculty) {
            facultyForm.put(route('admin.academic.faculties.update', editingFaculty.id), {
                onSuccess: () => closeFacultyModal(),
            });
        } else {
            facultyForm.post(route('admin.academic.faculties.store'), {
                onSuccess: () => closeFacultyModal(),
            });
        }
    };

    const handleDepartmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDepartment) {
            departmentForm.put(route('admin.academic.departments.update', editingDepartment.id), {
                onSuccess: () => closeDepartmentModal(),
            });
        } else {
            departmentForm.post(route('admin.academic.departments.store'), {
                onSuccess: () => closeDepartmentModal(),
            });
        }
    };

    const handleProgramSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        programForm.post(route('admin.academic.programs.store'), { onSuccess: closeProgramModal });
    };

    // Handlers de suppression
    const handleDeleteCampus = (id: number | string) => {
        if (confirm('Voulez-vous vraiment supprimer ce campus et toute sa structure associée ?')) {
            router.delete(route('admin.academic.campuses.destroy', id));
        }
    };

    const handleDeleteFaculty = (id: number | string) => {
        if (confirm('Voulez-vous vraiment supprimer cette faculté ?')) {
            router.delete(route('admin.academic.faculties.destroy', id));
        }
    };

    const handleDeleteDepartment = (id: number | string) => {
        if (confirm('Voulez-vous vraiment supprimer ce département ?')) {
            router.delete(route('admin.academic.departments.destroy', id));
        }
    };

    const handleDeleteProgram = (id: string) => {
        if (confirm('Supprimer cette filière ?')) router.delete(route('admin.academic.programs.destroy', id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-slate-800">Structure Académique</h2>}
        >
            <Head title="Structure Académique" />

            <div className="min-h-screen p-6 space-y-6 bg-slate-50">
                {/* En-tête principal */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Structure Académique</h1>
                        <p className="text-sm text-slate-500">Configuration et organisation hiérarchique de l'université</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCampus(null);
                                campusForm.reset();
                                setShowCampusModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" /> Ajouter un Campus
                        </button>
                    </div>
                </div>

                {/* Arborescence Visuelle des Campus */}
                {campuses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campuses.map((campus) => (
                            <div key={campus.id} className="flex flex-col justify-between overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
                                <div>
                                    {/* Entête Campus */}
                                    <div className="flex items-center justify-between p-4 text-white bg-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="flex-shrink-0 w-5 h-5 text-blue-400" />
                                            <div>
                                                <h3 className="text-base font-bold line-clamp-1">{campus.name}</h3>
                                                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                                                    <span>{campus.code}</span>
                                                    {campus.address && (
                                                        <span className="flex items-center gap-0.5 text-slate-400 font-sans">
                                                            <MapPin className="w-3 h-3" /> {campus.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingFaculty(null);
                                                    facultyForm.reset();
                                                    facultyForm.setData('campus_id', campus.id);
                                                    setShowFacultyModal(true);
                                                }}
                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                                                title="Ajouter une faculté"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditCampus(campus)}
                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                                                title="Modifier le campus"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCampus(campus.id)}
                                                className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition-colors"
                                                title="Supprimer le campus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Liste des Facultés */}
                                    <div className="p-4 space-y-3">
                                        {campus.faculties && campus.faculties.length > 0 ? (
                                            campus.faculties.map((faculty) => (
                                                <div key={faculty.id} className="p-3 space-y-2 border rounded-lg border-slate-100 bg-slate-50">
                                                    <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                                        <span className="flex items-center gap-2">
                                                            <Landmark className="flex-shrink-0 w-4 h-4 text-indigo-600" />
                                                            {faculty.name}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingDepartment(null);
                                                                    departmentForm.reset();
                                                                    departmentForm.setData('faculty_id', faculty.id);
                                                                    setShowDepartmentModal(true);
                                                                }}
                                                                className="p-1 transition-colors rounded hover:bg-slate-200 text-slate-600"
                                                                title="Ajouter un département"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditFaculty(faculty)}
                                                                className="p-1 transition-colors rounded hover:bg-slate-200 text-slate-600"
                                                                title="Modifier la faculté"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteFaculty(faculty.id)}
                                                                className="p-1 text-red-500 transition-colors rounded hover:bg-red-100"
                                                                title="Supprimer la faculté"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Liste des Départements */}
                                                    <div className="pl-4 ml-2 space-y-1 border-l-2 border-indigo-100">
                                                        {faculty.departments && faculty.departments.length > 0 ? (
                                                            faculty.departments.map((dept) => (
                                                                <div key={dept.id} className="py-2 text-xs text-slate-600 group">
                                                                  <div className="flex items-center justify-between">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                                        {dept.name}
                                                                        <span className="text-[10px] font-mono text-slate-400">({dept.code})</span>
                                                                    </span>
                                                                    <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openEditDepartment(dept)}
                                                                            className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                                                                            title="Modifier"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteDepartment(dept.id)}
                                                                            className="p-0.5 hover:bg-red-100 rounded text-red-500"
                                                                            title="Supprimer"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                  </div>
                                                                  <div className="ml-5 mt-1 space-y-1">
                                                                    {(dept.programs || []).map((program) => (
                                                                        <div key={program.id} className="flex items-center justify-between rounded bg-white px-2 py-1">
                                                                            <span>{program.name} <span className="font-mono text-slate-400">({program.code})</span> · {program.degree_level}</span>
                                                                            <button type="button" onClick={() => handleDeleteProgram(program.id)} className="text-red-500" aria-label={`Supprimer ${program.name}`}><Trash2 className="h-3 w-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button type="button" onClick={() => { setSelectedDepartment(dept); programForm.reset(); programForm.setData('department_id', dept.id); setShowProgramModal(true); }} className="font-medium text-indigo-600 hover:underline">+ Ajouter une filière</button>
                                                                  </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic py-0.5">Aucun département</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="py-4 text-xs text-center text-slate-400">Aucune faculté enregistrée sur ce campus.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-700">Aucun campus configuré</p>
                        <p className="mt-1 text-xs text-slate-400">Commencez par ajouter un campus pour structurer votre université.</p>
                    </div>
                )}
            </div>

            {/* Modal Campus (Création & Édition) */}
            {showCampusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 space-y-4 bg-white border shadow-2xl rounded-xl border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingCampus ? 'Modifier le Campus' : 'Ajouter un nouveau Campus'}
                            </h2>
                            <button type="button" onClick={closeCampusModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCampusSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Code du Campus</label>
                                <input
                                    type="text"
                                    placeholder="Ex: CMP-01"
                                    value={campusForm.data.code}
                                    onChange={(e) => campusForm.setData('code', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {campusForm.errors.code && (
                                    <span className="block mt-1 text-xs text-red-500">{campusForm.errors.code}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Nom du Campus</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Campus Central"
                                    value={campusForm.data.name}
                                    onChange={(e) => campusForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {campusForm.errors.name && (
                                    <span className="block mt-1 text-xs text-red-500">{campusForm.errors.name}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Adresse (Optionnel)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Conakry, Guinée"
                                    value={campusForm.data.address}
                                    onChange={(e) => campusForm.setData('address', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {campusForm.errors.address && (
                                    <span className="block mt-1 text-xs text-red-500">{campusForm.errors.address}</span>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeCampusModal} className="px-4 py-2 text-sm border rounded-lg border-slate-300 text-slate-600 hover:bg-slate-50">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={campusForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {campusForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingCampus ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Faculté (Création & Édition) */}
            {showFacultyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 space-y-4 bg-white border shadow-2xl rounded-xl border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingFaculty ? 'Modifier la Faculté' : 'Ajouter une Faculté'}
                            </h2>
                            <button type="button" onClick={closeFacultyModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleFacultySubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Campus Rattaché</label>
                                <select
                                    value={facultyForm.data.campus_id}
                                    onChange={(e) => facultyForm.setData('campus_id', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Sélectionner un campus</option>
                                    {campuses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {facultyForm.errors.campus_id && (
                                    <span className="block mt-1 text-xs text-red-500">{facultyForm.errors.campus_id}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Code Faculté</label>
                                <input
                                    type="text"
                                    placeholder="Ex: FST"
                                    value={facultyForm.data.code}
                                    onChange={(e) => facultyForm.setData('code', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {facultyForm.errors.code && (
                                    <span className="block mt-1 text-xs text-red-500">{facultyForm.errors.code}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Nom de la Faculté</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Faculté des Sciences et Techniques"
                                    value={facultyForm.data.name}
                                    onChange={(e) => facultyForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {facultyForm.errors.name && (
                                    <span className="block mt-1 text-xs text-red-500">{facultyForm.errors.name}</span>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeFacultyModal} className="px-4 py-2 text-sm border rounded-lg border-slate-300 text-slate-600 hover:bg-slate-50">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={facultyForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {facultyForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingFaculty ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Département (Création & Édition) */}
            {showDepartmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 space-y-4 bg-white border shadow-2xl rounded-xl border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingDepartment ? 'Modifier le Département' : 'Ajouter un Département'}
                            </h2>
                            <button type="button" onClick={closeDepartmentModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Faculté Rattachée</label>
                                <select
                                    value={departmentForm.data.faculty_id}
                                    onChange={(e) => departmentForm.setData('faculty_id', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Sélectionner une faculté</option>
                                    {campuses.flatMap((c) =>
                                        (c.faculties || []).map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} ({c.name})
                                            </option>
                                        ))
                                    )}
                                </select>
                                {departmentForm.errors.faculty_id && (
                                    <span className="block mt-1 text-xs text-red-500">{departmentForm.errors.faculty_id}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Code Département</label>
                                <input
                                    type="text"
                                    placeholder="Ex: INFO"
                                    value={departmentForm.data.code}
                                    onChange={(e) => departmentForm.setData('code', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {departmentForm.errors.code && (
                                    <span className="block mt-1 text-xs text-red-500">{departmentForm.errors.code}</span>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold uppercase text-slate-600">Nom du Département</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Informatique"
                                    value={departmentForm.data.name}
                                    onChange={(e) => departmentForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                                {departmentForm.errors.name && (
                                    <span className="block mt-1 text-xs text-red-500">{departmentForm.errors.name}</span>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeDepartmentModal} className="px-4 py-2 text-sm border rounded-lg border-slate-300 text-slate-600 hover:bg-slate-50">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={departmentForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {departmentForm.processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingDepartment ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showProgramModal && selectedDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div><h2 className="text-lg font-bold text-slate-800">Nouvelle filière</h2><p className="text-xs text-slate-500">Département : {selectedDepartment.name}</p></div>
                            <button type="button" onClick={closeProgramModal} className="text-slate-400" aria-label="Fermer"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleProgramSubmit} className="space-y-3">
                            <label className="block text-xs font-semibold uppercase text-slate-600">Code
                                <input required maxLength={20} value={programForm.data.code} onChange={(e) => programForm.setData('code', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                                {programForm.errors.code && <span className="text-red-600">{programForm.errors.code}</span>}
                            </label>
                            <label className="block text-xs font-semibold uppercase text-slate-600">Nom
                                <input required value={programForm.data.name} onChange={(e) => programForm.setData('name', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300" />
                                {programForm.errors.name && <span className="text-red-600">{programForm.errors.name}</span>}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block text-xs font-semibold uppercase text-slate-600">Diplôme
                                    <select value={programForm.data.degree_level} onChange={(e) => programForm.setData('degree_level', e.target.value)} className="mt-1 w-full rounded-lg border-slate-300">
                                        <option value="LICENCE">Licence</option><option value="MASTER">Master</option><option value="DOCTORAT">Doctorat</option><option value="DUT">DUT</option>
                                    </select>
                                </label>
                                <label className="block text-xs font-semibold uppercase text-slate-600">Durée (années)
                                    <input required type="number" min={1} max={8} value={programForm.data.duration_years} onChange={(e) => programForm.setData('duration_years', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300" />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeProgramModal} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>
                                <button disabled={programForm.processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{programForm.processing ? 'Enregistrement…' : 'Créer la filière'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
