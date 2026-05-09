import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/config';
import { 
  MessageCircle, Send, ThumbsUp, CheckCircle2, LogOut, Bell,
  BarChart3, TrendingUp, Megaphone, Bookmark, Zap, Clock, User, Pin
} from 'lucide-react';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface Sujet {
  id: number;
  titre: string;
  contenu: string;
  auteur_id: number;
  auteur_prenom: string;
  auteur_nom: string;
  epingle: boolean;
  ferme: boolean;
  vues: number;
  created_at: string;
  reponses_count: number;
}

const Forum: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSujet, setShowNewSujet] = useState(false);
  const [newSujet, setNewSujet] = useState({ titre: '', contenu: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, sujetsRes] = await Promise.all([
          api.get<User>('/auth/me'),
          api.get<Sujet[]>(`/forum/module/${moduleId || 1}`),
        ]);
        setUser(userRes.data);
        setSujets(sujetsRes.data);
      } catch (err) {
        console.error('Erreur chargement forum:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moduleId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const handleCreateSujet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSujet.titre || !newSujet.contenu) return;

    try {
      const res = await api.post('/forum/sujets', {
        module_id: parseInt(moduleId || '1'),
        titre: newSujet.titre,
        contenu: newSujet.contenu,
      });
      setSujets([res.data, ...sujets]);
      setNewSujet({ titre: '', contenu: '' });
      setShowNewSujet(false);
    } catch (err) {
      console.error('Erreur création sujet:', err);
    }
  };

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
              <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
                <Megaphone size={18} /> Annonces
              </Link>
              <Link to={`/forum/${moduleId || 1}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <MessageCircle size={28} className="text-violet-400" />
                Forum
              </h1>
              <p className="text-gray-400">Discutez avec vos enseignants et camarades</p>
            </div>
            <button
              onClick={() => setShowNewSujet(!showNewSujet)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/20"
            >
              <MessageCircle size={20} />
              Nouveau sujet
            </button>
          </div>

          {/* Formulaire nouveau sujet */}
          {showNewSujet && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
              <h3 className="text-white font-bold text-lg mb-4">Créer un nouveau sujet</h3>
              <form onSubmit={handleCreateSujet} className="space-y-4">
                <input
                  type="text"
                  value={newSujet.titre}
                  onChange={(e) => setNewSujet({ ...newSujet, titre: e.target.value })}
                  placeholder="Titre du sujet"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-all"
                  required
                />
                <textarea
                  value={newSujet.contenu}
                  onChange={(e) => setNewSujet({ ...newSujet, contenu: e.target.value })}
                  placeholder="Contenu de votre message..."
                  rows={4}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-all resize-none"
                  required
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewSujet(false)}
                    className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all"
                  >
                    <Send size={18} />
                    Publier
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des sujets */}
          {sujets.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle size={64} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucun sujet</h3>
              <p className="text-gray-500 mb-6">Soyez le premier à poser une question !</p>
              <button
                onClick={() => setShowNewSujet(true)}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <MessageCircle size={20} />
                Créer un sujet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sujets.map((sujet) => (
                <Link
                  key={sujet.id}
                  to={`/forum/sujet/${sujet.id}`}
                  className="block bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sujet.epingle && <Pin size={14} className="text-violet-400" />}
                        {sujet.ferme && <CheckCircle2 size={14} className="text-emerald-400" />}
                        <h3 className="text-white font-semibold group-hover:text-violet-400 transition-colors">
                          {sujet.titre}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{sujet.contenu}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {sujet.auteur_prenom} {sujet.auteur_nom}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          {sujet.reponses_count || 0} réponses
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Forum;