import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    BookOpen,
    LayoutGrid,
    List,
    X,
} from 'lucide-react';

export interface TimetableEntry {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    type: 'CM' | 'TD' | 'TP' | 'Exam' | string;
    // Support pour les deux structures de données (imbriquée ou plate)
    subject_name?: string;
    subject_code?: string;
    teacher_name?: string;
    room_name?: string;
    building?: string;
    subject?: { name: string; code: string };
    teacher?: { name: string; title?: string };
    room?: { name: string; building?: string };
}

interface Props {
    entries: TimetableEntry[];
    program?: string;
    level?: string;
    academicYear?: string;
    classGroup?: { code: string; name: string; level_code: string } | null;
    currentWeek?: number;
    currentYear?: number;
    weekDates?: { start: string; end: string };
}

const DAYS = [
    { id: 1, name: 'Lundi' },
    { id: 2, name: 'Mardi' },
    { id: 3, name: 'Mercredi' },
    { id: 4, name: 'Jeudi' },
    { id: 5, name: 'Vendredi' },
    { id: 6, name: 'Samedi' },
];

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
];

const TYPE_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    CM: { bg: 'bg-blue-50 hover:bg-blue-100/80', border: 'border-l-4 border-blue-500', badge: 'bg-blue-100 text-blue-800', text: 'text-blue-900' },
    TD: { bg: 'bg-emerald-50 hover:bg-emerald-100/80', border: 'border-l-4 border-emerald-500', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900' },
    TP: { bg: 'bg-amber-50 hover:bg-amber-100/80', border: 'border-l-4 border-amber-500', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900' },
    Exam: { bg: 'bg-rose-50 hover:bg-rose-100/80', border: 'border-l-4 border-rose-500', badge: 'bg-rose-100 text-rose-800', text: 'text-rose-900' },
};

// Helper pour uniformiser l'extraction des champs
const getEntryDetails = (entry: TimetableEntry) => {
    return {
        subjectName: entry.subject_name || entry.subject?.name || 'Matière inconnue',
        subjectCode: entry.subject_code || entry.subject?.code || '',
        teacherName: entry.teacher_name || entry.teacher?.name || 'Enseignant non assigné',
        roomName: entry.room_name || entry.room?.name || 'Salle non définie',
        buildingName: entry.building || entry.room?.building || '',
    };
};

export default function StudentTimetable({
    entries = [],
    program,
    level,
    academicYear,
    classGroup,
    currentWeek = 1,
    currentYear = new Date().getFullYear(),
    weekDates
}: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

    const changeWeek = (offset: number) => {
        let newWeek = currentWeek + offset;
        let newYear = currentYear;

        if (newWeek < 1) {
            newWeek = 52;
            newYear -= 1;
        } else if (newWeek > 52) {
            newWeek = 1;
            newYear += 1;
        }

        router.get(route('student.timetable'), { week: newWeek, year: newYear }, { preserveState: true });
    };

    const getTypeStyle = (type: string) => {
        return TYPE_STYLES[type] || {
            bg: 'bg-slate-50 hover:bg-slate-100',
            border: 'border-l-4 border-slate-400',
            badge: 'bg-slate-100 text-slate-800',
            text: 'text-slate-900'
        };
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-slate-800">Emploi du Temps</h2>
            }
        >
            <Head title="Mon Emploi du Temps" />
            <BackButton href={route('student.dashboard')} label="Retour au tableau de bord" />

            <div className="min-h-screen p-4 space-y-6 bg-slate-50 sm:p-6">
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950 to-emerald-800 p-6 text-white shadow-sm"><div><p className="text-sm text-emerald-200">Organisation de la semaine</p><h2 className="mt-2 text-2xl font-bold">Mon emploi du temps</h2><p className="mt-1 text-sm text-emerald-100">Consultez vos cours, salles et enseignants.</p></div><CalendarIcon className="h-8 w-8 text-emerald-100" /></section>
                {/* En-tête de la page */}
                <div className="flex flex-col gap-4 p-5 bg-white border shadow-sm md:flex-row md:items-center md:justify-between rounded-2xl border-slate-200">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-600 uppercase">
                            <BookOpen className="w-4 h-4" />
                            <span>{program ?? 'Filière non spécifiée'} — Niveau {level ?? 'N/A'}{classGroup ? ` · Groupe ${classGroup.code}` : ''}</span>
                        </div>
                        <h1 className="mt-1 text-xl font-bold text-slate-800">Planning des Cours</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Année académique : {academicYear ?? 'En cours'}</p>
                    </div>

                    {/* Navigation par semaine */}
                    <div className="flex items-center justify-between gap-3 p-2 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => changeWeek(-1)}
                            className="p-1.5 rounded-lg bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="px-3 text-center">
                            <div className="text-sm font-bold text-slate-800">Semaine {currentWeek}</div>
                            {weekDates && (
                                <div className="text-[11px] text-slate-500">{weekDates.start} - {weekDates.end}</div>
                            )}
                        </div>

                        <button
                            onClick={() => changeWeek(1)}
                            className="p-1.5 rounded-lg bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Bascule Vue Grille / Liste */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Grille</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <List className="w-4 h-4" />
                            <span>Liste</span>
                        </button>
                    </div>
                </div>

                {/* VUE GRILLE */}
                {viewMode === 'grid' && (
                    <div className="overflow-x-auto bg-white border shadow-sm rounded-2xl border-slate-200">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-7 py-3 text-xs font-semibold text-center border-b border-slate-200 bg-slate-50 text-slate-700">
                                <div className="border-r border-slate-200">Heure</div>
                                {DAYS.map((day) => (
                                    <div key={day.id} className="border-r border-slate-200 last:border-r-0">
                                        {day.name}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 divide-x divide-slate-200">
                                <div className="divide-y divide-slate-100 text-[11px] text-slate-400 font-medium">
                                    {TIME_SLOTS.map((time) => (
                                        <div key={time} className="flex items-start justify-center h-24 pt-1 bg-slate-50/50">
                                            {time}
                                        </div>
                                    ))}
                                </div>

                                {DAYS.map((day) => {
                                    const dayEntries = entries.filter((e) => e.day_of_week === day.id);

                                    return (
                                        <div key={day.id} className="relative divide-y divide-slate-100 bg-white min-h-[500px]">
                                            {dayEntries.length === 0 ? (
                                                <div className="flex items-center justify-center h-full p-4 text-xs italic text-center text-slate-300">
                                                    Aucun cours
                                                </div>
                                            ) : (
                                                dayEntries.map((entry) => {
                                                    const style = getTypeStyle(entry.type);
                                                    const details = getEntryDetails(entry);

                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            onClick={() => setSelectedEntry(entry)}
                                                            className={`p-3 m-1.5 rounded-xl ${style.bg} ${style.border} cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 space-y-1.5`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
                                                                    {entry.type}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                                    {entry.start_time} - {entry.end_time}
                                                                </span>
                                                            </div>

                                                            <div className={`text-xs font-bold leading-tight ${style.text}`}>
                                                                {details.subjectName}
                                                            </div>

                                                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <span className="truncate">{details.roomName}</span>
                                                            </div>

                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <span className="truncate">{details.teacherName}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* VUE LISTE */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none">
                            {DAYS.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDay(day.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                        selectedDay === day.id
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {entries.filter((e) => e.day_of_week === selectedDay).length === 0 ? (
                                <div className="p-8 text-center bg-white border rounded-2xl border-slate-200">
                                    <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm text-slate-500">Aucun cours programmé pour ce jour.</p>
                                </div>
                            ) : (
                                entries
                                    .filter((e) => e.day_of_week === selectedDay)
                                    .map((entry) => {
                                        const style = getTypeStyle(entry.type);
                                        const details = getEntryDetails(entry);

                                        return (
                                            <div
                                                key={entry.id}
                                                onClick={() => setSelectedEntry(entry)}
                                                className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ${style.border} hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge}`}>
                                                            {entry.type}
                                                        </span>
                                                        {details.subjectCode && (
                                                            <span className="text-xs font-semibold text-slate-500">
                                                                {details.subjectCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-base font-bold text-slate-800">{details.subjectName}</h3>
                                                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                                            {details.teacherName}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                            {details.roomName} {details.buildingName && `(${details.buildingName})`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl self-start sm:self-center">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span>{entry.start_time} - {entry.end_time}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL INTERACTIF DE DÉTAILS DE LA SÉANCE */}
                {selectedEntry && (() => {
                    const style = getTypeStyle(selectedEntry.type);
                    const details = getEntryDetails(selectedEntry);

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                            <div className="relative w-full max-w-md p-6 space-y-5 bg-white border shadow-2xl rounded-3xl border-slate-100">
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="absolute p-2 transition rounded-full cursor-pointer top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-start gap-3">
                                    <div className={`p-3 rounded-2xl ${style.badge}`}>
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                                            {selectedEntry.type} {details.subjectCode && `— ${details.subjectCode}`}
                                        </span>
                                        <h3 className="text-lg font-bold leading-tight text-slate-900">
                                            {details.subjectName}
                                        </h3>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-3.5 text-sm">
                                    <div className="flex items-center gap-3 p-3 text-slate-700 bg-slate-50 rounded-2xl">
                                        <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-medium text-slate-400">Horaire</div>
                                            <div className="font-semibold text-slate-800">
                                                {DAYS.find(d => d.id === selectedEntry.day_of_week)?.name} : {selectedEntry.start_time} - {selectedEntry.end_time}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 text-slate-700 bg-slate-50 rounded-2xl">
                                        <User className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-medium text-slate-400">Enseignant / Intervenant</div>
                                            <div className="font-semibold text-slate-800">{details.teacherName}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 text-slate-700 bg-slate-50 rounded-2xl">
                                        <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-medium text-slate-400">Salle & Bâtiment</div>
                                            <div className="font-semibold text-slate-800">
                                                {details.roomName} {details.buildingName ? `— Bâtiment ${details.buildingName}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => setSelectedEntry(null)}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition shadow-sm cursor-pointer"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            </div>
        </AuthenticatedLayout>
    );
}
