import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, LogOut, Bell, GraduationCap, Users, FileText,
  TrendingUp, AlertTriangle, Search, BarChart3, PlusCircle,
  Megaphone, Layers, MessageCircle, ChevronRight, Target, Clock,
  AlertCircle
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';


interface ModuleStat {
  module_id: number;
  code: string;
  titre: string;
  couleur: string;
  semestre: number;
  progression_moyenne: number;
  couverture_lecons: number;
  moyenne_quiz: number;
  nb_etudiants: number;
  nb_a_risque: number;
}

interface ClassementEtudiant {
  nom: string;
  prenom: string;
  progression: number;
}

interface DashboardData {
  progression_globale: number;
  nb_etudiants_suivis: number;
  lecons_consultees: number;
  nb_etudiants_risque: number;
  total_tentatives: number;
  modules: ModuleStat[];
  classement: ClassementEtudiant[];
}


const CircularProgress: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="18" fontWeight="bold">
          {value}%
        </text>
      </svg>
      <span className="text-gray-400 text-xs font-medium">{label}</span>
    </div>
  );
};


const VerticalBar: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const heightPercent = Math.max(value * 1.2, 4);
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${heightPercent}px`, backgroundColor: color }} />
      <span className="text-xs text-gray-400">{value}%</span>
    </div>
  );
};


const EnseignantDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, dashRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/enseignant/dashboard'),
        ]);
        setUser(userRes.data);
        setDashboard(dashRes.data);
        console.log('Dashboard data:', dashRes.data); 
      } catch (err: any) {
        console.error(err);
        if (err.response?.status === 403) {
          setError('Accès non autorisé.');
        } else {
          setError('Impossible de charger les statistiques.');
        }
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

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 max-w-md text-center">
        <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Données non disponibles</h2>
        <p className="text-gray-400">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          Rafraîchir
        </button>
      </div>
    </div>
  );

  if (!dashboard) return null;

  
  const couvertureLeconsPct =
    dashboard.modules.length > 0
      ? Math.round(dashboard.modules.reduce((sum, m) => sum + m.couverture_lecons, 0) / dashboard.modules.length)
      : 0;

  const progressionColor = (val: number) => (val >= 60 ? '#10b981' : val >= 30 ? '#f59e0b' : '#ef4444');

  return (
    <div className="min-h-screen bg-gray-950 flex">

      
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">GINFLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ENSEIGNANT</p>
          </div>
        </div>
        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Enseignement</p>
          <Link to="/enseignant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/enseignant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Mes modules</Link>
          <Link to="/enseignant/ressources" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><FileText size={18} /> Ressources</Link>
          <Link to="/enseignant/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><Megaphone size={18} /> Annonces</Link>
          <Link to="/enseignant/quiz/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Évaluations</Link>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Progression</Link>
        </nav>
        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><Users size={18} /> Étudiants</Link>
          <Link to="/enseignant/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><MessageCircle size={18} /> Forum</Link>
        </nav>
        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Enseignant</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Bonjour, Dr. {user?.nom}</h1>
            <p className="text-gray-400 mt-1">Gérez vos modules, ressources et annonces.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500 text-sm" />
            </div>
            <NotificationBell />
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</div>
          </div>
        </div>

        {dashboard.modules.length === 0 && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
            <AlertTriangle size={24} className="text-amber-400 shrink-0" />
            <div><p className="text-white font-semibold">Aucun module assigné</p><p className="text-gray-400 text-sm">Contactez l'administrateur.</p></div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link to="/enseignant/modules/create" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110"><PlusCircle size={24} className="text-emerald-400" /></div>
            <div><h3 className="text-white font-semibold">Créer un module</h3><p className="text-gray-500 text-sm">Définissez un nouveau cours</p></div>
            <ChevronRight size={20} className="text-gray-500 ml-auto" />
          </Link>
          <Link to="/enseignant/ressources" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110"><FileText size={24} className="text-blue-400" /></div>
            <div><h3 className="text-white font-semibold">Déposer une ressource</h3><p className="text-gray-500 text-sm">PDF, vidéo ou code source</p></div>
            <ChevronRight size={20} className="text-gray-500 ml-auto" />
          </Link>
          <Link to="/enseignant/annonces" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110"><Megaphone size={24} className="text-purple-400" /></div>
            <div><h3 className="text-white font-semibold">Publier une annonce</h3><p className="text-gray-500 text-sm">Communiquez avec votre promotion</p></div>
            <ChevronRight size={20} className="text-gray-500 ml-auto" />
          </Link>
        </div>

        {/* Jauges et stats globales */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
            <CircularProgress value={dashboard.progression_globale} color="#10b981" label="Progression moyenne" />
            <p className="text-xs text-gray-500 mt-3">60% ressources + 40% quiz</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
            <CircularProgress value={Math.min((dashboard.nb_etudiants_suivis || 0) * 10, 100)} color="#3b82f6" label="Étudiants suivis" />
            <p className="text-lg font-bold text-white mt-2">{dashboard.nb_etudiants_suivis}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
            <CircularProgress value={couvertureLeconsPct} color="#8b5cf6" label="Couverture leçons" />
            <p className="text-lg font-bold text-white mt-2">{dashboard.lecons_consultees} consultées</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
            <CircularProgress value={Math.min((dashboard.nb_etudiants_risque || 0) * 20, 100)} color="#ef4444" label="Étudiants à risque" />
            <p className="text-lg font-bold text-red-400 mt-2">{dashboard.nb_etudiants_risque}</p>
          </div>
        </div>

        {/* Graphique en barres et classement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-400" /> Progression par module</h3>
            {dashboard.modules.length > 0 ? (
              <>
                <div className="flex items-end gap-4 h-48">
                  {dashboard.modules.map((mod) => (
                    <VerticalBar key={mod.module_id} value={mod.progression_moyenne} color={progressionColor(mod.progression_moyenne)} />
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-4">60% ressources + 40% quiz — {dashboard.total_tentatives} tentatives</p>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun module</p>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Target size={20} className="text-amber-400" /> Top étudiants</h3>
            {dashboard.classement?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.classement.map((etu, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-gray-500 text-sm w-6">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-white text-sm">{etu.prenom} {etu.nom}</p>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full mt-1">
                          <div className="h-1.5 bg-emerald-400 rounded-full" style={{ width: `${etu.progression}%` }} />
                        </div>
                      </div>
                      <span className="text-emerald-400 font-semibold text-sm ml-2">{etu.progression}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun classement</p>
            )}
          </div>
        </div>

        {/* Détail par module (cartes) */}
        {dashboard.modules.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-4">Détail par module</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboard.modules.map((mod) => (
                <div key={mod.module_id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="text-sm font-bold text-white">{mod.titre}</p><p className="text-xs text-gray-500">{mod.code} • S{mod.semestre}</p></div>
                    {mod.nb_a_risque > 0 && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">{mod.nb_a_risque} à risque</span>}
                  </div>
                  <div className="space-y-3 mt-4">
                    <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progression</span><span>{mod.progression_moyenne}%</span></div><div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mod.progression_moyenne}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Couverture leçons</span><span>{mod.couverture_lecons}%</span></div><div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${mod.couverture_lecons}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Moy. quiz</span><span>{mod.moyenne_quiz}/20</span></div><div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(mod.moyenne_quiz / 20) * 100}%` }} /></div></div>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EnseignantDashboard;