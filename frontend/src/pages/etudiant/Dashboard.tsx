import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import { 
  BookOpen, LogOut, Bell, TrendingUp, Target, ChevronRight, 
  AlertCircle, Calendar, BarChart3, MessageCircle, Megaphone, 
  Bookmark, Layers, Zap, Clock
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface DashboardStats {
  nb_modules: number;
  lecons_consultees: number;
  total_lecons: number;
  progression_moyenne: number;
  quiz_a_venir: any[];
  annonces: any[];
}

interface ModuleProgression {
  module_id: number;
  code: string;
  titre: string;
  couleur: string;
  enseignant_nom: string;
  total_lecons: number;
  lecons_consultees: number;
  ratio_lecons: number;
  total_quiz: number;
  quiz_completes: number;
  ratio_quiz: number;
  progression: number;
  semestre: number;
  credits: number;
}

interface ProgressionData {
  modules: ModuleProgression[];
  progression_globale: number;
  nb_modules: number;
}

const EtudiantDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, modulesRes, dashboardRes, progressionRes] = await Promise.all([
          api.get<User>('/auth/me'),
          api.get<Module[]>('/modules'),
          api.get<DashboardStats>('/etudiant/dashboard'),
          api.get<ProgressionData>('/etudiant/progression'),
        ]);
        setUser(userRes.data);
        setModules(modulesRes.data);
        setStats(dashboardRes.data);
        setAnnonces(dashboardRes.data.annonces || []);
        setProgression(progressionRes.data);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
        localStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500/30 border-t-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex">
        
        
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">GINFLMS</h1>
              <p className="text-gray-500 text-xs">Plateforme académique</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
            <nav className="space-y-1">
              <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
                <BarChart3 size={18} /> Tableau de bord
              </Link>
              <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <Bookmark size={18} /> Mes modules
              </Link>
              <Link to="/etudiant/progression" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <TrendingUp size={18} /> Progression
              </Link>
            </nav>
          </div>

          <div className="mb-8">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
            <nav className="space-y-1">
              <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <Megaphone size={18} /> Annonces
              </Link>
              <Link to="/forum/1" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <MessageCircle size={18} /> Forum
              </Link>
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{getInitiales()}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</p>
                <p className="text-gray-500 text-xs">Étudiant</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 p-6 lg:p-10 min-h-screen">
          
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white">Bonjour, {user?.prenom} 👋</h1>
              <p className="text-gray-400 mt-1">Prêt à apprendre aujourd'hui ?</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link to="/etudiant/progression" className="lg:hidden">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{getInitiales()}</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-3">
                <Layers size={20} className="text-violet-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.nb_modules || modules.length}</p>
              <p className="text-gray-500 text-sm mt-1">Modules actifs</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
                <BookOpen size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.lecons_consultees || 0}/{stats?.total_lecons || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Leçons consultées</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{progression?.progression_globale || 0}%</p>
              <p className="text-gray-500 text-sm mt-1">Progression globale</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
                <Target size={20} className="text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.quiz_a_venir?.length || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Quiz à venir</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            
            <div className="lg:col-span-2 space-y-6">
              
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-violet-400" />
                    Progression globale
                  </h2>
                  <span className="text-2xl font-bold text-violet-400">{progression?.progression_globale || 0}%</span>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${progression?.progression_globale || 0}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {progression?.nb_modules || 0} modules • 60% leçons + 40% quiz
                </p>
              </div>

              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Mes modules</h2>
                  <Link to="/etudiant/progression" className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1 transition-colors">
                    Détails <ChevronRight size={16} />
                  </Link>
                </div>

                {modules.length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                    <BookOpen size={48} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun module pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => {
                      const moduleProg = progression?.modules?.find((m: any) => m.module_id === module.id);
                      const progValue = moduleProg?.progression || 0;
                      
                      return (
                        <Link
                          key={module.id}
                          to={`/etudiant/modules/${module.id}`}
                          className="block bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: (module.couleur || '#8B5CF6') + '20' }}
                            >
                              <BookOpen size={22} style={{ color: module.couleur || '#8B5CF6' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs font-semibold mb-0.5" style={{ color: module.couleur || '#8B5CF6' }}>
                                    {module.code}
                                  </p>
                                  <h3 className="text-white font-semibold group-hover:text-violet-400 transition-colors">
                                    {module.titre}
                                  </h3>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className={`text-lg font-bold ${
                                    progValue >= 80 ? 'text-emerald-400' : 
                                    progValue >= 50 ? 'text-amber-400' : 'text-violet-400'
                                  }`}>
                                    {progValue}%
                                  </span>
                                </div>
                              </div>
                              
                              
                              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${progValue}%`,
                                    background: progValue >= 80 
                                      ? 'linear-gradient(to right, #22c55e, #10b981)' 
                                      : progValue >= 50 
                                        ? 'linear-gradient(to right, #f59e0b, #f97316)' 
                                        : 'linear-gradient(to right, #8b5cf6, #6366f1)'
                                  }}
                                ></div>
                              </div>

                              
                              {moduleProg && (
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <BookOpen size={12} />
                                    {moduleProg.lecons_consultees}/{moduleProg.total_lecons} leçons
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target size={12} />
                                    {moduleProg.quiz_completes}/{moduleProg.total_quiz} quiz
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            
            <div className="space-y-6">
              
              {/* Quiz à venir */}
              {stats?.quiz_a_venir && stats.quiz_a_venir.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Quiz à venir</h2>
                  <div className="space-y-3">
                    {stats.quiz_a_venir.map((quiz: any) => (
                      <Link
                        key={quiz.id}
                        to={`/etudiant/quiz/${quiz.id}`}
                        className="block bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-amber-500/30 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-xl flex-shrink-0">
                            <Calendar size={16} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-amber-400 text-xs font-bold uppercase mb-1">Quiz</p>
                            <h4 className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
                              {quiz.titre}
                            </h4>
                            <p className="text-gray-500 text-xs mt-1">
                              {quiz.module_code} — {quiz.module_titre}
                            </p>
                            {quiz.date_ouverture && (
                              <p className="text-gray-600 text-xs mt-1">
                                {new Date(quiz.date_ouverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Annonces</h2>
                  <Link to="/annonces" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                    Tout voir
                  </Link>
                </div>

                {annonces.length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
                    <Megaphone size={32} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucune annonce</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {annonces.map((annonce: any) => (
                      <div key={annonce.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            annonce.type === 'urgent' ? 'bg-red-500/20' : 
                            annonce.type === 'important' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                          }`}>
                            <AlertCircle size={16} className={
                              annonce.type === 'urgent' ? 'text-red-400' : 
                              annonce.type === 'important' ? 'text-amber-400' : 'text-blue-400'
                            } />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold uppercase ${
                                annonce.type === 'urgent' ? 'text-red-400' : 
                                annonce.type === 'important' ? 'text-amber-400' : 'text-blue-400'
                              }`}>
                                {annonce.type === 'urgent' ? 'URGENT' : annonce.type}
                              </span>
                              <span className="text-gray-600 text-xs">
                                {annonce.created_at ? new Date(annonce.created_at).toLocaleDateString('fr-FR') : ''}
                              </span>
                            </div>
                            <h4 className="text-white font-semibold text-sm">{annonce.titre}</h4>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{annonce.contenu}</p>
                            <p className="text-gray-600 text-xs mt-2">
                              — {annonce.auteur_prenom} {annonce.auteur_nom}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EtudiantDashboard;