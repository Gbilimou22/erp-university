import React from 'react';

interface Enrollment {
  id: number;
  level: string;
  status: string;
  faculty?: {
    name: string;
    code: string;
  };
  academic_year?: {
    name: string;
  };
}

interface Student {
  id: number;
  registration_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  enrollments: Enrollment[];
}

interface Props {
  students: Student[];
}

export default function Welcome({ students }: Props) {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ERP Universitaire</h1>
            <p className="text-gray-500 text-sm">Gestion des étudiants et des inscriptions</p>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
            PostgreSQL Connecté
          </span>
        </header>

        {/* Tableau des Étudiants */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Liste des Étudiants Inscrit(e)s</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-medium">
              Total : {students.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom & Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculté & Niveau</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const activeEnrollment = student.enrollments?.[0];
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {student.registration_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {student.last_name.toUpperCase()} {student.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{student.email}</div>
                        <div className="text-xs text-gray-400">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {activeEnrollment ? (
                          <div>
                            <span className="font-medium text-gray-800">{activeEnrollment.faculty?.name}</span>
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {activeEnrollment.level}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Aucune inscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {activeEnrollment?.status || 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
