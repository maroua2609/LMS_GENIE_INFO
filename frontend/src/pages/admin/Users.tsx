import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  Users, Search, GraduationCap, LogOut, BookOpen, FileText,
  MessageCircle, ShieldCheck, BarChart3, TrendingUp, UserPlus,
  Edit, Trash2, EyeOff, Eye, AlertCircle, CheckCircle2, X
} from 'lucide-react';

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'enseignant' | 'etudiant';
  actif: boolean;
  avatar_url?: string;
  numero_etudiant?: string;
  filiere?: string;
  annee?: number;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('tous');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Utilisateur | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get<Utilisateur[]>('/admin/users');
      setUtilisateurs(res.data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  // Filtrage
  const filtered = useMemo(() => {
    let list = utilisateurs;
    if (roleFilter !== 'tous') {
      list = list.filter(u => u.role === roleFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(u =>
        u.nom.toLowerCase().includes(s) ||
        u.prenom.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.numero_etudiant && u.numero_etudiant.toLowerCase().includes(s))
      );
    }
    return list;
  }, [utilisateurs, search, roleFilter]);

  // Actions
  const toggleActif = async (userId: number, actuel: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-actif`);
      setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, actif: !actuel } : u));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la modification du statut.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setUtilisateurs(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
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
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm"><Users size={18} /> Utilisateurs</Link>
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/admin/activite" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><TrendingUp size={18} /> Activité</Link>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Utilisateurs</h1>
            <p className="text-gray-400 mt-1">Gérez les comptes de la plateforme</p>
          </div>
          <Link to="/admin/users/create" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all">
            <UserPlus size={18} />
            Ajouter un utilisateur
          </Link>
        </div>

        {/* Cartes stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <Users size={24} className="text-blue-400 mb-3" />
            <p className="text-3xl font-bold text-white">{utilisateurs.length}</p>
            <p className="text-gray-400 text-sm">Total</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <GraduationCap size={24} className="text-emerald-400 mb-3" />
            <p className="text-3xl font-bold text-white">{utilisateurs.filter(u => u.role === 'enseignant').length}</p>
            <p className="text-gray-400 text-sm">Enseignants</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <Users size={24} className="text-purple-400 mb-3" />
            <p className="text-3xl font-bold text-white">{utilisateurs.filter(u => u.role === 'etudiant').length}</p>
            <p className="text-gray-400 text-sm">Étudiants</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <ShieldCheck size={24} className="text-amber-400 mb-3" />
            <p className="text-3xl font-bold text-white">{utilisateurs.filter(u => !u.actif).length}</p>
            <p className="text-gray-400 text-sm">Suspendus</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou numéro étudiant..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['tous', 'etudiant', 'enseignant', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  roleFilter === role
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {role === 'tous' ? 'Tous' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold">Utilisateur</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-semibold hidden md:table-cell">Email</th>
                <th className="text-center px-6 py-4 text-gray-400 text-sm font-semibold">Rôle</th>
                <th className="text-center px-6 py-4 text-gray-400 text-sm font-semibold hidden md:table-cell">Statut</th>
                <th className="text-center px-6 py-4 text-gray-400 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {u.prenom.charAt(0)}{u.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.prenom} {u.nom}</p>
                        <p className="text-gray-400 text-xs">{u.filiere || ''}{u.annee ? ` · Année ${u.annee}` : ''}</p>
                      </div>
                    </div>
                   </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-400 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                      u.role === 'enseignant' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'enseignant' ? 'Enseignant' : 'Étudiant'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
                    {u.actif ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle2 size={14} /> Actif</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> Suspendu</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleActif(u.id, u.actif)}
                        className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title={u.actif ? 'Suspendre' : 'Réactiver'}
                      >
                        {u.actif ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link to={`/admin/users/${u.id}/edit`} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Modifier">
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">Aucun utilisateur trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de confirmation de suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-2">
              Voulez-vous vraiment supprimer l'utilisateur <span className="font-semibold text-white">{deleteTarget.prenom} {deleteTarget.nom}</span> ?
            </p>
            <p className="text-red-400 text-sm mb-6">Cette action est irréversible. Toutes les données associées seront perdues.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? 'Suppression...' : <><Trash2 size={16} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;