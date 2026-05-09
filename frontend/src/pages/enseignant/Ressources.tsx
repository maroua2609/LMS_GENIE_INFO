import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  FileText, LogOut, Bell, GraduationCap, Users, BarChart3,
  TrendingUp, MessageCircle, Megaphone, BookOpen, PlusCircle,
  Upload, Video, Code, FileImage, CheckCircle2, Clock,
  Layers, Download, Link as LinkIcon, Trash2
} from 'lucide-react';

interface RessourceItem {
  id: number;
  titre: string;
  type: string;
  url?: string;
  taille_mo?: number;
  duree_min?: number;
  cours_id: number;
  module_code: string;
  module_titre: string;
  created_at: string;
}

const EnseignantRessources: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [ressources, setRessources] = useState<RessourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    module_id: '',
    titre: '',
    type: 'pdf',
    fichier: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    const fetchData = async () => {
      try {
        const [modRes, ressRes] = await Promise.all([
          api.get<Module[]>('/modules'),
          api.get<RessourceItem[]>('/enseignant/ressources')
        ]);
        setModules(modRes.data);
        setRessources(ressRes.data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, fichier: e.target.files[0] });
      if (!formData.titre) {
        setFormData({ ...formData, titre: e.target.files[0].name });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.module_id || !formData.titre) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('module_id', formData.module_id);
      fd.append('titre', formData.titre);
      fd.append('type', formData.type);
      if (formData.fichier && formData.type !== 'lien') {
        fd.append('fichier', formData.fichier);
      }
      const res = await api.post('/enseignant/ressources', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRessources([res.data, ...ressources]);
      setFormData({ module_id: formData.module_id, titre: '', type: 'pdf', fichier: null });
      setSuccess('Ressource publiée avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ressourceId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette ressource ?')) return;
    try {
      await api.delete(`/ressources/${ressourceId}`);
      setRessources(ressources.filter(r => r.id !== ressourceId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
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
            <p className="text-white font-bold text-sm">CodeXLMS</p>
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
          <Link to="/enseignant/ressources" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm">
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Ressources</h1>
          <p className="text-gray-400 mb-8">Déposez et gérez les supports de cours pour vos étudiants.</p>

          {/* Formulaire + liste */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carte formulaire */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-400" />
                Nouvelle ressource
              </h2>

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Module */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Module</label>
                  <select
                    value={formData.module_id}
                    onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                    required
                  >
                    <option value="">Sélectionner un module</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} — {m.titre}</option>
                    ))}
                  </select>
                </div>

                {/* Type de ressource */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type de ressource</label>
                  <div className="flex flex-wrap gap-2">
                    {['pdf', 'video', 'code', 'lien', 'autre'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          formData.type === t
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-gray-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t === 'pdf' && <FileImage size={16} />}
                        {t === 'video' && <Video size={16} />}
                        {t === 'code' && <Code size={16} />}
                        {t === 'lien' && <LinkIcon size={16} />}
                        {t === 'autre' && <FileText size={16} />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fichier */}
                {formData.type !== 'lien' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Fichier</label>
                    <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept={
                          formData.type === 'pdf' ? '.pdf' :
                          formData.type === 'video' ? '.mp4,.webm' :
                          formData.type === 'code' ? '.py,.js,.java,.zip' : '*'
                        }
                      />
                      <Upload size={24} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-gray-400 text-sm">Cliquez pour téléverser</p>
                      <p className="text-gray-600 text-xs mt-1">
                        {formData.type === 'pdf' ? 'PDF · max 50 Mo' :
                         formData.type === 'video' ? 'Vidéo · max 200 Mo' : 'Fichier'}
                      </p>
                    </div>
                    {formData.fichier && (
                      <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {formData.fichier.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">URL du lien</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    />
                  </div>
                )}

                {/* Nom affiché */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nom affiché</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Nom de la ressource"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Publication...' : 'Publier la ressource'}
                </button>
              </form>
            </div>

            {/* Liste des ressources */}
            <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-400" />
                Ressources publiées
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                  {ressources.length}
                </span>
              </h2>

              {ressources.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Aucune ressource publiée pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {ressources.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        {r.type === 'pdf' && <FileImage size={20} className="text-red-400" />}
                        {r.type === 'video' && <Video size={20} className="text-blue-400" />}
                        {r.type === 'code' && <Code size={20} className="text-green-400" />}
                        {(r.type === 'lien' || r.type === 'autre') && <FileText size={20} className="text-purple-400" />}
                        <div>
                          <h4 className="text-white font-semibold text-sm">{r.titre}</h4>
                          <p className="text-gray-400 text-xs">
                            {r.module_code} - {r.module_titre}
                            {r.taille_mo ? ` · ${r.taille_mo} Mo` : ''}
                            {r.duree_min ? ` · ${r.duree_min} min` : ''}
                            {' · '}{new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400">
                            <Download size={18} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
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

export default EnseignantRessources;