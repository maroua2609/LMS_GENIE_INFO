import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/config';
import { Cours, Ressource } from '../types';
import { FileText, Video, Code, Link as LinkIcon, Download, ArrowLeft } from 'lucide-react';

const CoursDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cours, setCours] = useState<Cours | null>(null);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ressources' | 'description'>('ressources');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursRes, ressourcesRes] = await Promise.all([
          api.get<Cours>(`/cours/${id}`),
          api.get<Ressource[]>(`/cours/${id}/ressources`),
        ]);
        setCours(coursRes.data);
        setRessources(ressourcesRes.data);
      } catch (err) {
        console.error('Erreur de chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const getIconeRessource = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" size={24} />;
      case 'video': return <Video className="text-blue-500" size={24} />;
      case 'code': return <Code className="text-green-500" size={24} />;
      case 'lien': return <LinkIcon className="text-purple-500" size={24} />;
      default: return <FileText className="text-gray-500" size={24} />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'code': return 'bg-green-100 text-green-800';
      case 'lien': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cours) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Cours non trouvé</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 block">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link to={`/modules/${cours.module_id}`} className="text-blue-600 hover:underline flex items-center gap-1 mb-4">
            <ArrowLeft size={16} />
            Retour au module
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{cours.titre}</h1>
          {cours.description && (
            <p className="text-gray-600 mt-2">{cours.description}</p>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Onglets */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('ressources')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'ressources'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📚 Ressources ({ressources.length})
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'description'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Description
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'ressources' ? (
          <div>
            {ressources.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune ressource disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ressources.map((ressource) => (
                  <div
                    key={ressource.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {getIconeRessource(ressource.type)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(ressource.type)}`}>
                        {ressource.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2">{ressource.titre}</h3>
                    
                    {ressource.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ressource.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      {ressource.langage && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {ressource.langage}
                        </span>
                      )}
                      
                      {ressource.url && (
                        <a
                          href={ressource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {ressource.type === 'lien' ? 'Visiter' : 'Consulter'}
                          {ressource.telechargeable && <Download size={14} />}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Description du cours</h2>
            <p className="text-gray-700 leading-relaxed">
              {cours.description || "Aucune description disponible pour ce cours."}
            </p>
            
            {/* Métadonnées du cours */}
            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Ordre</span>
                <p className="font-medium">{cours.ordre}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Statut</span>
                <p className={`font-medium ${cours.publie ? 'text-green-600' : 'text-yellow-600'}`}>
                  {cours.publie ? 'Publié' : 'Brouillon'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Créé le</span>
                <p className="font-medium">{new Date(cours.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Mis à jour le</span>
                <p className="font-medium">{new Date(cours.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursDetail;