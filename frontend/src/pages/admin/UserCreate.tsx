import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  Save, ArrowLeft, Users, BookOpen,
  MessageCircle, ShieldCheck, BarChart3, TrendingUp, LogOut,
  UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2,
  Eye, EyeOff
} from 'lucide-react';

const AdminUserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
    role: 'etudiant',
    filiere: '',
    annee: '',
    numero_etudiant: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  //  hadi c est pour Récupérer l'utilisateur connecté 
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        else navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () =>
    user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.nom.trim()) errors.nom = 'Le nom est requis';
    if (!form.prenom.trim()) errors.prenom = 'Le prénom est requis';
    if (!form.email.trim()) errors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email invalide';
    if (!form.mot_de_passe) errors.mot_de_passe = 'Le mot de passe est requis';
    else if (form.mot_de_passe.length < 6) errors.mot_de_passe = 'Au moins 6 caractères';
    if (form.mot_de_passe !== form.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (form.role === 'etudiant') {
      if (!form.numero_etudiant.trim()) errors.numero_etudiant = 'Le numéro étudiant est requis pour un étudiant';
      if (!form.filiere.trim()) errors.filiere = 'La filière est requise pour un étudiant';
      if (!form.annee) errors.annee = 'Le niveau d\'étude est requis pour un étudiant';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    // Préparer les données à envoyer
    const payload: any = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      mot_de_passe: form.mot_de_passe,
      role: form.role,
      filiere: form.filiere || null,
      annee: form.annee || null,
      numero_etudiant: form.numero_etudiant || null,
    };

    try {
      await api.post('/admin/users', payload);
      setSuccess('✅ Utilisateur créé avec succès ! Redirection...');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail?.includes('duplicate key') || detail?.includes('email')) {
        setError('Cet email est déjà utilisé par un autre compte.');
      } else {
        setError(detail || 'Erreur lors de la création');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">GINFLMS</p>
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
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3"></p>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <Link to="/admin/users" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <UserPlus size={24} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Créer un utilisateur</h1>
              <p className="text-gray-400 text-sm mt-1">Ajoutez un nouveau compte à la plateforme</p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-2">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Prénom *</label>
                <input
                  type="text" name="prenom" value={form.prenom} onChange={handleChange}
                  className={`w-full bg-gray-800/50 border ${fieldErrors.prenom ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500`}
                />
                {fieldErrors.prenom && <p className="text-red-400 text-xs mt-1">{fieldErrors.prenom}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nom *</label>
                <input
                  type="text" name="nom" value={form.nom} onChange={handleChange}
                  className={`w-full bg-gray-800/50 border ${fieldErrors.nom ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500`}
                />
                {fieldErrors.nom && <p className="text-red-400 text-xs mt-1">{fieldErrors.nom}</p>}
              </div>
            </div>

            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  className={`w-full bg-gray-800/50 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-purple-500`}
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Mot de passe *</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange}
                    className={`w-full bg-gray-800/50 border ${fieldErrors.mot_de_passe ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-12 pr-10 py-3 text-white outline-none focus:border-purple-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{fieldErrors.mot_de_passe}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Confirmer *</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    className={`w-full bg-gray-800/50 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-12 pr-10 py-3 text-white outline-none focus:border-purple-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            {/* Rôle */}
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
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Filière *</label>
                  <input
                    type="text" name="filiere" value={form.filiere} onChange={handleChange}
                    className={`w-full bg-gray-800/50 border ${fieldErrors.filiere ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500`}
                  />
                  {fieldErrors.filiere && <p className="text-red-400 text-xs mt-1">{fieldErrors.filiere}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Niveau d'étude *</label>
                    <select
                      name="annee"
                      value={form.annee}
                      onChange={handleChange}
                      className={`w-full bg-gray-800/50 border ${fieldErrors.annee ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500`}
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="1">1ère année</option>
                      <option value="2">2ème année</option>
                      <option value="3">3ème année</option>
                      
                    </select>
                    {fieldErrors.annee && <p className="text-red-400 text-xs mt-1">{fieldErrors.annee}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Numéro étudiant *</label>
                    <input
                      type="text" name="numero_etudiant" value={form.numero_etudiant} onChange={handleChange}
                      className={`w-full bg-gray-800/50 border ${fieldErrors.numero_etudiant ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500`}
                    />
                    {fieldErrors.numero_etudiant && <p className="text-red-400 text-xs mt-1">{fieldErrors.numero_etudiant}</p>}
                  </div>
                </div>
              </div>
            )}

            
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {saving ? 'Création en cours...' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminUserCreate;