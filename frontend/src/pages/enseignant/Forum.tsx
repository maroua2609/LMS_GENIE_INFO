import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  MessageCircle, LogOut, Bell, GraduationCap, Users, BarChart3,
  TrendingUp, BookOpen, FileText, Megaphone, Send, Trash2, PlusCircle,
  User, Clock, ChevronDown, ChevronRight
} from 'lucide-react';

interface Sujet {
  id: number;
  module_id: number;
  titre: string;
  contenu: string;
  auteur_id: number;
  auteur_prenom: string;
  auteur_nom: string;
  epingle: boolean;
  ferme: boolean;
  vues: number;
  reponses_count: number;
  created_at: string;
}

interface Reponse {
  id: number;
  sujet_id: number;
  auteur_id: number;
  auteur_prenom: string;
  auteur_nom: string;
  contenu: string;
  solution: boolean;
  votes_positifs: number;
  created_at: string;
}

const EnseignantForum: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSujet, setShowNewSujet] = useState(false);
  const [newSujet, setNewSujet] = useState({ titre: '', contenu: '' });
  const [expandedSujet, setExpandedSujet] = useState<number | null>(null);
  const [reponses, setReponses] = useState<Record<number, Reponse[]>>({});
  const [newReponse, setNewReponse] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    const fetchModules = async () => {
      try {
        const res = await api.get<Module[]>('/modules');
        setModules(res.data);
        if (res.data.length > 0) setSelectedModule(res.data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) loadSujets();
  }, [selectedModule]);

  const loadSujets = async () => {
    try {
      const res = await api.get(`/forum/module/${selectedModule}`);
      setSujets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const handleCreateSujet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSujet.titre || !newSujet.contenu) return;
    setSubmitting(true);
    try {
      const res = await api.post('/forum/sujets', {
        module_id: selectedModule,
        titre: newSujet.titre,
        contenu: newSujet.contenu,
      });
      setSujets([res.data, ...sujets]);
      setNewSujet({ titre: '', contenu: '' });
      setShowNewSujet(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSujet = async (sujetId: number) => {
    if (!confirm('Supprimer ce sujet et toutes ses réponses ?')) return;
    try {
      await api.delete(`/forum/sujets/${sujetId}`);
      setSujets(sujets.filter(s => s.id !== sujetId));
      setExpandedSujet(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSujet = async (sujetId: number) => {
    if (expandedSujet === sujetId) {
      setExpandedSujet(null);
      return;
    }
    setExpandedSujet(sujetId);
    try {
      const res = await api.get(`/forum/sujets/${sujetId}/reponses`);
      setReponses(prev => ({ ...prev, [sujetId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReponse = async (sujetId: number) => {
    if (!newReponse.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/forum/sujets/${sujetId}/reponses`, { contenu: newReponse });
      setReponses(prev => ({ ...prev, [sujetId]: [...(prev[sujetId] || []), res.data] }));
      setNewReponse('');
      setSujets(prev => prev.map(s => s.id === sujetId ? { ...s, reponses_count: s.reponses_count + 1 } : s));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReponse = async (reponseId: number, sujetId: number) => {
    if (!confirm('Supprimer cette réponse ?')) return;
    try {
      await api.delete(`/forum/reponses/${reponseId}`);
      setReponses(prev => ({ ...prev, [sujetId]: prev[sujetId].filter(r => r.id !== reponseId) }));
      setSujets(prev => prev.map(s => s.id === sujetId ? { ...s, reponses_count: s.reponses_count - 1 } : s));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
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
          <Link to="/enseignant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <BookOpen size={18} /> Mes modules
          </Link>
          <Link to="/enseignant/ressources" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <FileText size={18} /> Ressources
          </Link>
          <Link to="/enseignant/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <Megaphone size={18} /> Annonces
          </Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <Users size={18} /> Étudiants
          </Link>
          <Link to="/enseignant/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm">
            <MessageCircle size={18} /> Forum
          </Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitiales()}
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Forum</h1>
              <p className="text-gray-400 mt-2">Gérez les discussions de vos modules</p>
            </div>
            <button
              onClick={() => setShowNewSujet(!showNewSujet)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all"
            >
              <PlusCircle size={20} />
              Nouveau sujet
            </button>
          </div>

          {/* Sélecteur de module */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Module</label>
            <select
              value={selectedModule || ''}
              onChange={(e) => setSelectedModule(parseInt(e.target.value))}
              className="w-full md:w-72 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.code} — {m.titre}</option>
              ))}
            </select>
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
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all"
                  required
                />
                <textarea
                  value={newSujet.contenu}
                  onChange={(e) => setNewSujet({ ...newSujet, contenu: e.target.value })}
                  placeholder="Contenu de votre message..."
                  rows={4}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all resize-none"
                  required
                />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowNewSujet(false)} className="px-5 py-2.5 bg-gray-800 text-white rounded-xl">Annuler</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2">
                    <Send size={16} /> Publier
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des sujets */}
          <div className="space-y-4">
            {sujets.map((sujet) => (
              <div key={sujet.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-5 flex items-start justify-between hover:bg-gray-800/30 transition-all cursor-pointer"
                  onClick={() => handleToggleSujet(sujet.id)}>
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {sujet.epingle && <span className="text-xs text-emerald-400">📌</span>}
                        {sujet.ferme && <span className="text-xs text-yellow-400">🔒</span>}
                        <h3 className="text-white font-semibold">{sujet.titre}</h3>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{sujet.contenu}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User size={12} /> {sujet.auteur_prenom} {sujet.auteur_nom}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(sujet.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12} /> {sujet.reponses_count} réponses</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSujet(sujet.id); }} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                    {expandedSujet === sujet.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  </div>
                </div>

                {/* Réponses */}
                {expandedSujet === sujet.id && (
                  <div className="border-t border-gray-800 p-5 bg-gray-900/30">
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                      {(reponses[sujet.id] || []).map((rep) => (
                        <div key={rep.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-xl">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-white text-sm font-medium">{rep.auteur_prenom} {rep.auteur_nom}</p>
                              <div className="flex items-center gap-2">
                                {rep.solution && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Solution</span>}
                                <button onClick={() => handleDeleteReponse(rep.id, sujet.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm mt-1">{rep.contenu}</p>
                            <p className="text-gray-500 text-xs mt-1">{new Date(rep.created_at).toLocaleString('fr-FR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ajouter une réponse */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newReponse}
                        onChange={(e) => setNewReponse(e.target.value)}
                        placeholder="Écrire une réponse..."
                        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAddReponse(sujet.id)}
                        disabled={submitting || !newReponse.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sujets.length === 0 && (
              <p className="text-gray-500 text-center py-12">Aucun sujet pour ce module.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnseignantForum;