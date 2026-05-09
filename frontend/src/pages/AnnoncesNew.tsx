import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import annonceService from '../services/annonceService';
import { Navbar } from '../components/common/Navbar';
import { Loading, EmptyState } from '../components/common';
import { Annonce } from '../types';
import { ArrowLeft, Megaphone, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const AnnoncesNew: React.FC = () => {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnonces();
  }, []);

  const loadAnnonces = async () => {
    try {
      setIsLoading(true);
      const data = await annonceService.getAnnonces();
      setAnnonces(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
        };
      case 'important':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Retour au tableau de bord</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone size={32} className="text-blue-600" />
            Annonces
          </h1>
          <p className="text-gray-600 mt-2">Restez informé des dernières actualités</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loading text="Chargement des annonces..." />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && annonces.length === 0 && (
          <EmptyState
            title="Aucune annonce"
            description="Il n'y a pas d'annonces pour le moment."
            icon={<Megaphone size={48} className="text-gray-400" />}
          />
        )}

        {/* Announcements List */}
        {!isLoading && annonces.length > 0 && (
          <div className="space-y-4">
            {annonces.map((annonce) => {
              const colors = getTypeColor(annonce.type);
              return (
                <div
                  key={annonce.id}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-6 hover:shadow-md transition`}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`p-3 rounded-lg ${colors.icon}`}>
                      {annonce.type === 'urgent' ? (
                        <AlertCircle size={24} />
                      ) : (
                        <Megaphone size={24} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {annonce.titre}
                        </h3>
                        <div className="flex gap-2">
                          {annonce.epingle && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                              📌 Épinglé
                            </span>
                          )}
                          <span className={`px-3 py-1 ${colors.badge} text-xs rounded-full font-medium uppercase`}>
                            {annonce.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{annonce.contenu}</p>

                      <p className="text-sm text-gray-500">
                        {formatDate(annonce.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnoncesNew;
