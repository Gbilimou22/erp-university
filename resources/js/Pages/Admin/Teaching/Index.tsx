import React from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, BookOpen, Layers3, Plus, Trash2, Pencil, Users } from 'lucide-react';

type Faculty = { id: number; name: string; code: string };
type Subject = { id: number; code: string; name: string; coefficient: string | number };
type CourseUnit = { id: number; faculty_id: number; code: string; name: string; credits: number; faculty: Faculty; subjects: Subject[]; subjects_count: number };

export default function TeachingIndex({ faculties, courseUnits }: { faculties: Faculty[]; courseUnits: CourseUnit[] }) {
    const ue = useForm({ faculty_id: '', code: '', name: '', credits: 3 });
    const ecue = useForm({ course_unit_id: '', code: '', name: '', coefficient: 1 });
    const [editingUe, setEditingUe] = React.useState<number | null>(null);
    const [editingEcue, setEditingEcue] = React.useState<number | null>(null);

    const editUe = (unit: CourseUnit) => {
        setEditingUe(unit.id);
        ue.setData({ faculty_id: String(unit.faculty_id), code: unit.code, name: unit.name, credits: unit.credits });
    };
    const editEcue = (subject: Subject, unitId: number) => {
        setEditingEcue(subject.id);
        ecue.setData({ course_unit_id: String(unitId), code: subject.code, name: subject.name, coefficient: Number(subject.coefficient) });
    };
    const resetUe = () => { ue.reset(); ue.clearErrors(); setEditingUe(null); };
    const resetEcue = () => { ecue.reset(); ecue.clearErrors(); setEditingEcue(null); };

    const createUe = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: () => resetUe() };
        if (editingUe) ue.put(route('admin.teaching.course-units.update', editingUe), options);
        else ue.post(route('admin.teaching.course-units.store'), options);
    };
    const createEcue = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: () => resetEcue() };
        if (editingEcue) ecue.put(route('admin.teaching.subjects.update', editingEcue), options);
        else ecue.post(route('admin.teaching.subjects.store'), options);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-slate-800">Enseignements</h2>}>
            <Head title="Unités d’enseignement" />
            <main className="min-h-screen space-y-6 bg-slate-50 p-6">
                <header>
                    <Link href={route('admin.teachers.index')} className="mb-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Gestion des enseignants</Link>
                    <h1 className="text-2xl font-bold text-slate-800">Unités d’enseignement et matières</h1>
                    <p className="mt-1 text-sm text-slate-500">Gérez les UE, leurs crédits et leurs éléments constitutifs (ECUE).</p>
                    <Link href={route('admin.teaching.assignments')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"><Users className="h-4 w-4" />Gérer les affectations</Link>
                </header>

                <div className="grid gap-5 lg:grid-cols-2">
                    <form onSubmit={createUe} className="space-y-3 rounded-xl border bg-white p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800">{editingUe ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingUe ? 'Modifier une UE' : 'Créer une UE'}</h2>
                        <select required value={ue.data.faculty_id} onChange={(e) => ue.setData('faculty_id', e.target.value)} className="w-full rounded-lg border-slate-300">
                            <option value="">Choisir une faculté</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                        </select>
                        {ue.errors.faculty_id && <p className="text-sm text-red-600">{ue.errors.faculty_id}</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input required maxLength={30} placeholder="Code UE" value={ue.data.code} onChange={(e) => ue.setData('code', e.target.value)} className="rounded-lg border-slate-300" />
                            <input required min={1} max={60} type="number" placeholder="Crédits" value={ue.data.credits} onChange={(e) => ue.setData('credits', Number(e.target.value))} className="rounded-lg border-slate-300" />
                        </div>
                        {ue.errors.code && <p className="text-sm text-red-600">{ue.errors.code}</p>}
                        <input required maxLength={150} placeholder="Nom de l’unité d’enseignement" value={ue.data.name} onChange={(e) => ue.setData('name', e.target.value)} className="w-full rounded-lg border-slate-300" />
                        {ue.errors.name && <p className="text-sm text-red-600">{ue.errors.name}</p>}
                        <div className="flex gap-2"><button disabled={ue.processing || faculties.length === 0} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{editingUe ? 'Enregistrer les changements' : 'Créer l’UE'}</button>{editingUe && <button type="button" onClick={resetUe} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>}</div>
                    </form>

                    <form id="ecue-form" onSubmit={createEcue} className="space-y-3 rounded-xl border bg-white p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800">{editingEcue ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingEcue ? 'Modifier une matière (ECUE)' : 'Créer une matière (ECUE)'}</h2>
                        <select required value={ecue.data.course_unit_id} onChange={(e) => ecue.setData('course_unit_id', e.target.value)} className="w-full rounded-lg border-slate-300">
                            <option value="">Rattacher à une UE</option>{courseUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.code} — {unit.name}</option>)}
                        </select>
                        {ecue.errors.course_unit_id && <p className="text-sm text-red-600">{ecue.errors.course_unit_id}</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input required maxLength={30} placeholder="Code ECUE" value={ecue.data.code} onChange={(e) => ecue.setData('code', e.target.value)} className="rounded-lg border-slate-300" />
                            <label className="text-xs font-medium text-slate-600">Coefficient
                                <input required min="0.01" max="99.99" step="0.01" type="number" value={ecue.data.coefficient} onChange={(e) => ecue.setData('coefficient', Number(e.target.value))} className="mt-1 w-full rounded-lg border-slate-300" />
                            </label>
                        </div>
                        {ecue.errors.code && <p className="text-sm text-red-600">{ecue.errors.code}</p>}
                        <input required maxLength={150} placeholder="Nom de la matière" value={ecue.data.name} onChange={(e) => ecue.setData('name', e.target.value)} className="w-full rounded-lg border-slate-300" />
                        {ecue.errors.name && <p className="text-sm text-red-600">{ecue.errors.name}</p>}
                        <div className="flex gap-2"><button disabled={ecue.processing || courseUnits.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{editingEcue ? 'Enregistrer les changements' : 'Créer l’ECUE'}</button>{editingEcue && <button type="button" onClick={resetEcue} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>}</div>
                    </form>
                </div>

                {Object.values(ue.errors).concat(Object.values(ecue.errors)).filter(Boolean).length > 0 && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{Object.values(ue.errors).concat(Object.values(ecue.errors)).filter(Boolean).join(' ')}</div>}

                <section className="space-y-4">
                    {courseUnits.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Aucune UE. Créez d’abord une unité d’enseignement.</div> : courseUnits.map((unit) => (
                        <article key={unit.id} className="overflow-hidden rounded-xl border bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
                                <div className="flex items-center gap-3"><Layers3 className="h-5 w-5 text-indigo-600" /><div><h2 className="font-semibold text-slate-800">{unit.name}</h2><p className="text-xs text-slate-500">{unit.code} · {unit.credits} crédits · {unit.faculty?.name}</p></div></div>
                                <div className="flex flex-wrap gap-1"><button type="button" onClick={() => { resetEcue(); ecue.setData('course_unit_id', String(unit.id)); document.getElementById('ecue-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"><Plus className="h-4 w-4" />Ajouter une matière</button><button type="button" onClick={() => editUe(unit)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"><Pencil className="h-4 w-4" />Modifier</button><button type="button" onClick={() => { if (confirm(`Supprimer l’UE ${unit.code} ?`)) router.delete(route('admin.teaching.course-units.destroy', unit.id)); }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Supprimer</button></div>
                            </div>
                            <div className="divide-y">
                                {unit.subjects.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucune matière rattachée.</p> : unit.subjects.map((subject) => <div key={subject.id} className="flex items-center justify-between gap-3 p-4"><div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-blue-600" /><div><p className="text-sm font-medium text-slate-800">{subject.name}</p><p className="text-xs text-slate-500">{subject.code} · coefficient {subject.coefficient}</p></div></div><div className="flex gap-1"><button type="button" onClick={() => editEcue(subject, unit.id)} className="rounded p-2 text-slate-600 hover:bg-slate-100" aria-label={`Modifier ${subject.name}`}><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`Supprimer ${subject.name}`} onClick={() => { if (confirm(`Supprimer la matière ${subject.name} ?`)) router.delete(route('admin.teaching.subjects.destroy', subject.id)); }} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>)}
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </AuthenticatedLayout>
    );
}
