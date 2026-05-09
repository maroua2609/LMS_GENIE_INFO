import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/config';
import { 
  FileText, PlusCircle, Edit, Trash2, Eye, EyeOff, Search, 
  Video, Code, Link as LinkIcon, FileImage, BookOpen, ChevronDown, ChevronUp, ExternalLink, Download
} from 'lucide-react';

interface CoursEnseignant {
  id: number;
  module_id: number;
  titre: string;
  description: string;
  ordre: number;
  publie: boolean;
  module_titre: string;
  module_code: string;
  couleur: string;
  created_at: string;
}

interface Ressource {
  id: number;
  cours_id: number;
  titre: string;
  description: string;
  type: 'pdf' | 'video' | 'code' | 'lien' | 'autre';
  url: string;
  langage?: string;
  telechargeable: boolean;
}

const EnseignantMesCours: React.FC = () => {
  const [cours, setCours] = useState<CoursEnseignant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCours, setExpandedCours] = useState<number | null>(null);
  const [ressources, setRessources] = useState<Record<number, Ressource[]>>({});
  const [loadingRessources, setLoadingRessources] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCours();
  }, []);

  const fetchCours = async () => {
    try {
      const res = await api.get<CoursEnseignant[]>('/enseignant/cours');
      setCours(res.data);
    } catch (err) {
      console.error('Erreur chargement cours:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRessources = async (coursId: number) => {
    if (ressources[coursId]) return; // Déjà chargé
    
    setLoadingRessources((prev) => ({ ...prev, [coursId]: true }));
    try {
      const res = await api.get<Ressource[]>(`/cours/${coursId}/ressources`);
      setRessources((prev) => ({ ...prev, [coursId]: res.data }));
    } catch (err) {
      console.error('Erreur chargement ressources:', err);
    } finally {
      setLoadingRessources((prev) => ({ ...prev, [coursId]: false }));
    }
  };

  const toggleExpand = (coursId: number) => {
    if (expandedCours === coursId) {
      setExpandedCours(null);
    } else {
      setExpandedCours(coursId);
      fetchRessources(coursId);
    }
  };

  const handleDelete = async (coursId: number) => {
    if (!confirm('Supprimer ce cours et toutes ses ressources ?')) return;
    try {
      await api.delete(`/cours/${coursId}`);
      setCours(cours.filter((c) => c.id !== coursId));
      setExpandedCours(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublier = async (coursId: number) => {
    try {
      const res = await api.put(`/cours/${coursId}/publier`);
      setCours(cours.map((c) => (c.id === coursId ? { ...c, publie: res.data.publie } : c)));
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileImage size={18} className="text-red-400" />;
      case 'video': return <Video size={18} className="text-blue-400" />;
      case 'code': return <Code size={18} className="text-green-400" />;
      case 'lien': return <LinkIcon size={18} className="text-purple-400" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-500/20 text-red-400';
      case 'video': return 'bg-blue-500/20 text-blue-400';
      case 'code': return 'bg-green-500/20 text-green-400';
      case 'lien': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const filteredCours = cours.filter((c) =>
    c.titre.toLowerCase().includes(search.toLowerCase()) ||
    c.module_code.toLowerCase().includes(search.toLowerCase()) ||
    c.module_titre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link to="/enseignant/dashboard" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Retour au tableau de bord
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Mes cours</h1>
              <p className="text-slate-400 mt-2">{cours.length} cours créés</p>
            </div>
            <Link
              to="/enseignant/cours/create"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle size={20} />
              Créer un cours
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Recherche */}
        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, code module..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Liste des cours */}
        {filteredCours.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={64} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun cours</h3>
            <p className="text-slate-500 mb-6">Vous n'avez pas encore créé de cours</p>
            <Link
              to="/enseignant/cours/create"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <PlusCircle size={20} />
              Créer mon premier cours
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCours.map((c) => (
              <div key={c.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                {/* En-tête du cours */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ backgroundColor: c.couleur + '20' }}
                      >
                        <BookOpen size={20} style={{ color: c.couleur }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-lg">{c.titre}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            c.publie ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {c.publie ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: c.couleur }}>
                          {c.module_code} - {c.module_titre}
                        </p>
                        {c.description && (
                          <p className="text-slate-500 text-sm mb-2">{c.description}</p>
                        )}
                        <p className="text-slate-600 text-xs">
                          Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')} • Ordre : {c.ordre}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="Voir les ressources"
                      >
                        {expandedCours === c.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <button
                        onClick={() => handleTogglePublier(c.id)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                        title={c.publie ? 'Dépublier' : 'Publier'}
                      >
                        {c.publie ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <Link
                        to={`/enseignant/cours/${c.id}/edit`}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ressources (expandable) */}
                {expandedCours === c.id && (
                  <div className="border-t border-slate-800 bg-slate-900/30 p-5">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <FileText size={18} />
                      Ressources du cours
                    </h4>

                    {loadingRessources[c.id] ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                      </div>
                    ) : ressources[c.id]?.length === 0 || !ressources[c.id] ? (
                      <div className="text-center py-8">
                        <FileText size={32} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-3">Aucune ressource pour ce cours</p>
                        <Link
                          to={`/enseignant/cours/${c.id}/edit`}
                          className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                        >
                          + Ajouter une ressource
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ressources[c.id]?.map((ressource) => (
                          <div
                            key={ressource.id}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              {getTypeIcon(ressource.type)}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(ressource.type)}`}>
                                {ressource.type.toUpperCase()}
                              </span>
                            </div>
                            <h5 className="text-white font-medium text-sm mb-1">{ressource.titre}</h5>
                            {ressource.description && (
                              <p className="text-slate-500 text-xs mb-2">{ressource.description}</p>
                            )}
                            {ressource.langage && (
                              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded mr-2">
                                {ressource.langage}
                              </span>
                            )}
                            {ressource.url && (
                              <a
                                href={ressource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-2"
                              >
                                {ressource.type === 'lien' ? (
                                  <><ExternalLink size={12} /> Visiter</>
                                ) : (
                                  <><Download size={12} /> {ressource.telechargeable ? 'Télécharger' : 'Consulter'}</>
                                )}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnseignantMesCours;