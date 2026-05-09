import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/config';
import { Eye, EyeOff, GraduationCap, ArrowRight, Mail, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formData.nom.trim()) return 'Le nom est requis';
    if (!formData.prenom.trim()) return 'Le prénom est requis';
    if (!formData.email.includes('@')) return 'Email invalide';
    if (formData.mot_de_passe.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    if (formData.mot_de_passe !== formData.confirmPassword) return 'Les mots de passe ne correspondent pas';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        role: 'etudiant',
      });

      setIsSuccess(true);

      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'inscription");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-5xl min-h-[650px] grid lg:grid-cols-2 bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-10">
        
        {/* Partie gauche */}
        <div className="hidden lg:flex p-12 flex-col justify-center bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border-r border-white/5">
          
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">LMS Génie Info</h1>
              <p className="text-slate-400 text-xs">Plateforme académique</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Rejoignez la<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              communauté
            </span>
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Créez votre compte pour accéder aux cours, ressources et quiz de la filière Génie Informatique.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-300 text-sm">Accès à tous les modules</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-300 text-sm">Quiz et évaluations</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-300 text-sm">Suivi de progression</span>
            </div>
          </div>
        </div>

        {/* Partie droite - Formulaire */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Inscription</h1>
            <p className="text-slate-400 text-sm">Créez votre compte étudiant</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              Compte créé avec succès ! Redirection...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Votre prénom"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                    required
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                    required
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@ecole.ma"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  placeholder="Min. 6 caractères"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  required
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Répétez le mot de passe"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-500 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                isSuccess 
                  ? 'bg-green-500 shadow-green-500/20' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 size={20} />
                  Compte créé
                </>
              ) : (
                <>
                  S'inscrire
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <p className="mt-6 text-center text-slate-400 text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Se connecter
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              <span className="text-xs text-slate-500">Inscription sécurisée</span>
            </div>
            <span className="text-xs text-slate-600">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;