import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, BookOpen, Activity, ArrowLeft, BarChart3 } from 'lucide-react';

const AdminStatistiques: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link to="/admin/dashboard" className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1">
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Statistiques</h1>
            <p className="text-slate-400 mt-2">Vue d'ensemble de la plateforme</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats détaillées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <Users size={24} className="text-blue-400 mb-3" />
            <p className="text-4xl font-bold text-white">4</p>
            <p className="text-slate-400 text-sm mt-1">Total utilisateurs</p>
            <div className="mt-3 space-y-1">
              <p className="text-slate-500 text-xs">👑 1 Admin</p>
              <p className="text-slate-500 text-xs">👨‍🏫 1 Enseignant</p>
              <p className="text-slate-500 text-xs">👨‍🎓 2 Étudiants</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <BookOpen size={24} className="text-emerald-400 mb-3" />
            <p className="text-4xl font-bold text-white">8</p>
            <p className="text-slate-400 text-sm mt-1">Modules actifs</p>
            <div className="mt-3 space-y-1">
              <p className="text-slate-500 text-xs">📚 4 en Semestre 1</p>
              <p className="text-slate-500 text-xs">📚 4 en Semestre 2</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <Activity size={24} className="text-purple-400 mb-3" />
            <p className="text-4xl font-bold text-white">0</p>
            <p className="text-slate-400 text-sm mt-1">Quiz créés</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <BarChart3 size={24} className="text-amber-400 mb-3" />
            <p className="text-4xl font-bold text-white">0</p>
            <p className="text-slate-400 text-sm mt-1">Connexions aujourd'hui</p>
          </div>
        </div>

        {/* Graphique placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-10">
          <h3 className="text-white font-semibold text-lg mb-4">Activité de la plateforme</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={64} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Graphique d'activité à venir</p>
              <p className="text-slate-600 text-sm mt-1">Les statistiques détaillées seront disponibles prochainement</p>
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <h3 className="text-white font-semibold text-lg mb-6">Répartition par rôle</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Étudiants</span>
                  <span className="text-white font-semibold">50%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Enseignants</span>
                  <span className="text-white font-semibold">25%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Administrateurs</span>
                  <span className="text-white font-semibold">25%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <h3 className="text-white font-semibold text-lg mb-6">Modules par semestre</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Semestre 1</span>
                  <span className="text-white font-semibold">4 modules</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Semestre 2</span>
                  <span className="text-white font-semibold">4 modules</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistiques;