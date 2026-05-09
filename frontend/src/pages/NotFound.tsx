import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertTriangle size={64} className="text-yellow-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Page non trouvée</h1>
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous cherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Retourner au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default NotFound;
