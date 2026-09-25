import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';

interface AcademicYear {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface Props {
    academicYears: AcademicYear[];
}

export default function Index({ academicYears = [] }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        start_date: '',
        end_date: '',
        is_current: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.academic-years.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleSetCurrent = (id: string) => {
        router.patch(route('admin.academic-years.set-current', id));
    };

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette année académique ?')) {
            router.delete(route('admin.academic-years.destroy', id));
        }
    };

    return (
        <div className="max-w-6xl p-6 mx-auto my-8 bg-white shadow-sm rounded-xl">
            <Head title="Gestion des Années Académiques" />

            <h1 className="mb-6 text-2xl font-bold text-slate-800">
                Gestion des Années Académiques
            </h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Formulaire de création */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <h2 className="mb-4 text-lg font-semibold text-slate-700">
                        Nouvelle Année
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Libellé (ex: 2025-2026)
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full p-2 mt-1 text-sm border rounded-lg focus:ring-blue-500"
                                placeholder="2025-2026"
                                required
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Code
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className="w-full p-2 mt-1 text-sm border rounded-lg focus:ring-blue-500"
                                placeholder="AY-2025-2026"
                                required
                            />
                            {errors.code && <span className="text-xs text-red-500">{errors.code}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Date de début
                            </label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="w-full p-2 mt-1 text-sm border rounded-lg focus:ring-blue-500"
                                required
                            />
                            {errors.start_date && <span className="text-xs text-red-500">{errors.start_date}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className="w-full p-2 mt-1 text-sm border rounded-lg focus:ring-blue-500"
                                required
                            />
                            {errors.end_date && <span className="text-xs text-red-500">{errors.end_date}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_current"
                                checked={data.is_current}
                                onChange={(e) => setData('is_current', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_current" className="text-sm font-medium text-slate-700">
                                Définir comme année courante
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Ajout...' : 'Ajouter l\'année académique'}
                        </button>
                    </form>
                </div>

                {/* Tableau explicatif et listage */}
                <div className="lg:col-span-2 overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 border border-slate-200 rounded-lg">
                        <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                            <tr>
                                <th className="p-3">Libellé</th>
                                <th className="p-3">Code</th>
                                <th className="p-3">Période</th>
                                <th className="p-3">Statut</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {academicYears.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-slate-400">
                                        Aucune année académique enregistrée.
                                    </td>
                                </tr>
                            ) : (
                                academicYears.map((year) => (
                                    <tr key={year.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-800">{year.name}</td>
                                        <td className="p-3">{year.code}</td>
                                        <td className="p-3">{year.start_date} à {year.end_date}</td>
                                        <td className="p-3">
                                            {year.is_current ? (
                                                <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                                                    Courante
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSetCurrent(year.id)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Activer
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleDelete(year.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
