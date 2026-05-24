import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  Megaphone, LogOut, Bell, GraduationCap, Users, BarChart3,
  TrendingUp, MessageCircle, BookOpen, FileText, PlusCircle,
  Send, Trash2, AlertCircle, Info, Clock, Pin
} from 'lucide-react';

interface AnnonceItem {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  auteur_prenom: string;
  auteur_nom: string;
  module_id: number | null;
  module_titre?: string;
  epingle: boolean;
  created_at: string;
}

const EnseignantAnnonces: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [annonces, setAnnonces] = useState<AnnonceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    module_id: '',
    type: 'info',
    titre: '',
    contenu: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    const fetchData = async () => {
      try {
        const [modRes, annRes] = await Promise.all([
          api.get<Module[]>('/modules'),
          api.get<AnnonceItem[]>('/annonces')
        ]);
        setModules(modRes.data);
        setAnnonces(annRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  // Normalisation du type pour éviter les problèmes de casse
  const normalizeType = (type: string): 'info' | 'important' | 'urgent' => {
    const t = type.toLowerCase();
    if (t === 'urgent') return 'urgent';
    if (t === 'important') return 'important';
    return 'info';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.contenu) {
      setError('Le titre et le message sont obligatoires');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        titre: form.titre,
        contenu: form.contenu,
        type: form.type,
        module_id: form.module_id ? parseInt(form.module_id) : null,
      };
      const res = await api.post('/annonces', payload);
      setAnnonces([res.data, ...annonces]);
      setForm({ module_id: '', type: 'info', titre: '', contenu: '' });
      setSuccess('Annonce publiée !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/annonces/${id}`);
      setAnnonces(annonces.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const typeIcon = (type: string) => {
    const t = normalizeType(type);
    switch (t) {
      case 'urgent': return <AlertCircle size={16} className="text-red-400" />;
      case 'important': return <AlertCircle size={16} className="text-amber-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const typeBadge = (type: string) => {
    const t = normalizeType(type);
    switch (t) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'important': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'il y a 0 min';
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

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

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Annonces</h1>
          <p className="text-gray-400 mb-8">Informez vos étudiants des actualités importantes.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-400" />
                Nouvelle annonce
              </h2>

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Cible</label>
                  <select
                    value={form.module_id}
                    onChange={(e) => setForm({ ...form, module_id: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                  >
                    <option value="">Toute la promotion</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} — {m.titre}</option>
                    ))}
                  </select>
                </div>

                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                  >
                    <option value="info">Info</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Titre</label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="Report de l'examen final"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all text-sm"
                    maxLength={200}
                  />
                </div>

                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Message</label>
                  <textarea
                    value={form.contenu}
                    onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                    placeholder="Détaillez votre annonce..."
                    rows={4}
                    maxLength={1000}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all text-sm resize-none"
                  />
                  <p className="text-gray-500 text-xs mt-1 text-right">{form.contenu.length}/1000</p>
                </div>

                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Signature</label>
                  <div className="flex items-center gap-3 bg-gray-800/30 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getInitiales()}
                    </div>
                    <span className="text-white text-sm">{user?.prenom} {user?.nom}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? 'Publication...' : 'Publier'}
                </button>
              </form>
            </div>

            
            <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone size={20} className="text-emerald-400" />
                Annonces publiées
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                  {annonces.length}
                </span>
              </h2>

              {annonces.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Aucune annonce publiée.</p>
              ) : (
                <div className="space-y-3">
                  {annonces.map((annonce) => (
                    <div key={annonce.id} className="p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeBadge(annonce.type)}`}>
                          {typeIcon(annonce.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase ${annonce.type === 'urgent' ? 'text-red-400' : annonce.type === 'important' ? 'text-amber-400' : 'text-blue-400'}`}>
                              {normalizeType(annonce.type)}
                            </span>
                            {annonce.epingle && (
                              <span className="text-xs text-emerald-400 flex items-center gap-1"><Pin size={12} /> Épinglé</span>
                            )}
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <Clock size={12} /> {timeAgo(annonce.created_at)}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold">{annonce.titre}</h3>
                          <p className="text-gray-400 text-sm mt-1">{annonce.contenu}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-gray-500 text-xs">— {annonce.auteur_prenom} {annonce.auteur_nom}</p>
                            {annonce.module_titre && (
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                                {annonce.module_titre}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {annonce.auteur_prenom === user?.prenom && annonce.auteur_nom === user?.nom && (
                          <button
                            onClick={() => handleDelete(annonce.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
  );
};

export default EnseignantAnnonces;