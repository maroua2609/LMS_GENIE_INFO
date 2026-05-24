import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  MessageCircle, Plus, Send, Trash2, Pin, LogOut, BarChart3,
  Bookmark, TrendingUp, Megaphone, Zap, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Edit3, Clock, User
} from 'lucide-react';


interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

interface Module {
  id: number;
  code: string;
  titre: string;
  couleur: string;
}

interface Sujet {
  id: number;
  module_id: number;
  auteur_id: number;
  titre: string;
  contenu: string;
  epingle: boolean;
  created_at: string;
  auteur_nom: string;
  auteur_prenom: string;
  reponses_count: number;
}

interface Reponse {
  id: number;
  sujet_id: number;
  auteur_id: number;
  contenu: string;
  created_at: string;
  auteur_nom: string;
  auteur_prenom: string;
}

const EtudiantForum: React.FC = () => {
  const { moduleId } = useParams<{ moduleId?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 
  const [showNewSujetForm, setShowNewSujetForm] = useState(false);
  const [newTitre, setNewTitre] = useState('');
  const [newContenu, setNewContenu] = useState('');
  const [submitting, setSubmitting] = useState(false);

  
  const [selectedSujet, setSelectedSujet] = useState<Sujet | null>(null);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [newReponse, setNewReponse] = useState('');
  const [submittingReponse, setSubmittingReponse] = useState(false);
  const [loadingReponses, setLoadingReponses] = useState(false);

 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await api.get<Module[]>('/modules');
        setModules(res.data);
        if (res.data.length > 0) {
          if (moduleId) {
            const mod = res.data.find(m => m.id === parseInt(moduleId));
            if (mod) setSelectedModule(mod);
            else setSelectedModule(res.data[0]);
          } else {
            setSelectedModule(res.data[0]);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les modules.");
      }
    };
    fetchModules();
  }, [moduleId]);

  
  const fetchSujets = useCallback(async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      const res = await api.get<Sujet[]>(`/forum/module/${selectedModule.id}`);
      setSujets(res.data);
      
      setTotalPages(1);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les sujets.");
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    fetchSujets();
  }, [fetchSujets]);

  
  const handleCreateSujet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !newTitre.trim() || !newContenu.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/forum/sujets', {
        module_id: selectedModule.id,
        titre: newTitre,
        contenu: newContenu
      });
      setNewTitre('');
      setNewContenu('');
      setShowNewSujetForm(false);
      fetchSujets(); // rafraîchir la liste
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du sujet.");
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleDeleteSujet = async (sujetId: number) => {
    if (!window.confirm("Supprimer ce sujet ? Toutes les réponses seront également supprimées.")) return;
    try {
      await api.delete(`/forum/sujets/${sujetId}`);
      if (selectedSujet?.id === sujetId) setSelectedSujet(null);
      fetchSujets();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression.");
    }
  };

  
  const fetchReponses = async (sujetId: number) => {
    setLoadingReponses(true);
    try {
      const res = await api.get<Reponse[]>(`/forum/sujets/${sujetId}/reponses`);
      setReponses(res.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les réponses.");
    } finally {
      setLoadingReponses(false);
    }
  };

  
  const openSujet = (sujet: Sujet) => {
    setSelectedSujet(sujet);
    fetchReponses(sujet.id);
  };

  
  const handleAddReponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSujet || !newReponse.trim()) return;
    setSubmittingReponse(true);
    try {
      await api.post(`/forum/sujets/${selectedSujet.id}/reponses`, {
        contenu: newReponse
      });
      setNewReponse('');
      fetchReponses(selectedSujet.id);
      
      setSujets(prev => prev.map(s =>
        s.id === selectedSujet.id ? { ...s, reponses_count: s.reponses_count + 1 } : s
      ));
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'ajout de la réponse.");
    } finally {
      setSubmittingReponse(false);
    }
  };

 
  const handleDeleteReponse = async (reponseId: number) => {
    if (!window.confirm("Supprimer cette réponse ?")) return;
    try {
      await api.delete(`/forum/reponses/${reponseId}`);
      fetchReponses(selectedSujet!.id);
      
      setSujets(prev => prev.map(s =>
        s.id === selectedSujet!.id ? { ...s, reponses_count: s.reponses_count - 1 } : s
      ));
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression.");
    }
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-purple-400 hover:text-purple-300">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
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
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm">
              <MessageCircle size={18} /> Forum
            </div>
          </nav>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{getInitiales()}</span>
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

      
      <main className="flex-1 min-h-screen p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Forum</h1>
              <p className="text-gray-400 mt-1">Échangez avec vos camarades et enseignants</p>
            </div>
            <div className="flex items-center gap-3">
              {modules.length > 0 && (
                <select
                  value={selectedModule?.id || ''}
                  onChange={(e) => {
                    const mod = modules.find(m => m.id === parseInt(e.target.value));
                    setSelectedModule(mod || null);
                    setSelectedSujet(null);
                    setShowNewSujetForm(false);
                  }}
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.code} - {mod.titre}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowNewSujetForm(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
              >
                <Plus size={16} /> Nouveau sujet
              </button>
            </div>
          </div>

          
          {showNewSujetForm && selectedModule && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Créer un nouveau sujet</h2>
              <form onSubmit={handleCreateSujet}>
                <input
                  type="text"
                  placeholder="Titre du sujet"
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
                  required
                />
                <textarea
                  placeholder="Contenu de votre message..."
                  value={newContenu}
                  onChange={(e) => setNewContenu(e.target.value)}
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSujetForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Publier
                  </button>
                </div>
              </form>
            </div>
          )}

          
          {!selectedSujet ? (
            
            <>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={40} className="text-purple-400 animate-spin" />
                </div>
              ) : sujets.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <MessageCircle size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun sujet dans ce module pour le moment.</p>
                  <p className="text-gray-500 text-sm mt-1">Soyez le premier à créer un sujet !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sujets.map((sujet) => (
                    <div
                      key={sujet.id}
                      className="bg-gray-900/30 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all cursor-pointer group"
                      onClick={() => openSujet(sujet)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {sujet.epingle && <Pin size={14} className="text-yellow-400" />}
                            <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                              {sujet.titre}
                            </h3>
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-2">{sujet.contenu}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User size={12} /> {sujet.auteur_prenom} {sujet.auteur_nom}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {formatDate(sujet.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={12} /> {sujet.reponses_count} réponse(s)
                            </span>
                          </div>
                        </div>
                        {user && (user.id === sujet.auteur_id || user.role === 'admin') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSujet(sujet.id); }}
                            className="text-gray-600 hover:text-red-400 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            
            <div>
              <button
                onClick={() => setSelectedSujet(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ChevronLeft size={20} /> Retour aux sujets
              </button>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    {selectedSujet.epingle && <Pin size={14} className="text-yellow-400 mb-2" />}
                    <h2 className="text-2xl font-bold text-white">{selectedSujet.titre}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Par {selectedSujet.auteur_prenom} {selectedSujet.auteur_nom}</span>
                      <span>le {formatDate(selectedSujet.created_at)}</span>
                    </div>
                  </div>
                  {user && (user.id === selectedSujet.auteur_id || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteSujet(selectedSujet.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                <div className="mt-4 p-4 bg-gray-800/30 rounded-xl">
                  <p className="text-gray-200 whitespace-pre-wrap">{selectedSujet.contenu}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle size={18} /> Réponses ({reponses.length})
              </h3>

              {loadingReponses ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={32} className="text-purple-400 animate-spin" />
                </div>
              ) : reponses.length === 0 ? (
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Aucune réponse pour le moment.</p>
                  <p className="text-gray-500 text-sm">Soyez le premier à répondre !</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {reponses.map((rep) => (
                    <div key={rep.id} className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <span className="font-medium text-white">{rep.auteur_prenom} {rep.auteur_nom}</span>
                            <span>•</span>
                            <span>{formatDate(rep.created_at)}</span>
                          </div>
                          <p className="text-gray-200 whitespace-pre-wrap">{rep.contenu}</p>
                        </div>
                        {user && (user.id === rep.auteur_id || user.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteReponse(rep.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
                <form onSubmit={handleAddReponse}>
                  <textarea
                    placeholder="Votre réponse..."
                    value={newReponse}
                    onChange={(e) => setNewReponse(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-3"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReponse}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all"
                    >
                      {submittingReponse ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Répondre
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EtudiantForum;