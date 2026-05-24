import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, Search, LogOut, Users, ShieldCheck,
  BarChart3, TrendingUp, FileText, Megaphone, Layers, MessageCircle,
  Plus, Pencil, Trash2, X, RefreshCw,
  
  Database, Wifi, Server, Globe, Brain, GitBranch
} from 'lucide-react';


const iconMap: Record<string, React.ElementType> = {
  database: Database,
  wifi: Wifi,
  server: Server,
  globe: Globe,
  brain: Brain,
  'git-branch': GitBranch,
};

interface ModuleAdmin {
  id: number;
  code: string;
  titre: string;
  description: string | null;
  couleur: string;
  semestre: number;
  credits: number;
  actif: boolean;
  annee_niveau: number | string;
  icone: string | null;
  created_at: string;
  enseignant: string;
  nb_cours: number;
  nb_ressources: number;
  nb_annonces: number;
}

const AdminModules: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<ModuleAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semestreFilter, setSemestreFilter] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ModuleAdmin[]>('/admin/modules');
      setModules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        else navigate('/login');
      });

    fetchModules();
  }, [navigate, fetchModules]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () =>
    user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const filtered = useMemo(() => {
    let list = modules;
    if (semestreFilter) list = list.filter(m => m.semestre === semestreFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m =>
        m.titre.toLowerCase().includes(s) ||
        m.code.toLowerCase().includes(s) ||
        m.enseignant.toLowerCase().includes(s)
      );
    }
    return list;
  }, [modules, search, semestreFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/modules/${deleteTarget.id}`);
      setModules(prev => prev.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const formatAnnee = (annee: number | string) => {
    if (typeof annee === 'number') {
      return `${annee}${annee === 1 ? 'ère' : 'ème'} année`;
    }
    return annee;
  };

  const renderIcon = (module: ModuleAdmin) => {
    const hasIcon = module.icone && module.icone.trim() !== '';
    if (hasIcon) {
      if (module.icone!.startsWith('http')) {
        return (
          <img
            src={module.icone!}
            alt={module.titre}
            className="w-14 h-14 rounded-2xl object-cover"
          />
        );
      }
      const IconComponent = iconMap[module.icone!.toLowerCase()];
      if (IconComponent) {
        return <IconComponent size={28} style={{ color: module.couleur }} />;
      }
      // Fallback : afficher l'emoji ou le texte
      return <span style={{ fontSize: '1.75rem', lineHeight: '1' }}>{module.icone}</span>;
    }
    // Aucune icône : icône par défaut blanche
    return <BookOpen size={28} className="text-white/90" />;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">GINFLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ADMINISTRATEUR</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Administration</p>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Users size={18} /> Utilisateurs</Link>
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3"></p>
          
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Catalogue des modules</h1>
            <p className="text-gray-400 mt-1">Vue administrateur — superviser et auditer tous les modules.</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button onClick={fetchModules} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm flex items-center gap-2 transition-all">
              <RefreshCw size={16} /> Rafraîchir
            </button>
            <Link to="/admin/modules/create" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20">
              <Plus size={18} /> Créer un module
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un module, un code, un enseignant..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSemestreFilter(null)} className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${!semestreFilter ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>Tous</button>
            {[1,2,3,4,5,6].map(sem => (
              <button key={sem} onClick={() => setSemestreFilter(sem)} className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${semestreFilter === sem ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>S{sem}</button>
            ))}
          </div>
        </div>

        {/* Liste des modules */}
        <div className="space-y-4">
          {filtered.map(mod => (
            <div key={mod.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mod.couleur + '20' }}>
                      {renderIcon(mod)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{mod.titre}</h3>
                      <p className="text-sm font-medium mt-1" style={{ color: mod.couleur }}>{mod.code}</p>
                      <p className="text-gray-400 text-sm mt-1">{mod.enseignant}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {formatAnnee(mod.annee_niveau)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      S{mod.semestre}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {mod.credits} crédits
                    </span>
                    <span className={`px-3 py-1 rounded-full border ${mod.actif ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {mod.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-400">
                      Créé le {new Date(mod.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {mod.description && <p className="text-gray-400 text-sm line-clamp-2">{mod.description}</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="hidden lg:flex items-center gap-5 text-sm text-gray-400">
                    <span className="flex items-center gap-1" title="Cours publiés"><BookOpen size={14} /> {mod.nb_cours}</span>
                    <span className="flex items-center gap-1" title="Ressources"><Layers size={14} /> {mod.nb_ressources}</span>
                    <span className="flex items-center gap-1" title="Annonces"><Megaphone size={14} /> {mod.nb_annonces}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/admin/modules/edit/${mod.id}`)} className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteTarget(mod)} className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">Aucun module trouvé.</div>}
        </div>

        
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
                <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-gray-300 mb-2">
                Voulez-vous vraiment supprimer le module <span className="font-semibold text-white">{deleteTarget.titre}</span> ({deleteTarget.code}) ?
              </p>
              <p className="text-red-400 text-sm mb-6">Cette action est irréversible. Tous les cours, ressources et données associées seront perdus.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white">Annuler</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
                  {deleting ? 'Suppression...' : <><Trash2 size={16} /> Supprimer</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminModules;