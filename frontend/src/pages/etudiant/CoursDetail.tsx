import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, FileText, Video, Code, LinkIcon, Download,
  Clock, Zap, BarChart3, TrendingUp, Bookmark, Megaphone,
  MessageCircle, LogOut, ArrowLeft, CheckCircle, Play,
  Eye, Target, Award, Flame, Star, CheckCircle2,
  Loader2, RefreshCw
} from 'lucide-react';


interface User { id: number; nom: string; prenom: string; email: string; role: string; }
interface ModuleInfo { id: number; titre: string; code: string; semestre: number; couleur: string; }
interface EnseignantInfo { nom: string; prenom: string; }
interface Ressource {
  id: number; cours_id: number; titre: string; description?: string;
  type: string; url: string; langage?: string; telechargeable: boolean;
}
interface Cours {
  id: number; module_id: number; titre: string; description: string;
  ordre: number; publie: boolean; created_at: string; duree_estimee_min?: number;
}
interface CoursDetailData {
  cours: Cours; ressources: Ressource[];
  module: ModuleInfo; enseignant: EnseignantInfo;
}
interface QuizInfo { id: number; titre: string; note_max: number; }
interface ProgressionDetail {
  progression: number;
  score_ressources: number;
  score_quiz: number;
  ressources_ids: number[];
  total_ressources: number;
  meilleure_note: number | null;
}


const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = value >= 100 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#8b5cf6';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2937" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={2 * Math.PI * radius} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize={size / 5} fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
};


const ProgressBar: React.FC<{ value: number; max: number; label?: string; color?: string }> = ({ value, max, label, color = '#8b5cf6' }) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-gray-400"><span>{label}</span><span>{Math.round(value)}/{max}</span></div>}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};


const EtudiantCoursDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CoursDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progression locale
  const [openedResources, setOpenedResources] = useState<Set<number>>(new Set());
  const [progression, setProgression] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const quizIdRef = useRef<number>(0);
  const [quizNote, setQuizNote] = useState<number | null>(null);

 
  const [timeSpent, setTimeSpent] = useState(0);
  const timeSpentRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  // Session tracking
  const sessionIdRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  // Récupération user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  
  useEffect(() => {
    const fetchCours = async () => {
      if (!id) return;
      try {
        const [resCours, resDetail] = await Promise.all([
          api.get<CoursDetailData>(`/cours/${id}`),
          api.get<ProgressionDetail>(`/cours/${id}/progression/detail`).catch(() => ({ data: null }))
        ]);

        setData(resCours.data);

        if (resDetail.data) {
          setOpenedResources(new Set(resDetail.data.ressources_ids));
          setQuizNote(resDetail.data.meilleure_note);
          setProgression(resDetail.data.progression);
        }

        startTimeRef.current = Date.now();
        setTimeSpent(0);
        timeSpentRef.current = 0;

        // Quiz
        const moduleId = resCours.data.module.id;
        try {
          const resQuiz = await api.get<QuizInfo[]>(`/modules/${moduleId}/quiz`);
          if (resQuiz.data.length > 0) {
            const premierQuiz = resQuiz.data[0];
            setQuiz(premierQuiz);
            quizIdRef.current = premierQuiz.id;
            if (resDetail.data?.meilleure_note === undefined) {
              const resTentatives = await api.get<any[]>(`/quiz/${premierQuiz.id}/mes-tentatives`).catch(() => ({ data: [] }));
              if (resTentatives.data.length > 0) {
                const best = Math.max(...resTentatives.data.map(t => Number(t.note_obtenue)));
                setQuizNote(best);
              }
            }
          }
        } catch { /* pas de quiz */ }

      } catch (err) {
        setError('Impossible de charger ce cours.');
      } finally {
        setLoading(false);
      }
    };
    fetchCours();
  }, [id]);

  // Timer pour l'affichage du temps 
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);
      timeSpentRef.current = elapsed;
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Synchronisation avec le backend (envoi des ressources ouvertes)
  const syncProgression = useCallback(async () => {
    if (!id) return;
    try {
      const formData = new FormData();
      formData.append('ressources_ouvertes', Array.from(openedResources).join(','));
      formData.append('quiz_id', quizIdRef.current.toString());
      formData.append('temps_passe', '0');
      const res = await api.post(`/cours/${id}/valider-hybride`, formData);
      setProgression(res.data.progression);
    } catch (err) {
      console.warn('Sync progression failed', err);
    }
  }, [id, openedResources]);

  // Sauvegarde périodique toutes les 30s
  useEffect(() => {
    const interval = setInterval(syncProgression, 30000);
    return () => {
      clearInterval(interval);
      const formData = new FormData();
      formData.append('ressources_ouvertes', Array.from(openedResources).join(','));
      formData.append('quiz_id', quizIdRef.current.toString());
      formData.append('temps_passe', '0');
      navigator.sendBeacon(`/api/cours/${id}/valider-hybride`, formData);
    };
  }, [syncProgression, id, openedResources]);

  // Sauvegarde avant fermeture/rechargement
  useEffect(() => {
    const handleBeforeUnload = () => {
      const formData = new FormData();
      formData.append('ressources_ouvertes', Array.from(openedResources).join(','));
      formData.append('quiz_id', quizIdRef.current.toString());
      formData.append('temps_passe', '0');
      navigator.sendBeacon(`/api/cours/${id}/valider-hybride`, formData);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, openedResources]);

  // Session tracking (optionnel)
  const startSession = useCallback(async () => {
    if (!id) return;
    try {
      const formData = new FormData();
      formData.append('cours_id', id);
      const { data } = await api.post<{ session_id: number }>('/progression/start', formData);
      if (isMounted.current) sessionIdRef.current = data.session_id;
    } catch (err) { console.warn(err); }
  }, [id]);

  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const formData = new FormData();
      formData.append('session_id', sessionIdRef.current.toString());
      await api.post('/progression/heartbeat', formData);
    } catch {}
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const formData = new FormData();
      formData.append('session_id', sessionIdRef.current.toString());
      await api.post('/progression/end', formData);
    } catch {} finally {
      sessionIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    isMounted.current = true;
    startSession().then(() => {
      heartbeatRef.current = setInterval(sendHeartbeat, 30000);
    });
    return () => {
      isMounted.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      endSession();
    };
  }, [id, startSession, sendHeartbeat, endSession]);

  // Gestion clic sur ressource
  const handleResourceOpen = useCallback((ressourceId: number) => {
    if (!openedResources.has(ressourceId)) {
      const newSet = new Set(openedResources);
      newSet.add(ressourceId);
      setOpenedResources(newSet);
      syncProgression(); // sauvegarde immédiate
    }
  }, [openedResources, syncProgression]);

  // Calcul local de la progression (pour affichage réactif)
  const totalRessources = data?.ressources.length || 0;
  const localProgression = useMemo(() => {
    const scoreRessources = totalRessources > 0
      ? (openedResources.size / totalRessources) * 60
      : 60; // offert
    const scoreQuiz = quizNote !== null ? Math.min((quizNote / 20) * 40, 40) : 0;
    let prog = Math.min(Math.round(scoreRessources + scoreQuiz), 100);
    if (prog === 0 && openedResources.size > 0) prog = 1;
    return prog;
  }, [totalRessources, quizNote, openedResources]);

  const displayedProgression = useMemo(() => {
    if (progression !== null) return Math.max(progression, localProgression);
    return localProgression;
  }, [progression, localProgression]);

  // Scores pour l'affichage
  const ressourcesScore = totalRessources > 0 ? (openedResources.size / totalRessources) * 60 : 60;
  const quizScore = quizNote !== null ? (quizNote / 20) * 40 : 0;

  
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm animate-pulse">Chargement du cours…</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <BookOpen size={64} className="text-gray-700 mx-auto mb-6" />
        <p className="text-xl text-gray-400 mb-4">{error || 'Cours introuvable'}</p>
        <Link to="/etudiant/dashboard" className="text-violet-400 hover:text-violet-300 font-medium">← Retour au tableau de bord</Link>
      </div>
    </div>
  );

  const { cours, ressources, module, enseignant } = data;
  const moduleColor = module.couleur || '#8b5cf6';

  return (
    <div className="min-h-screen bg-gray-950 flex">

      
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/40 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">GINFLMS</h1>
            <p className="text-gray-500 text-xs">GÉNIE INFORMATIQUE</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
          <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
            <BarChart3 size={18} /> Tableau de bord
          </Link>
          <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
            <Bookmark size={18} /> Mes modules
          </Link>
          <Link to="/etudiant/progression" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
            <TrendingUp size={18} /> Progression
          </Link>
        </nav>

        <nav className="space-y-1 mb-8">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
            <Megaphone size={18} /> Annonces
          </Link>
          <Link to={`/forum/${module.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
            <MessageCircle size={18} /> Forum
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getInitiales()}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</p>
              <p className="text-gray-500 text-xs">Étudiant</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/etudiant/dashboard" className="text-gray-500 hover:text-gray-300">Dashboard</Link>
          <span className="text-gray-700">/</span>
          <Link to={`/etudiant/modules/${module.id}`} className="text-gray-500 hover:text-gray-300">{module.code}</Link>
          <span className="text-gray-700">/</span>
          <span className="text-violet-400 font-medium truncate">{cours.titre}</span>
        </div>

        
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: moduleColor + '20' }}>
                <BookOpen size={28} style={{ color: moduleColor }} />
              </div>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">{module.code} — S{module.semestre}</span>
                <h1 className="text-3xl font-bold text-white mt-2">{cours.titre}</h1>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <p className="text-gray-400 text-sm">Enseignant·e : {enseignant.prenom} {enseignant.nom}</p>
                  {cours.duree_estimee_min && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} /> {cours.duree_estimee_min} min estimées
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} /> Temps passé : {formatTime(timeSpent)} (indicatif)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 rounded-2xl p-5 min-w-[160px]">
            <CircularProgress value={displayedProgression} size={100} />
            <p className="text-sm text-gray-400 mt-2">Progression</p>
            {displayedProgression >= 100 && <CheckCircle2 size={16} className="text-emerald-400 mt-1" />}
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Ressources */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Eye size={16} className="text-blue-400" /></div>
              <span className="text-gray-400 text-sm">Ressources (60%)</span>
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(ressourcesScore)}<span className="text-sm text-gray-500 font-normal"> / 60 pts</span></p>
            <ProgressBar value={openedResources.size} max={totalRessources || 1} color="#3b82f6" />
          </div>

          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Target size={16} className="text-emerald-400" /></div>
              <span className="text-gray-400 text-sm">Quiz (40%)</span>
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(quizScore)}<span className="text-sm text-gray-500 font-normal"> / 40 pts</span></p>
            <ProgressBar value={quizNote ? quizNote : 0} max={20} color="#10b981" label={`Meilleure note : ${quizNote ?? 'N/A'}/20`} />
          </div>
        </div>

        
        <div className="flex justify-end mb-6">
          <button
            onClick={async () => { setValidating(true); await syncProgression(); setValidating(false); }}
            disabled={validating}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            {validating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Actualiser la progression
          </button>
        </div>

        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-violet-400" /> Contenu
          </h2>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            {cours.description ? (
              <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                {cours.description}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-6">Aucun contenu rédigé.</p>
            )}
          </div>
        </section>

        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-violet-400" /> Ressources ({ressources.length})
          </h2>
          {ressources.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
              <FileText size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Aucune ressource pour ce cours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ressources.map((r) => {
                let icon = <FileText size={18} />;
                if (r.type === 'pdf') icon = <FileText size={18} />;
                else if (r.type === 'video') icon = <Video size={18} />;
                else if (r.type === 'code') icon = <Code size={18} />;
                else if (r.type === 'lien') icon = <LinkIcon size={18} />;
                return (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleResourceOpen(r.id)}
                    className={`flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-violet-500/30 transition-all group ${
                      openedResources.has(r.id) ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium group-hover:text-violet-400 truncate">{r.titre}</h3>
                      <p className="text-gray-500 text-xs">{r.type} {r.telechargeable && '· Téléchargeable'}</p>
                    </div>
                    {openedResources.has(r.id) ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <Eye size={16} className="text-gray-600 group-hover:text-violet-400" />
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </section>

        
        {quiz && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target size={20} className="text-violet-400" /> Quiz du module
            </h2>
            <div className={`bg-gray-900/50 border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              quizNote !== null ? 'border-emerald-500/30' : 'border-amber-500/30'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quizNote !== null ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  <Target size={22} className={quizNote !== null ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{quiz.titre}</h3>
                  {quizNote !== null ? (
                    <p className="text-emerald-400 text-sm mt-1">✅ Meilleure note : {quizNote}/{quiz.note_max}</p>
                  ) : (
                    <p className="text-amber-400 text-sm mt-1">⚠ Quiz non effectué</p>
                  )}
                </div>
              </div>
              <Link
                to={`/etudiant/quiz/${quiz.id}`}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  quizNote !== null ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                <Play size={16} /> {quizNote !== null ? 'Refaire le quiz' : 'Commencer le quiz'}
              </Link>
            </div>
          </section>
        )}

        
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-800">
          <Link to={`/etudiant/modules/${module.id}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} /> Retour au module
          </Link>
          <Link to="/etudiant/dashboard" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            Tableau de bord
          </Link>
        </div>
      </main>
    </div>
  );
};

export default EtudiantCoursDetail;