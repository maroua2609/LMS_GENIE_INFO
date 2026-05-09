import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/config';
import { 
  Megaphone, AlertCircle, Info, ChevronRight, LogOut, Bell,
  BarChart3, TrendingUp, MessageCircle, Bookmark, Zap, Pin, Clock
} from 'lucide-react';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  type: 'info' | 'important' | 'urgent';
  auteur_prenom: string;
  auteur_nom: string;
  module_id: number | null;
  module_titre?: string;
  epingle: boolean;
  created_at: string;
}

const Annonces: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('toutes');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, annoncesRes] = await Promise.all([
          api.get<User>('/auth/me'),
          api.get<Annonce[]>('/annonces'),
        ]);
        setUser(userRes.data);
        setAnnonces(annoncesRes.data);
      } catch (err) {
        console.error('Erreur chargement annonces:', err);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle size={18} className="text-red-400" />;
      case 'important': return <AlertCircle size={18} className="text-amber-400" />;
      default: return <Info size={18} className="text-blue-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500 bg-red-500/5';
      case 'important': return 'border-l-amber-500 bg-amber-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'important': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const filteredAnnonces = annonces.filter((a) => {
    if (filter === 'toutes') return true;
    return a.type === filter;
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
        
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">LMS Génie Info</h1>
              <p className="text-gray-500 text-xs">Plateforme académique</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
            <nav className="space-y-1">
              <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
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
              <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
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
          
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Megaphone size={28} className="text-violet-400" />
              Annonces
            </h1>
            <p className="text-gray-400">Restez informé des actualités de la plateforme</p>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 mb-8">
            {[
              { value: 'toutes', label: 'Toutes' },
              { value: 'urgent', label: '🔴 Urgentes' },
              { value: 'important', label: '🟠 Importantes' },
              { value: 'info', label: '🔵 Infos' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  filter === f.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste des annonces */}
          {filteredAnnonces.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone size={64} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucune annonce</h3>
              <p className="text-gray-500">Aucune annonce pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnonces.map((annonce) => (
                <div
                  key={annonce.id}
                  className={`border-l-4 rounded-r-2xl p-6 transition-all hover:bg-gray-900/50 ${getTypeColor(annonce.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${getTypeBadge(annonce.type)}`}>
                      {getTypeIcon(annonce.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold uppercase ${getTypeBadge(annonce.type)} px-2 py-0.5 rounded-full`}>
                          {annonce.type}
                        </span>
                        {annonce.epingle && (
                          <span className="flex items-center gap-1 text-xs text-violet-400">
                            <Pin size={12} /> Épinglé
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-600 text-xs">
                          <Clock size={12} />
                          {new Date(annonce.created_at).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{annonce.titre}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{annonce.contenu}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-gray-600 text-sm">
                          — {annonce.auteur_prenom} {annonce.auteur_nom}
                        </p>
                        {annonce.module_titre && (
                          <span className="text-violet-400 text-xs">📚 {annonce.module_titre}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Annonces;