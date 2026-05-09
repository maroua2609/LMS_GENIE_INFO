import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/config';
import {
  Save, ArrowLeft, GraduationCap, LogOut, BookOpen,
  FileText, MessageCircle, ShieldCheck, BarChart3, TrendingUp, Users,
  Mail, Calendar, AlertCircle, CheckCircle2, XCircle, Lock,
  Eye, EyeOff, RefreshCw
} from 'lucide-react';

const AdminUserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'etudiant',
    filiere: '',
    annee: '',
    numero_etudiant: '',
    actif: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null); // pour la modale de suspension

  // Récupérer l'utilisateur connecté (sidebar)
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setCurrentUser(res.data))
      .catch(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
        else navigate('/login');
      });
  }, [navigate]);

  // Récupérer l'utilisateur à éditer
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/admin/users/${id}`);
        const u = res.data;
        setForm({
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role,
          filiere: u.filiere || '',
          annee: u.annee?.toString() || '',
          numero_etudiant: u.numero_etudiant || '',
          actif: u.actif,
        });
      } catch (err) {
        console.error(err);
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.nom || !form.prenom || !form.email) {
      setError('Veuillez remplir les champs obligatoires.');
      setSaving(false);
      return;
    }

    if (showPasswordFields && password) {
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        setSaving(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload: any = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        role: form.role,
        filiere: form.filiere,
        annee: form.annee || null,
        numero_etudiant: form.numero_etudiant,
      };
      if (showPasswordFields && password) {
        payload.mot_de_passe = password;
      }
      await api.put(`/admin/users/${id}`, payload);
      setSuccess('Utilisateur mis à jour avec succès.');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail?.includes('duplicate key') || detail?.includes('email')) {
        setError('Cet email est déjà utilisé par un autre compte.');
      } else {
        setError(detail || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async () => {
    try {
      await api.put(`/admin/users/${id}/toggle-actif`);
      setForm({ ...form, actif: !form.actif });
      setSuccess(form.actif ? 'Compte suspendu avec succès.' : 'Compte réactivé avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du changement de statut.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar Admin (identique aux autres pages) */}
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
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {currentUser ? `${currentUser.prenom?.charAt(0) || ''}${currentUser.nom?.charAt(0) || ''}` : '??'}
            </div>
            <div><p className="text-white text-sm">{currentUser?.prenom} {currentUser?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <Link to="/admin/users" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>

        <div className="max-w-3xl mx-auto">
          {/* En-tête avec avatar et statut */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {form.prenom?.charAt(0)}{form.nom?.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{form.prenom} {form.nom}</h1>
                <p className="text-gray-400 flex items-center gap-2 mt-1">
                  <Mail size={14} /> {form.email}
                </p>
                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <Calendar size={14} /> ID: {id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDeleteTarget({ nom: form.nom, prenom: form.prenom, actif: form.actif })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                form.actif ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {form.actif ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              {form.actif ? 'Suspendre le compte' : 'Réactiver le compte'}
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-2 animate-pulse">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Prénom *</label>
                <input type="text" name="prenom" value={form.prenom} onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nom *</label>
                <input type="text" name="nom" value={form.nom} onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Rôle</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500">
                <option value="etudiant">Étudiant</option>
                <option value="enseignant">Enseignant</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            {form.role === 'etudiant' && (
              <div className="border-t border-gray-800 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Détails étudiant</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Filière</label>
                  <input type="text" name="filiere" value={form.filiere} onChange={handleChange}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Année / Niveau</label>
                    <select name="annee" value={form.annee} onChange={handleChange}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500">
                      <option value="">-- Non spécifié --</option>
                      <option value="1">1ère année</option>
                      <option value="2">2ème année</option>
                      <option value="3">3ème année</option>
                      <option value="M1">Master 1</option>
                      <option value="M2">Master 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Numéro étudiant</label>
                    <input type="text" name="numero_etudiant" value={form.numero_etudiant} onChange={handleChange}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Changement de mot de passe (optionnel) */}
            <div className="border-t border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                <Lock size={16} />
                {showPasswordFields ? 'Annuler le changement de mot de passe' : 'Changer le mot de passe'}
              </button>
              {showPasswordFields && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-4 pr-10 py-3 text-white outline-none focus:border-purple-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Générer un mot de passe aléatoire
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-4 pr-10 py-3 text-white outline-none focus:border-purple-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>
      </main>

      {/* Modal de confirmation pour suspension/réactivation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Confirmer</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-2">
              {deleteTarget.actif
                ? `Voulez-vous vraiment suspendre le compte de ${deleteTarget.prenom} ${deleteTarget.nom} ?`
                : `Voulez-vous vraiment réactiver le compte de ${deleteTarget.prenom} ${deleteTarget.nom} ?`
              }
            </p>
            <p className="text-amber-400 text-sm mb-6">
              {deleteTarget.actif
                ? "L'utilisateur ne pourra plus se connecter ni accéder à ses cours."
                : "L'utilisateur pourra à nouveau accéder à la plateforme."}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white">
                Annuler
              </button>
              <button onClick={handleToggleActif} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserEdit;