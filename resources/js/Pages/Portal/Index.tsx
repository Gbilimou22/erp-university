import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
  GraduationCap, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Building2, 
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-900 tracking-tight">ERP UNIVERSITAIRE</h1>
                <p className="text-xs text-slate-500 font-medium">Plateforme Multi-Campus Intégrée</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Année Académique : {stats.academic_year}
              </span>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </header>

        {/* Section Hero */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Système de Gestion Universitaire Nouvelle Génération
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
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
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
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
        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 ERP Universitaire. Tous droits réservés.</p>
            <div className="flex gap-6">
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