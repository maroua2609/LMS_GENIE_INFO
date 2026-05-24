import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import { 
  BookOpen, Clock, Search, LogOut, Bell, TrendingUp, Target, ChevronRight,
  BarChart3, MessageCircle, Megaphone, Bookmark, Layers, Zap
} from 'lucide-react';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

const EtudiantModules: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [semestreFilter, setSemestreFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, modulesRes] = await Promise.all([
          api.get<User>('/auth/me'),
          api.get<Module[]>('/modules'),
        ]);
        setUser(userRes.data);
        setModules(modulesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const filteredModules = modules.filter((module) => {
    const matchSearch = module.titre.toLowerCase().includes(search.toLowerCase()) ||
      module.code.toLowerCase().includes(search.toLowerCase());
    const matchSemestre = semestreFilter ? module.semestre === semestreFilter : true;
    return matchSearch && matchSemestre;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500/30 border-t-violet-500"></div>
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
              <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <BarChart3 size={18} /> Tableau de bord
              </Link>
              <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
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

        
        <main className="flex-1 p-6 lg:p-10 min-h-screen">
          
          {/* Top bar mobile */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <Link to="/etudiant/dashboard" className="text-gray-400 hover:text-white">
              ← Retour
            </Link>
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-gray-400" />
              <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">{getInitiales()}</span>
              </div>
            </div>
          </div>

          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Tous les modules</h1>
            <p className="text-gray-400">{modules.length} modules disponibles</p>
          </div>

          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un module..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {[null, 1, 2].map((sem) => (
                <button
                  key={sem ?? 'all'}
                  onClick={() => setSemestreFilter(sem)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    semestreFilter === sem
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {sem ? `S${sem}` : 'Tous'}
                </button>
              ))}
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Link
                key={module.id}
                to={`/etudiant/modules/${module.id}`}
                className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: module.couleur + '20' }}
                  >
                    <BookOpen size={24} style={{ color: module.couleur }} />
                  </div>
                  <ChevronRight size={20} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-violet-400 transition-colors">
                  {module.titre}
                </h3>
                <p className="text-sm font-medium mb-2" style={{ color: module.couleur }}>
                  {module.code}
                </p>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{module.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock size={12} />
                    Semestre {module.semestre}
                  </span>
                  <span className="text-gray-500 text-xs">{module.credits} crédits</span>
                </div>
              </Link>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-20">
              <BookOpen size={64} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Aucun module trouvé</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EtudiantModules;