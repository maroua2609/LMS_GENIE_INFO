import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, LogOut, Bell, GraduationCap, Users, FileText,
  PlusCircle, BarChart3, MessageCircle, Megaphone, Search,
  Layers, TrendingUp, Settings
} from 'lucide-react';

interface ModuleStat {
  id: number;
  code: string;
  titre: string;
  couleur: string;
  semestre: number;
  credits: number;
  nbCours: number;
  nbRessources: number;
  nbEtudiants: number;
  progressionMoyenne: number;
}

const EnseignantModules: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<ModuleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semestreFilter, setSemestreFilter] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/enseignant/modules/stats'),
        ]);
        setUser(userRes.data);
        setModules(statsRes.data);
      } catch (err) {
        console.error(err);
        localStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const filteredModules = modules.filter((mod) => {
    const matchSearch = mod.titre.toLowerCase().includes(search.toLowerCase()) ||
                        mod.code.toLowerCase().includes(search.toLowerCase());
    const matchSem = semestreFilter ? mod.semestre === semestreFilter : true;
    return matchSearch && matchSem;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar (identique) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CodexLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ENSEIGNANT</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Enseignement</p>
          <Link to="/enseignant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <BarChart3 size={18} /> Tableau de bord
          </Link>
          <Link to="/enseignant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm">
            <BookOpen size={18} /> Mes modules
          </Link>
          <Link to="/enseignant/cours/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <FileText size={18} /> Ressources
          </Link>
          <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <Megaphone size={18} /> Annonces
          </Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <Users size={18} /> Étudiants
          </Link>
          <Link to="/forum/1" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <MessageCircle size={18} /> Forum
          </Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div>
              <p className="text-white text-sm">{user?.prenom} {user?.nom}</p>
              <p className="text-gray-500 text-xs">Enseignant</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mes modules</h1>
            <p className="text-gray-400 mt-1">Gérez vos modules et leurs contenus</p>
          </div>
          <Link to="/enseignant/cours/create" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20">
            <PlusCircle size={18} /> Nouveau cours
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un module..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[null, 1, 2, 3, 4].map((sem) => (
              <button
                key={sem ?? 'all'}
                onClick={() => setSemestreFilter(sem)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  semestreFilter === sem
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {sem ? `S${sem}` : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <div key={mod.id} className="group bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="h-2" style={{ backgroundColor: mod.couleur }}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: mod.couleur + '20' }}>
                    <BookOpen size={28} style={{ color: mod.couleur }} />
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/enseignant/modules/${mod.id}`} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                      <Settings size={16} />
                    </Link>
                    <Link to={`/enseignant/cours/create?module=${mod.id}`} className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                      <PlusCircle size={16} />
                    </Link>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{mod.titre}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: mod.couleur }}>{mod.code}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><FileText size={14} /> Cours</div>
                    <p className="text-white font-bold">{mod.nbCours}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Layers size={14} /> Ressources</div>
                    <p className="text-white font-bold">{mod.nbRessources}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Users size={14} /> Étudiants</div>
                    <p className="text-white font-bold">{mod.nbEtudiants}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><TrendingUp size={14} /> Progression</div>
                    <p className="text-white font-bold">{mod.progressionMoyenne}%</p>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${mod.progressionMoyenne}%` }}></div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-800">
                  <Link to={`/enseignant/modules/${mod.id}`} className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-medium transition-colors">
                    Détails
                  </Link>
                  <Link to={`/enseignant/cours/create?module=${mod.id}`} className="flex-1 text-center bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-2 rounded-lg text-xs font-medium transition-colors">
                    + Cours
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={64} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun module trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos filtres.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EnseignantModules;