import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { LoginResponse, User } from '../../types';
import {
  Eye, EyeOff, GraduationCap, ArrowRight, Mail, Lock,
  ShieldCheck, CheckCircle2, KeyRound, ArrowLeft
} from 'lucide-react';

type View = 'login' | 'forgot' | 'code' | 'newpass';

const Login: React.FC = () => {
  const [view, setView] = useState<View>('login');

  // ── Login
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Reset
  const [resetEmail, setResetEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  // ── Connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, mot_de_passe });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      const userRes = await api.get<User>('/auth/me');
      const user = userRes.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);

      setIsSuccess(true);

      setTimeout(() => {
        switch (user.role) {
          case 'admin':      navigate('/admin/dashboard');      break;
          case 'enseignant': navigate('/enseignant/dashboard'); break;
          case 'etudiant':   navigate('/etudiant/dashboard');   break;
          default:           navigate('/dashboard');
        }
      }, 1200);

    } catch (err: any) {
      setError(
        err.response?.status === 401
          ? 'Email ou mot de passe incorrect'
          : 'Erreur de connexion au serveur'
      );
      setIsLoading(false);
    }
  };

  // ── Étape 1 : envoyer le code
  const handleForgotPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      setView('code');
    } catch (err: any) {
      setResetError(err.response?.data?.detail || "Erreur lors de l'envoi. Vérifiez l'adresse email.");
    } finally {
      setResetLoading(false);
    }
  };

  // ── Étape 2 : vérifier le code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await api.get(`/auth/verify-reset-token?token=${code}`);
      setView('newpass');
    } catch {
      setResetError('Code invalide ou expiré.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── Étape 3 : nouveau mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 6) {
      setResetError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Les mots de passe ne correspondent pas');
      return;
    }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: code,
        nouveau_mot_de_passe: newPassword,
      });
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetEmail('');
      setView('login');
      setSuccess('Mot de passe réinitialisé avec succès !');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setResetError(err.response?.data?.detail || 'Erreur lors de la réinitialisation');
    } finally {
      setResetLoading(false);
    }
  };

  const switchToForgot = () => {
    setResetEmail(email);
    setResetError('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setView('forgot');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse"
          style={{ animationDelay: '2s' }} />
      </div>

      {/* Grille subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Card */}
      <div className="relative w-full max-w-5xl min-h-[600px] grid lg:grid-cols-2 bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-10">

        {/* ══ GAUCHE — Branding ══ */}
        <div className="hidden lg:flex p-12 flex-col justify-center bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-r border-white/5">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">LMS Génie Info</h1>
              <p className="text-slate-400 text-xs">Plateforme académique</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Centralisez votre<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              apprentissage
            </span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Accédez à vos cours, ressources, quiz et suivez votre progression en temps réel.
          </p>

          <div className="space-y-3">
            {[
              { emoji: '👨‍🎓', role: 'Étudiant',        desc: 'Cours, quiz, progression' },
              { emoji: '👨‍🏫', role: 'Enseignant',       desc: 'Gestion des cours et évaluations' },
              { emoji: '👑',   role: 'Administrateur', desc: 'Gestion de la plateforme' },
            ].map(({ emoji, role, desc }) => (
              <div key={role} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xl">{emoji}</span>
                <div>
                  <p className="text-white text-sm font-medium">{role}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="p-8 lg:p-12 flex flex-col justify-center">

          
          {view === 'login' && (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
                <p className="text-slate-400 text-sm">Connectez-vous pour accéder à votre espace</p>
              </div>

              {success && (
                <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
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
                    <><CheckCircle2 size={20} /> Connecté avec succès</>
                  ) : (
                    <>Se connecter <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-500" />
                  <span className="text-xs text-slate-500">Connexion sécurisée</span>
                </div>
              </div>
            </>
          )}

          
          {view === 'forgot' && (
            <>
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors w-fit"
              >
                <ArrowLeft size={16} /> Retour à la connexion
              </button>

              <div className="mb-10">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <KeyRound size={28} className="text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Mot de passe oublié</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Entrez votre adresse email. Vous recevrez un <span className="text-white font-medium">code à 6 chiffres</span> pour réinitialiser votre mot de passe.
                </p>
              </div>

              {resetError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="vous@ecole.ma"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {resetLoading
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <>Envoyer le code <ArrowRight size={18} /></>
                  }
                </button>
              </form>
            </>
          )}

          
          {view === 'code' && (
            <>
              <button
                onClick={() => { setView('forgot'); setResetError(''); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors w-fit"
              >
                <ArrowLeft size={16} /> Retour
              </button>

              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Entrez le code</h1>
                <p className="text-slate-400 text-sm">
                  Un code à 6 chiffres a été envoyé à{' '}
                  <span className="text-blue-400 font-medium">{resetEmail}</span>
                </p>
              </div>

              {resetError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-center text-3xl font-bold tracking-[0.6rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    required
                    disabled={resetLoading}
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Vérifiez votre dossier spam si vous ne le trouvez pas.
                    Le code expire dans <span className="text-slate-300">15 minutes</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={code.length < 6 || resetLoading}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resetLoading
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <>Vérifier le code <ArrowRight size={18} /></>
                  }
                </button>

                
                <p className="text-center text-xs text-slate-500">
                  Vous n'avez pas reçu le code ?{' '}
                  <button
                    type="button"
                    onClick={() => handleForgotPassword()}
                    disabled={resetLoading}
                    className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                </p>
              </form>
            </>
          )}

          
          {view === 'newpass' && (
            <>
              <div className="mb-10">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={28} className="text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h1>
                <p className="text-slate-400 text-sm">
                  Code vérifié. Choisissez un nouveau mot de passe d'au moins 6 caractères.
                </p>
              </div>

              {resetError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      required
                      disabled={resetLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                  
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs mt-2 transition-colors ${newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                      {newPassword === confirmPassword
                        ? '✓ Les mots de passe correspondent'
                        : '✗ Les mots de passe ne correspondent pas'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {resetLoading
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <>Réinitialiser le mot de passe <ArrowRight size={18} /></>
                  }
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;