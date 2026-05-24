import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  Save, ArrowLeft, CheckCircle2, PlusCircle, Trash2,
  Video, Code, Link as LinkIcon, FileImage, Upload, BookOpen, Sparkles
} from 'lucide-react';

interface RessourceForm {
  id?: number;            
  titre: string;
  description: string;
  type: 'pdf' | 'video' | 'code' | 'lien' | 'autre';
  url: string;
  langage?: string;
  telechargeable: boolean;
  fichier?: File | null;
}

const EnseignantEditCours: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    module_id: '',
    titre: '',
    description: '',
    ordre: 1,
    publie: true,
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [ressources, setRessources] = useState<RessourceForm[]>([]);
  const [originalRessources, setOriginalRessources] = useState<RessourceForm[]>([]); // copie pour comparaison
  const [originalIds, setOriginalIds] = useState<number[]>([]); // IDs d'origine pour suppression
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursRes, modulesRes] = await Promise.all([
          api.get(`/cours/${id}`),
          api.get<Module[]>('/modules'),
        ]);
        const cours = coursRes.data.cours;
        setFormData({
          module_id: cours.module_id.toString(),
          titre: cours.titre,
          description: cours.description || '',
          ordre: cours.ordre,
          publie: cours.publie,
        });
        setModules(modulesRes.data);

        
        const ressourcesRes = await api.get(`/cours/${id}/ressources`);
        const ressourcesData = ressourcesRes.data.map((r: any) => ({
          id: r.id,
          titre: r.titre,
          description: r.description || '',
          type: r.type,
          url: r.url || '',
          langage: r.langage || '',
          telechargeable: r.telechargeable,
          fichier: null,
        }));
        setRessources(ressourcesData);
        setOriginalRessources(JSON.parse(JSON.stringify(ressourcesData))); // copie profonde
        setOriginalIds(ressourcesData.map((r: any) => r.id));
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du cours.');
      } finally {
        setPageLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

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
    const updated = [...ressources];
    updated.splice(index, 1);
    setRessources(updated);
  };

  const handleRessourceChange = (index: number, field: string, value: any) => {
    const updated = [...ressources];
    (updated[index] as any)[field] = value;
    setRessources(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...ressources];
    updated[index].fichier = file;
    if (file) updated[index].url = file.name; // indicatif
    setRessources(updated);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileImage size={16} />;
      case 'video': return <Video size={16} />;
      case 'code': return <Code size={16} />;
      case 'lien': return <LinkIcon size={16} />;
      default: return <FileImage size={16} />;
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

  // Mettre à jour une ressource existante
  const updateRessource = async (ressource: RessourceForm) => {
    const formData = new FormData();
    formData.append('titre', ressource.titre);
    formData.append('description', ressource.description || '');
    formData.append('type', ressource.type);
    formData.append('url', ressource.url || '');
    formData.append('langage', ressource.langage || '');
    formData.append('telechargeable', ressource.telechargeable ? 'true' : 'false');

    if (ressource.fichier) {
      formData.append('fichier', ressource.fichier);
    }

    await api.put(`/ressources/${ressource.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.module_id || !formData.titre) {
      setError('Module et titre sont obligatoires.');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Mettre à jour le cours
      await api.put(`/cours/${id}`, {
        module_id: parseInt(formData.module_id),
        titre: formData.titre,
        description: formData.description,
        ordre: parseInt(formData.ordre.toString()),
        publie: formData.publie,
      });

      // 2. Supprimer les ressources absentes de la liste finale
      const currentIds = ressources.filter(r => r.id).map(r => r.id);
      const toDelete = originalIds.filter(id => !currentIds.includes(id));
      for (const resId of toDelete) {
        await api.delete(`/ressources/${resId}`);
      }

      // 3. Mettre à jour les ressources existantes modifiées
      for (const ressource of ressources) {
        if (ressource.id) {
          // Trouver la version originale
          const original = originalRessources.find(r => r.id === ressource.id);
          // Comparer rapidement (on ignore le fichier pour la comparaison, mais on traite le fichier via updateRessource)
          const hasChanged = original && (
            original.titre !== ressource.titre ||
            original.description !== ressource.description ||
            original.type !== ressource.type ||
            original.url !== ressource.url ||
            original.langage !== ressource.langage ||
            original.telechargeable !== ressource.telechargeable ||
            ressource.fichier !== null // un nouveau fichier a été choisi
          );
          if (hasChanged) {
            await updateRessource(ressource);
          }
        } else {
          // 4. Ajouter les nouvelles ressources
          if (!ressource.titre) continue;

          const formDataRessource = new FormData();
          formDataRessource.append('cours_id', id!);
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
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/enseignant/cours'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/enseignant/cours" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retour à mes cours
        </Link>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-b border-slate-800/50 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Modifier le cours</h1>
                <p className="text-slate-400 text-sm mt-0.5">Modifiez le contenu et les ressources</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
                <span className="text-xl">⚠️</span> {error}
              </div>
            )}
            {isSuccess && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
                <CheckCircle2 size={20} /> Cours mis à jour avec succès ! Redirection...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Module + Ordre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Module <span className="text-red-400">*</span></label>
                  <select
                    name="module_id"
                    value={formData.module_id}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                    required
                    disabled={isLoading || isSuccess}
                  >
                    <option value="">Sélectionner un module</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} — {m.titre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Ordre</label>
                  <input
                    type="number"
                    name="ordre"
                    value={formData.ordre}
                    onChange={handleChange}
                    min={1}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 transition-all text-center"
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Titre du cours <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Introduction aux algorithmes"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
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
                  placeholder="Décrivez le contenu du cours..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all resize-none"
                  disabled={isLoading || isSuccess}
                />
              </div>

              {/* Publication */}
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
                    <h3 className="text-lg font-bold text-white">Ressources ({ressources.length})</h3>
                    <p className="text-slate-500 text-sm mt-1">Gérez les supports du cours</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRessource}
                    className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-5 py-3 rounded-2xl text-sm font-semibold border border-emerald-500/20 hover:border-emerald-500/30 transition-all"
                  >
                    <PlusCircle size={18} /> Ajouter une ressource
                  </button>
                </div>

                {ressources.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">Aucune ressource pour ce cours.</p>
                )}

                <div className="space-y-4">
                  {ressources.map((res, index) => (
                    <div key={res.id || `new-${index}`} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-semibold">
                          {res.id ? `Ressource existante #${res.id}` : `Nouvelle ressource #${index + 1}`}
                        </h4>
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
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Type</label>
                          <div className="flex flex-wrap gap-2">
                            {(['pdf', 'video', 'code', 'lien', 'autre'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleRessourceChange(index, 'type', type)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                  res.type === type
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

                        {/* Titre */}
                        <div>
                          <input
                            type="text"
                            value={res.titre}
                            onChange={(e) => handleRessourceChange(index, 'titre', e.target.value)}
                            placeholder="Titre de la ressource"
                            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm"
                          />
                        </div>

                        {/* Description */}
                        <textarea
                          value={res.description}
                          onChange={(e) => handleRessourceChange(index, 'description', e.target.value)}
                          placeholder="Brève description..."
                          rows={2}
                          className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm resize-none"
                        />

                        {/* Fichier / URL */}
                        {res.id && !res.fichier ? (
                          <>
                            <p className="text-sm text-slate-400">URL actuelle : {res.url || 'aucune'}</p>
                            <div>
                              <label className="block text-xs text-slate-400 mb-2">📤 Remplacer le fichier (optionnel)</label>
                              <input
                                type="file"
                                onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white"
                              />
                              {res.fichier && <p className="text-emerald-400 text-xs mt-1">{res.fichier.name}</p>}
                            </div>
                          </>
                        ) : (
                          <>
                            {res.type !== 'lien' ? (
                              <div>
                                <label className="block text-xs text-slate-400 mb-2">📤 Importer un fichier</label>
                                <input
                                  type="file"
                                  onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                  className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white"
                                />
                                {res.fichier && <p className="text-emerald-400 text-xs mt-1">{res.fichier.name}</p>}
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs text-slate-400 mb-2">🔗 URL</label>
                                <input
                                  type="url"
                                  value={res.url}
                                  onChange={(e) => handleRessourceChange(index, 'url', e.target.value)}
                                  placeholder="https://..."
                                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all text-sm"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Téléchargeable */}
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                          <input
                            type="checkbox"
                            checked={res.telechargeable}
                            onChange={(e) => handleRessourceChange(index, 'telechargeable', e.target.checked)}
                            className="accent-emerald-500"
                          /> Téléchargeable
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                    Mise à jour en cours...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 size={24} />
                    Cours mis à jour !
                  </>
                ) : (
                  <>
                    <Save size={22} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnseignantEditCours;