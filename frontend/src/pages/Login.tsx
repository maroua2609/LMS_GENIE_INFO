import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import { LoginResponse, User } from '../types';
import { Eye, EyeOff, GraduationCap, ArrowRight, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Connexion
      const response = await api.post<LoginResponse>('/auth/login', { email, mot_de_passe });
      
      // 2. Stocker les tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      // 3. Récupérer le profil utilisateur
      const userRes = await api.get<User>('/auth/me');
      const user = userRes.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);

      setIsSuccess(true);

      // 4. Redirection selon le rôle
      setTimeout(() => {
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'enseignant':
            navigate('/enseignant/dashboard');
            break;
          case 'etudiant':
            navigate('/etudiant/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }, 1200);

    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Email ou mot de passe incorrect' : 'Erreur de connexion au serveur');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grille subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Card principale */}
      <div className="relative w-full max-w-5xl min-h-[600px] grid lg:grid-cols-2 bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-10">
        
        {/* Partie gauche - Branding */}
        <div className="hidden lg:flex p-12 flex-col justify-center bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-r border-white/5">
          
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-wider text-sm uppercase">LMS Génie Info</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Centralisez votre<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                apprentissage
              </span>
            </h2>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Accédez à vos cours, ressources, quiz et suivez votre progression en temps réel.
            </p>

            {/* Info rôles */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl">👨‍🎓</span>
                <div>
                  <p className="text-white text-sm font-medium">Étudiant</p>
                  <p className="text-slate-400 text-xs">Accès aux cours et quiz</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl">👨‍🏫</span>
                <div>
                  <p className="text-white text-sm font-medium">Enseignant</p>
                  <p className="text-slate-400 text-xs">Gestion des cours et évaluations</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="text-white text-sm font-medium">Administrateur</p>
                  <p className="text-slate-400 text-xs">Gestion complète de la plateforme</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partie droite - Formulaire */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
            <p className="text-slate-400 text-sm">Connectez-vous pour accéder à votre espace</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@ecole.ma"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={mot_de_passe}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  required
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-500 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                isSuccess 
                  ? 'bg-green-500 shadow-green-500/20' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 size={20} />
                  Connecté avec succès
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              <span className="text-xs text-slate-500">Connexion sécurisée</span>
            </div>
            <span className="text-xs text-slate-600">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;