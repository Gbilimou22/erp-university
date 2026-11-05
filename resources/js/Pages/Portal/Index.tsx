import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import UniversityLogo from '@/Components/UniversityLogo';
import { 
  GraduationCap, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Award, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Stats {
  total_students: number;
  total_faculties: number;
  academic_year: string;
}

interface Props {
  stats: Stats;
}

export default function PortalIndex({ stats }: Props) {
  const platform = usePage().props.platformSettings;
  const platformName = platform?.platform_name || 'ERP UNIVERSITAIRE';

  const portals = [
    {
      title: 'Espace Étudiant',
      description: 'Consultation des notes, emplois du temps, cours en ligne, relevés et réinscriptions.',
      icon: GraduationCap,
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'Portail Académique',
      link: '/login?role=student'
    },
    {
      title: 'Espace Enseignant',
      description: 'Saisie des notes, gestion des présences, cahier de texte et dépôt des supports de cours.',
      icon: UserCheck,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Portail Pédagogique',
      link: '/login?role=teacher'
    },
    {
      title: 'Espace Parent',
      description: 'Suivi de la scolarité, assiduité, notes et règlement en ligne des frais d\'études.',
      icon: Users,
      color: 'bg-amber-600',
      lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Suivi Suggéré',
      link: '/login?role=parent'
    },
    {
      title: 'Administration & RH',
      description: 'Gestion globale des admissions, finances, paies, scolarité et statistiques de l\'université.',
      icon: ShieldCheck,
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badge: 'ERP Core',
      link: '/login?role=admin'
    }
  ];

  return (
    <>
      <Head title="Portail Universitaire Unifié" />
      
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        {/* Navigation Supérieure */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="mx-auto flex min-h-20 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-xl bg-indigo-50 p-1.5"><UniversityLogo compact /></div>
              <div className="min-w-0">
                <h1 className="max-w-full truncate text-base font-bold tracking-tight text-slate-900 sm:text-xl">{platformName}</h1>
                <p className="truncate text-xs font-medium text-slate-500">{platform?.platform_tagline || 'Plateforme Multi-Campus Intégrée'}</p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Année Académique : {stats.academic_year}
              </span>
              <Link
                href="/login"
                className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-indigo-600 sm:px-4"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </header>

        {/* Section Hero */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <div className="mx-auto mb-4 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-center text-xs font-semibold text-indigo-700">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Système de Gestion Universitaire Nouvelle Génération
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Bienvenue sur le Portail Digital
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Sélectionnez votre espace de connexion pour accéder à vos services administratifs, pédagogiques ou financiers.
            </p>
          </div>

          {/* Grille des 4 Portails */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {portals.map((portal, index) => {
              const IconComponent = portal.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`${portal.color} text-white p-3 rounded-xl shadow-lg`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${portal.lightColor}`}>
                        {portal.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {portal.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                      {portal.description}
                    </p>
                  </div>

                  <Link
                    href={portal.link}
                    className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white font-medium text-sm transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    <span>Accéder à l'espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Baromètre / Chiffres Clés */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-xl sm:p-8">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-600 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
              <div className="pt-4 md:pt-0">
                <div className="flex justify-center items-center gap-2 text-indigo-400 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Étudiants Inscrits</span>
                </div>
                <p className="text-3xl font-extrabold text-white">{stats.total_students}</p>
              </div>

              <div className="pt-4 md:pt-0">
                <div className="flex justify-center items-center gap-2 text-indigo-400 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Facultés & UFR</span>
                </div>
                <p className="text-3xl font-extrabold text-white">{stats.total_faculties}</p>
              </div>

              <div className="pt-4 md:pt-0">
                <div className="flex justify-center items-center gap-2 text-indigo-400 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Système Métrique</span>
                </div>
                <p className="text-3xl font-extrabold text-white">LMD Standard</p>
              </div>
            </div>
          </div>
        </main>

        {/* Pied de page */}
        <footer className="mt-8 border-t border-slate-200 bg-white py-6 sm:mt-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <p>© {new Date().getFullYear()} {platformName}. Tous droits réservés.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-end">
              <a href="#" className="hover:text-indigo-600 transition-colors">Assistance Technique</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Sécurité & Sécurisation OWASP</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Mentions Légales</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}