import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/config';
import { User, Module } from '../types';
import { BookOpen, GraduationCap, LogOut, Bell } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const [userRes, modulesRes] = await Promise.all([
        api.get<User>('/auth/me'),
        api.get<Module[]>('/modules'),
      ]);
      setUser(userRes.data);
      setModules(modulesRes.data);
    } catch (err: any) {
      console.error('Erreur:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        navigate('/login');
      } else {
        setError('Impossible de charger les données. Vérifiez que le serveur est démarré.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LMS</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">LMS Génie Info</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/annonces"
              className="text-gray-600 hover:text-blue-600 transition relative"
            >
              <Bell size={20} />
            </Link>
            
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user.prenom} {user.nom}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user.prenom.charAt(0)}{user.nom.charAt(0)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* En-tête */}
        {user && !error && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Bienvenue, {user.prenom} ! <span className="text-2xl">😊</span>
            </h2>
            <p className="text-gray-600 mt-2">
              Voici vos modules pour cette année académique
            </p>
          </div>
        )}

        {/* Grille des modules */}
        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
              >
                {/* Bandeau coloré */}
                <div
                  className="h-2"
                  style={{ backgroundColor: module.couleur || '#3B82F6' }}
                ></div>
                
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition">
                        {module.titre}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium">{module.code}</p>
                    </div>
                  </div>
                  
                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {module.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <GraduationCap size={14} />
                      <span>{module.credits} crédits</span>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      S{module.semestre}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Aucun module */}
        {!error && modules.length === 0 && !loading && (
          <div className="text-center py-16">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun module disponible</h3>
            <p className="text-gray-500">Vous n'êtes inscrit à aucun module pour le moment.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;