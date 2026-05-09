import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut, Home, BookOpen, MessageSquare, Megaphone } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">LMS</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">LMS Génie Info</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
              <Home size={18} />
              <span>Tableau de bord</span>
            </button>
            <button onClick={() => navigate('/modules')} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
              <BookOpen size={18} />
              <span>Modules</span>
            </button>
            <button onClick={() => navigate('/annonces')} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
              <Megaphone size={18} />
              <span>Annonces</span>
            </button>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              {user?.avatar_url && (
                <img src={user.avatar_url} alt={user.prenom} className="w-8 h-8 rounded-full" />
              )}
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
                <p className="text-gray-500">{user?.role}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
