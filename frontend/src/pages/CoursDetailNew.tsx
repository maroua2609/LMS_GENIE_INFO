import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moduleService from '../services/moduleService';
import { Navbar } from '../components/common/Navbar';
import { Loading, EmptyState, Card } from '../components/common';
import { Cours, Ressource } from '../types';
import { ArrowLeft, FileText, Video, Code, Link as LinkIcon, Download } from 'lucide-react';

const CoursDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cours, setCours] = useState<Cours | null>(null);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [coursData, ressourcesData] = await Promise.all([
        moduleService.getCoursById(parseInt(id)),
        moduleService.getCoursResources(parseInt(id)),
      ]);
      setCours(coursData);
      setRessources(ressourcesData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'pdf':
        return <FileText {...iconProps} className="text-red-500" />;
      case 'video':
        return <Video {...iconProps} className="text-blue-500" />;
      case 'code':
        return <Code {...iconProps} className="text-green-500" />;
      case 'lien':
        return <LinkIcon {...iconProps} className="text-purple-500" />;
      default:
        return <FileText {...iconProps} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loading text="Chargement du cours..." />
          </div>
        ) : !cours ? (
          <EmptyState title="Cours non trouvé" description="Le cours demandé n'existe pas." />
        ) : (
          <>
            {/* Cours Header */}
            <Card className="p-8 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{cours.titre}</h1>
              {cours.description && (
                <p className="text-gray-600 text-lg mb-4">{cours.description}</p>
              )}
              <div className="flex gap-6 text-sm text-gray-500">
                <span>Ordre: {cours.ordre}</span>
                <span>{cours.publie ? '✓ Publié' : '○ Non publié'}</span>
              </div>
            </Card>

            {/* Resources */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Ressources ({ressources.length})
              </h2>

              {ressources.length === 0 ? (
                <EmptyState
                  title="Aucune ressource"
                  description="Ce cours n'a pas encore de ressources disponibles."
                />
              ) : (
                <div className="grid gap-4">
                  {ressources.map((ressource) => (
                    <Card key={ressource.id} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            {getResourceIcon(ressource.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{ressource.titre}</h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                              {ressource.type}
                            </p>
                          </div>
                        </div>
                        {ressource.url && ressource.telechargeable && (
                          <a
                            href={ressource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            <Download size={16} />
                            Accéder
                          </a>
                        )}
                      </div>

                      {ressource.description && (
                        <p className="text-gray-600 text-sm mb-3">{ressource.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {ressource.taille_mo && <span>Taille: {ressource.taille_mo} Mo</span>}
                        {ressource.duree_min && <span>Durée: {ressource.duree_min} min</span>}
                        {ressource.langage && <span>Langage: {ressource.langage}</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CoursDetailNew;
