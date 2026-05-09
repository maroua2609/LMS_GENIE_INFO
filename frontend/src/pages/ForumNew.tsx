import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import forumService from '../services/forumService';
import { Navbar } from '../components/common/Navbar';
import { Loading, EmptyState } from '../components/common';
import { Textarea, Button } from '../components/form';
import { ArrowLeft, MessageSquare, ThumbsUp, Send } from 'lucide-react';

const ForumNew: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [sujets, setSujets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSujetTitle, setNewSujetTitle] = useState('');
  const [newSujetContent, setNewSujetContent] = useState('');
  const [showNewSujet, setShowNewSujet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    loadSujets();
  }, [moduleId]);

  const loadSujets = async () => {
    if (!moduleId) return;
    try {
      setIsLoading(true);
      const data = await forumService.getSujetsByModule(parseInt(moduleId));
      setSujets(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSujet = async () => {
    if (!moduleId || !newSujetTitle.trim() || !newSujetContent.trim()) return;

    try {
      setIsSubmitting(true);
      await forumService.createSujet(parseInt(moduleId), newSujetTitle, newSujetContent);
      setNewSujetTitle('');
      setNewSujetContent('');
      setShowNewSujet(false);
      await loadSujets();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
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

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forum de discussion</h1>
          <Button
            onClick={() => setShowNewSujet(!showNewSujet)}
            variant={showNewSujet ? 'secondary' : 'primary'}
          >
            <MessageSquare size={18} className="mr-2 inline" />
            Nouveau sujet
          </Button>
        </div>

        {/* New Subject Form */}
        {showNewSujet && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau sujet</h3>
            <input
              type="text"
              placeholder="Titre du sujet"
              value={newSujetTitle}
              onChange={(e) => setNewSujetTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Textarea
              placeholder="Contenu du sujet"
              value={newSujetContent}
              onChange={(e) => setNewSujetContent(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleCreateSujet}
                loading={isSubmitting}
                variant="primary"
                className="flex-1"
              >
                <Send size={18} className="mr-2 inline" />
                Publier
              </Button>
              <Button
                onClick={() => setShowNewSujet(false)}
                variant="secondary"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loading text="Chargement des sujets..." />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sujets.length === 0 && (
          <EmptyState
            title="Aucun sujet"
            description="Soyez le premier à créer un sujet dans ce forum!"
            icon={<MessageSquare size={48} className="text-gray-400" />}
          />
        )}

        {/* Subjects List */}
        {!isLoading && sujets.length > 0 && (
          <div className="space-y-4">
            {sujets.map((sujet) => (
              <div
                key={sujet.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/forum/${sujet.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {sujet.titre}
                  </h3>
                  {sujet.epingle && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                      📌 Épinglé
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{sujet.contenu}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{sujet.vues} vues</span>
                  <span>{new Date(sujet.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumNew;
