import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  Users, BookOpen, FileText, Target, TrendingUp, BarChart3,
  Layers, GraduationCap, LogOut, ShieldCheck, Megaphone, Clock,
  AlertCircle, Eye, MessageCircle
} from 'lucide-react';

interface DashboardData {
  total_etudiants: number;
  total_enseignants: number;
  total_admins: number;
  total_users: number;
  comptes_suspendus: number;
  total_modules: number;
  total_ressources: number;
  total_annonces: number;
  total_quiz: number;
  total_tentatives: number;
  derniers_utilisateurs: any[];
  dernieres_annonces: any[];
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    api.get<DashboardData>('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar Admin */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CodexLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ADMINISTRATEUR</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Administration</p>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Users size={18} /> Utilisateurs</Link>
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communalité</p>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><TrendingUp size={18} /> Activité</Link>
          <Link to="/admin/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><MessageCircle size={18} /> Forum</Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* En-tête avec alerte dynamique */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-gray-400 mt-1">Vue d'ensemble de la plateforme</p>
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-400" />
            {data && data.comptes_suspendus > 0 ? (
              <p className="text-amber-300 text-sm">
                {data.comptes_suspendus} compte{data.comptes_suspendus > 1 ? 's' : ''} suspendu{data.comptes_suspendus > 1 ? 's' : ''} — à examiner dans la gestion des utilisateurs.
              </p>
            ) : (
              <p className="text-amber-300 text-sm">Tous les comptes sont actifs. Pilotez les utilisateurs, modules et activité de CodexLMS.</p>
            )}
          </div>
        </div>

        {/* Cartes statistiques (6) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <Users size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_etudiants}</p>
            <p className="text-gray-400 text-xs">Étudiants</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <GraduationCap size={24} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_enseignants}</p>
            <p className="text-gray-400 text-xs">Enseignants</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <BookOpen size={24} className="text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_modules}</p>
            <p className="text-gray-400 text-xs">Modules</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <FileText size={24} className="text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_ressources}</p>
            <p className="text-gray-400 text-xs">Ressources</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <Megaphone size={24} className="text-indigo-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_annonces}</p>
            <p className="text-gray-400 text-xs">Annonces</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
            <Target size={24} className="text-rose-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.total_quiz} — {data?.total_tentatives}</p>
            <p className="text-gray-400 text-xs">Quiz — Tentatives</p>
          </div>
        </div>

        {/* Derniers utilisateurs & Annonces récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Derniers utilisateurs */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Derniers utilisateurs</h3>
              <Link to="/admin/users" className="text-purple-400 text-sm hover:text-purple-300">Tous →</Link>
            </div>
            <div className="space-y-3">
              {data?.derniers_utilisateurs?.slice(0, 5).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{u.prenom} {u.nom}</p>
                    <p className="text-gray-400 text-xs">{u.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {u.role === 'admin' ? 'Admin' : u.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Annonces récentes */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Annonces récentes</h3>
              <Link to="/annonces" className="text-purple-400 text-sm hover:text-purple-300">Toutes →</Link>
            </div>
            <div className="space-y-3">
              {data?.dernieres_annonces?.map((annonce: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-b-0">
                  <div className={`p-2 rounded-lg ${annonce.type === 'urgent' ? 'bg-red-500/20' : annonce.type === 'important' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                    <AlertCircle size={16} className={annonce.type === 'urgent' ? 'text-red-400' : annonce.type === 'important' ? 'text-amber-400' : 'text-blue-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${annonce.type === 'urgent' ? 'text-red-400' : annonce.type === 'important' ? 'text-amber-400' : 'text-blue-400'}`}>
                        {annonce.type}
                      </span>
                      <span className="text-gray-600 text-xs flex items-center gap-1">
                        <Clock size={12} /> {timeAgo(annonce.created_at)}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-semibold">{annonce.titre}</h4>
                    <p className="text-gray-500 text-xs mt-1">— {annonce.auteur_prenom} {annonce.auteur_nom}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Gestion utilisateurs</h3>
              <p className="text-gray-500 text-sm">Créer, suspendre, attribuer des rôles</p>
            </div>
            <Eye size={20} className="text-gray-500 ml-auto" />
          </Link>
          <Link to="/admin/modules" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={24} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Catalogue modules</h3>
              <p className="text-gray-500 text-sm">Superviser tous les modules</p>
            </div>
            <Eye size={20} className="text-gray-500 ml-auto" />
          </Link>
          <Link to="/admin/moderation" className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Modération forum & annonces</h3>
              <p className="text-gray-500 text-sm">Veiller sur les contenus publiés</p>
            </div>
            <Eye size={20} className="text-gray-500 ml-auto" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;