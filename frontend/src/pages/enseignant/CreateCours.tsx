import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  FileText, Save, ArrowLeft, CheckCircle2, PlusCircle, Trash2,
  Video, Code, Link as LinkIcon, FileImage, Upload, BookOpen, Sparkles,
  LogOut, Bell, GraduationCap, Users, BarChart3, TrendingUp, MessageCircle,
  Megaphone, Layers
} from 'lucide-react';

interface RessourceForm {
  titre: string;
  description: string;
  type: 'pdf' | 'video' | 'code' | 'lien' | 'autre';
  url: string;
  langage?: string;
  telechargeable: boolean;
  fichier?: File | null;
}

const EnseignantCreateCours: React.FC = () => {
  const [formData, setFormData] = useState({
    module_id: '',
    titre: '',
    description: '',
    ordre: 1,
    publie: true,
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [ressources, setRessources] = useState<RessourceForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Charger l'utilisateur et les modules
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    api.get<Module[]>('/modules')
      .then(res => setModules(res.data))
      .catch(err => console.error('Erreur chargement modules:', err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddRessource = () => {
    setRessources([
      ...ressources,
      { titre: '', description: '', type: 'pdf', url: '', telechargeable: true, fichier: null },
    ]);
  };

  const handleRemoveRessource = (index: number) => {
    setRessources(ressources.filter((_, i) => i !== index));
  };

  const handleRessourceChange = (index: number, field: string, value: any) => {
    const updated = [...ressources];
    (updated[index] as any)[field] = value;
    setRessources(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...ressources];
    updated[index].fichier = file;
    if (file) updated[index].url = file.name;
    setRessources(updated);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileImage size={16} />;
      case 'video': return <Video size={16} />;
      case 'code': return <Code size={16} />;
      case 'lien': return <LinkIcon size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'border-red-400 bg-red-400/10 text-red-400';
      case 'video': return 'border-blue-400 bg-blue-400/10 text-blue-400';
      case 'code': return 'border-green-400 bg-green-400/10 text-green-400';
      case 'lien': return 'border-purple-400 bg-purple-400/10 text-purple-400';
      default: return 'border-slate-400 bg-slate-400/10 text-slate-400';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id || !formData.titre) {
      setError('Veuillez sélectionner un module et saisir un titre');
      return;
    }

    setIsLoading(true);
    try {
      const coursRes = await api.post('/cours', {
        module_id: parseInt(formData.module_id),
        titre: formData.titre,
        description: formData.description,
        ordre: parseInt(formData.ordre.toString()),
        publie: formData.publie,
      });

      const coursId = coursRes.data.id;

      for (const ressource of ressources) {
        if (!ressource.titre) continue;

        const formDataRessource = new FormData();
        formDataRessource.append('cours_id', coursId.toString());
        formDataRessource.append('titre', ressource.titre);
        formDataRessource.append('description', ressource.description || '');
        formDataRessource.append('type', ressource.type);
        formDataRessource.append('langage', ressource.langage || '');
        formDataRessource.append('telechargeable', ressource.telechargeable ? 'true' : 'false');

        if (ressource.fichier) {
          formDataRessource.append('fichier', ressource.fichier);
        } else if (ressource.url) {
          formDataRessource.append('url', ressource.url);
        }

        await api.post('/ressources', formDataRessource, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/enseignant/cours'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du cours');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ========== SIDEBAR ENSEIGNANT ========== */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-slate-900/30 border-r border-slate-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CodexLMS</p>
            <p className="text-slate-500 text-xs">ESPACE ENSEIGNANT</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Enseignement</p>
          <Link to="/enseignant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium text-sm transition-all">
            <BarChart3 size={18} /> Tableau de bord
          </Link>
          <Link to="/enseignant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium text-sm transition-all">
            <BookOpen size={18} /> Mes modules
          </Link>
          <Link to="/enseignant/cours/create" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm">
            <FileText size={18} /> Ressources
          </Link>
          <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium text-sm transition-all">
            <Megaphone size={18} /> Annonces
          </Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium text-sm transition-all">
            <Users size={18} /> Étudiants
          </Link>
          <Link to="/forum/1" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium text-sm transition-all">
            <MessageCircle size={18} /> Forum
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitiales()}
            </div>
            <div>
              <p className="text-white text-sm">{user?.prenom} {user?.nom}</p>
              <p className="text-slate-500 text-xs">Enseignant</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 text-sm flex items-center gap-1 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative">
        {/* Fond décoratif */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-[128px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Retour */}
          <Link
            to="/enseignant/modules"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Retour à mes modules
          </Link>

          {/* Card principale */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-b border-slate-800/50 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles size={26} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Créer un nouveau cours</h1>
                  <p className="text-slate-400 text-sm mt-0.5">Ajoutez du contenu et importez des ressources</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Messages */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  {error}
                </div>
              )}

              {isSuccess && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  Cours créé avec succès ! Redirection...
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Module + Ordre */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Module <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        name="module_id"
                        value={formData.module_id}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                        required
                        disabled={isLoading || isSuccess}
                      >
                        <option value="">Sélectionner un module</option>
                        {modules.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} — {m.titre}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Ordre</label>
                    <input
                      type="number"
                      name="ordre"
                      value={formData.ordre}
                      onChange={handleChange}
                      min={1}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-center"
                      disabled={isLoading || isSuccess}
                    />
                  </div>
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Titre du cours <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    placeholder="Ex: Introduction aux algorithmes"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    required
                    disabled={isLoading || isSuccess}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez le contenu du cours, les objectifs pédagogiques..."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    disabled={isLoading || isSuccess}
                  />
                </div>

                {/* Publication (toggle) */}
                <label className="flex items-center gap-3 cursor-pointer bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="publie"
                      checked={formData.publie}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isLoading || isSuccess}
                    />
                    <div className="w-12 h-7 bg-slate-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full peer-checked:translate-x-5 transition-transform shadow-md"></div>
                  </div>
                  <div>
                    <span className="text-slate-200 text-sm font-semibold">Publier immédiatement</span>
                    <p className="text-slate-500 text-xs mt-0.5">Le cours sera visible par les étudiants</p>
                  </div>
                </label>

                {/* Ressources */}
                <div className="border-t border-slate-800 pt-8 mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Ressources pédagogiques</h3>
                      <p className="text-slate-500 text-sm mt-1">{ressources.length} ressource(s) ajoutée(s)</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRessource}
                      className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-5 py-3 rounded-2xl text-sm font-semibold border border-emerald-500/20 hover:border-emerald-500/30 transition-all"
                    >
                      <PlusCircle size={18} />
                      Ajouter
                    </button>
                  </div>

                  {ressources.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-2xl">
                      <Upload size={40} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Aucune ressource pour le moment</p>
                      <p className="text-slate-600 text-xs mt-1">Cliquez sur "Ajouter" pour commencer</p>
                    </div>
                  )}

                  {/* Liste des ressources */}
                  <div className="space-y-4">
                    {ressources.map((ressource, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all"
                      >
                        {/* En-tête ressource */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                              <span className="text-slate-300 font-bold text-sm">{index + 1}</span>
                            </div>
                            <h4 className="text-white font-semibold">Ressource {index + 1}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRessource(index)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Type */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                              Type de ressource
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(['pdf', 'video', 'code', 'lien', 'autre'] as const).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => handleRessourceChange(index, 'type', type)}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                    ressource.type === type
                                      ? getTypeColor(type) + ' border-current shadow-lg'
                                      : 'border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500'
                                  }`}
                                >
                                  {getTypeIcon(type)}
                                  {type === 'pdf' ? 'PDF' : type === 'video' ? 'Vidéo' : type === 'code' ? 'Code' : type === 'lien' ? 'Lien' : 'Autre'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Titre ressource */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Titre
                            </label>
                            <input
                              type="text"
                              value={ressource.titre}
                              onChange={(e) => handleRessourceChange(index, 'titre', e.target.value)}
                              placeholder="Ex: Slides du chapitre 1"
                              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm"
                            />
                          </div>

                          {/* Description ressource */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Description
                            </label>
                            <textarea
                              value={ressource.description}
                              onChange={(e) => handleRessourceChange(index, 'description', e.target.value)}
                              placeholder="Brève description..."
                              rows={2}
                              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm resize-none"
                            />
                          </div>

                          {/* Upload fichier */}
                          {ressource.type !== 'lien' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                📤 Importer depuis votre PC
                              </label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                  className="w-full text-white text-sm file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer transition-all"
                                  accept={
                                    ressource.type === 'pdf' ? '.pdf' :
                                    ressource.type === 'video' ? '.mp4,.webm,.avi' :
                                    ressource.type === 'code' ? '.py,.js,.java,.cpp,.c,.ts,.jsx,.tsx,.html,.css,.sql' :
                                    '*'
                                  }
                                />
                              </div>
                              {ressource.fichier && (
                                <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs">
                                  <CheckCircle2 size={14} />
                                  {ressource.fichier.name}
                                </div>
                              )}
                            </div>
                          )}

                          {/* URL lien */}
                          {ressource.type === 'lien' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                🔗 URL du lien
                              </label>
                              <input
                                type="url"
                                value={ressource.url}
                                onChange={(e) => handleRessourceChange(index, 'url', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm"
                              />
                            </div>
                          )}

                          {/* Langage (code) */}
                          {ressource.type === 'code' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Langage de programmation
                              </label>
                              <select
                                value={ressource.langage || ''}
                                onChange={(e) => handleRessourceChange(index, 'langage', e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
                              >
                                <option value="">Sélectionner un langage</option>
                                <option value="Python">Python</option>
                                <option value="Java">Java</option>
                                <option value="JavaScript">JavaScript</option>
                                <option value="TypeScript">TypeScript</option>
                                <option value="C">C</option>
                                <option value="C++">C++</option>
                                <option value="SQL">SQL</option>
                                <option value="HTML/CSS">HTML/CSS</option>
                                <option value="PHP">PHP</option>
                              </select>
                            </div>
                          )}

                          {/* Téléchargeable */}
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ressource.telechargeable}
                              onChange={(e) => handleRessourceChange(index, 'telechargeable', e.target.checked)}
                              className="w-5 h-5 rounded-lg accent-emerald-500"
                            />
                            <span className="text-slate-400 text-sm">Les étudiants peuvent télécharger cette ressource</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bouton Enregistrer */}
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-500 transform active:scale-[0.98] flex items-center justify-center gap-3 ${
                    isSuccess
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Création en cours...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 size={24} />
                      Cours créé avec succès !
                    </>
                  ) : (
                    <>
                      <Save size={22} />
                      Enregistrer le cours
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnseignantCreateCours;