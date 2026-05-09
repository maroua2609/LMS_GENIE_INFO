import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, FileText, Video, Code, LinkIcon, Download,
  Clock, Zap, BarChart3, TrendingUp, Bookmark, Megaphone,
  MessageCircle, LogOut, ArrowLeft, CheckCircle, Play,
  Eye, Loader2, RefreshCw
} from 'lucide-react';

// ===== TYPES =====
interface User { id: number; nom: string; prenom: string; email: string; role: string; }
interface ModuleInfo { id: number; titre: string; code: string; semestre: number; couleur: string; }
interface EnseignantInfo { nom: string; prenom: string; }
interface Ressource { id: number; cours_id: number; titre: string; description?: string; type: string; url: string; langage?: string; telechargeable: boolean; }
interface Cours { id: number; module_id: number; titre: string; description: string; contenu?: string; ordre: number; publie: boolean; created_at: string; duree_estimee_min?: number; }
interface CoursDetailData { cours: Cours; ressources: Ressource[]; module: ModuleInfo; enseignant: EnseignantInfo; }

type EventType = 'scroll_50%' | 'scroll_100%' | 'click_ressource' | 'download' | 'video_play' | 'video_end';

// ===== COMPOSANTS RÉUTILISABLES =====
const ResourceIcon = React.memo(({ type }: { type: string }) => {
  switch (type) {
    case 'pdf': return <FileText className="text-red-400" size={20} />;
    case 'video': return <Video className="text-blue-400" size={20} />;
    case 'code': return <Code className="text-green-400" size={20} />;
    case 'lien': return <LinkIcon className="text-purple-400" size={20} />;
    default: return <FileText className="text-gray-400" size={20} />;
  }
});

const ProgressionCircle = React.memo(({ percent }: { percent: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
      <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
      <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="text-violet-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" transform="rotate(90 50 50)">
        {percent}%
      </text>
    </svg>
  );
});

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-800 rounded-xl ${className}`} />
);

// ===== COMPOSANT PRINCIPAL =====
const EtudiantCoursDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CoursDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeSpent, setTimeSpent] = useState(0);
  const timeSpentRef = useRef(0);
  const openedResources = useRef<Set<number>>(new Set());
  const [progression, setProgression] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [detailProgression, setDetailProgression] = useState<{score_temps: number; score_ressources: number; score_quiz: number} | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  // États tracker
  const sessionIdRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollHandled = useRef<Set<string>>(new Set());
  const isMounted = useRef(true);

  // Chargement initial
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    const fetchCours = async () => {
      if (!id) return;
      try {
        const [resCours, resProg] = await Promise.all([
          api.get<CoursDetailData>(`/cours/${id}`),
          api.get<{ progression: number | null }>(`/cours/${id}/progression`).catch(() => ({ data: { progression: null } }))
        ]);
        setData(resCours.data);
        if (resProg.data.progression !== null) {
          setProgression(resProg.data.progression);
        } else {
          setProgression(null);
        }
        startTimeRef.current = Date.now();
        setTimeSpent(0);
        timeSpentRef.current = 0;
        openedResources.current = new Set();
        setDetailProgression(null);
        setError(null);
      } catch (err) {
        setError('Impossible de charger cette leçon.');
      } finally {
        setLoading(false);
      }
    };
    fetchCours();
  }, [id]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);
      timeSpentRef.current = elapsed;
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── SYNCHRONISATION ─
  const syncProgression = useCallback(async () => {
    if (!id || validating) return;
    try {
      const formData = new FormData();
      formData.append('temps_passe', timeSpentRef.current.toString());
      formData.append('ressources_ouvertes', Array.from(openedResources.current).join(','));
      formData.append('quiz_id', '0');
      const res = await api.post(`/cours/${id}/valider-hybride`, formData);
      setProgression(res.data.progression);
      setDetailProgression(res.data.details);
    } catch (err) {
      console.warn('Auto-sync progression failed', err);
    }
  }, [id, validating]);

  // Sauvegarde périodique + démontage
  useEffect(() => {
    const interval = setInterval(syncProgression, 30000);
    return () => {
      clearInterval(interval);
      syncProgression(); // sauvegarde au départ
    };
  }, [syncProgression]);

  // ── TRACKER DE SESSION ────────────────────
  const startSession = useCallback(async () => {
    if (!id) return;
    try {
      const formData = new FormData();
      formData.append('cours_id', id);
      const { data } = await api.post<{ session_id: number }>('/progression/start', formData);
      if (isMounted.current) sessionIdRef.current = data.session_id;
    } catch (err) {
      console.warn('[Tracker] Session start failed', err);
    }
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

  const logEvent = useCallback(async (type: EventType, valeur?: string) => {
    if (!sessionIdRef.current || !id) return;
    const key = `${sessionIdRef.current}-${type}`;
    if (scrollHandled.current.has(key)) return;
    scrollHandled.current.add(key);
    try {
      const formData = new FormData();
      formData.append('session_id', sessionIdRef.current.toString());
      formData.append('cours_id', id);
      formData.append('type', type);
      if (valeur) formData.append('valeur', valeur);
      await api.post('/progression/event', formData);
    } catch (err) {
      console.warn('[Tracker] Event failed', type, err);
      scrollHandled.current.delete(key);
    }
  }, [id]);

  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const pct = ((scrollTop + clientHeight) / scrollHeight) * 100;
    if (pct >= 50) logEvent('scroll_50%');
    if (pct >= 98) logEvent('scroll_100%');
  }, [logEvent]);

  // Définition après logEvent
  const handleResourceOpen = useCallback((ressourceId: number) => {
    openedResources.current = new Set(openedResources.current).add(ressourceId);
    logEvent('click_ressource', ressourceId.toString());
    syncProgression(); // sauvegarde immédiate
  }, [logEvent, syncProgression]);

  useEffect(() => {
    if (!id) return;
    isMounted.current = true;
    scrollHandled.current.clear();
    startSession().then(() => {
      if (!isMounted.current) return;
      heartbeatRef.current = setInterval(sendHeartbeat, 30000);
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      isMounted.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('scroll', handleScroll);
      endSession();
    };
  }, [id, startSession, sendHeartbeat, endSession, handleScroll]);

  // ── CALCUL LOCAL ───────────
  const totalRessources = data?.ressources.length || 0;

  const localProgression = useMemo(() => {
    const TEMPS_MAX = 600;
    const scoreTemps = Math.min((timeSpent / TEMPS_MAX) * 30, 30);
    const ressourcesConsultees = openedResources.current.size;
    const scoreRessources = totalRessources > 0 ? (ressourcesConsultees / totalRessources) * 30 : 0;
    const scoreQuiz = 0;
    const prog = Math.min(Math.round(scoreTemps + scoreRessources + scoreQuiz), 100);
    return prog > 0 ? prog : (timeSpent > 0 || ressourcesConsultees > 0 ? 1 : 0);
  }, [timeSpent, totalRessources]);

  const displayedProgression = useMemo(() => {
    if (progression !== null) return Math.max(progression, localProgression);
    return localProgression || null;
  }, [progression, localProgression]);

  const handleValidate = useCallback(async () => {
    if (!id || validating) return;
    setValidating(true);
    try {
      await syncProgression();
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  }, [id, validating, syncProgression]);

  const getInitiales = useCallback(() => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  }, [user]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const breadcrumb = useMemo(() => (
    <div className="flex items-center gap-2 text-sm mb-8">
      <Link to="/etudiant/dashboard" className="text-gray-500 hover:text-gray-300">Dashboard</Link>
      <span className="text-gray-700">/</span>
      <Link to={`/etudiant/modules/${data?.module.id}`} className="text-gray-500 hover:text-gray-300">{data?.module.code}</Link>
      <span className="text-gray-700">/</span>
      <span className="text-violet-400 font-medium truncate">{data?.cours.titre}</span>
    </div>
  ), [data]);

  // Rendu chargement / erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex">
        <aside className="hidden lg:block w-72 bg-gray-900/30 border-r border-gray-800/50 p-6" />
        <main className="flex-1 p-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="text-gray-700 mx-auto mb-6" />
          <p className="text-xl text-gray-400 mb-4">{error || 'Cours introuvable'}</p>
          <Link to="/etudiant/dashboard" className="text-violet-400 hover:text-violet-300 font-medium">← Retour au tableau de bord</Link>
        </div>
      </div>
    );
  }

  const { cours, ressources, module, enseignant } = data;
  const moduleColor = module.couleur || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">LMS Génie Info</h1>
            <p className="text-gray-500 text-xs">Plateforme académique</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
          <nav className="space-y-1">
            <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <BarChart3 size={18} /> Tableau de bord
            </Link>
            <Link to={`/etudiant/modules/${module.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
              <Bookmark size={18} /> {module.code}
            </Link>
            <Link to="/etudiant/progression" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <TrendingUp size={18} /> Progression
            </Link>
          </nav>
        </div>
        <div className="mb-8">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <nav className="space-y-1">
            <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <Megaphone size={18} /> Annonces
            </Link>
            <Link to={`/forum/${module.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <MessageCircle size={18} /> Forum
            </Link>
          </nav>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{getInitiales()}</span>
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

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 min-h-screen p-6 lg:p-10 pt-28">
        <div className="max-w-5xl mx-auto">
          {breadcrumb}

          {/* En-tête */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: moduleColor + '30' }}>
                  <BookOpen size={28} style={{ color: moduleColor }} />
                </div>
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">{module.code} — S{module.semestre}</span>
                  <h1 className="text-3xl font-bold text-white mt-2">{cours.titre}</h1>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <p className="text-gray-400">Enseignant·e : {enseignant.prenom} {enseignant.nom}</p>
                    {cours.duree_estimee_min && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} /> {cours.duree_estimee_min} min
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} /> Temps passé : {formatTime(timeSpent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cercle de progression */}
            <div className="flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 rounded-3xl p-6 min-w-[160px]">
              {displayedProgression !== null && displayedProgression > 0 ? (
                <>
                  <ProgressionCircle percent={displayedProgression} />
                  <p className="text-sm text-gray-400 mt-3">Progression</p>
                  {displayedProgression >= 100 && (
                    <span className="text-emerald-400 text-xs font-bold mt-1 flex items-center gap-1">
                      <CheckCircle size={14} /> Terminé
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="text-5xl font-bold text-violet-400 mb-2">?</div>
                  <p className="text-sm text-gray-500">En attente</p>
                </>
              )}
            </div>
          </div>

          {/* Bloc progression */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 mb-8 hover:border-gray-700 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                  <TrendingUp size={22} className="text-violet-400" />
                  Progression
                </h2>
                {detailProgression ? (
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>Temps {detailProgression.score_temps}%</span>
                    <span>Ressources {detailProgression.score_ressources}%</span>
                    <span>Quiz {detailProgression.score_quiz}%</span>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    La progression est sauvegardée automatiquement toutes les 30 secondes.
                  </p>
                )}
              </div>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20 active:scale-95"
              >
                {validating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Calcul...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} /> Actualiser maintenant
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contenu */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
              <BookOpen size={24} className="text-violet-400" />
              Contenu de la leçon
            </h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 lg:p-8">
              {cours.description ? (
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {cours.description}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-8">Aucun contenu rédigé pour cette leçon.</p>
              )}
            </div>
          </section>

          {/* Ressources */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
              <FileText size={24} className="text-violet-400" />
              Ressources ({ressources.length})
            </h2>
            {ressources.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 text-center">
                <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">Aucune ressource attachée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ressources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleResourceOpen(r.id)}
                    className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all group hover:bg-gray-900/70"
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <ResourceIcon type={r.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-violet-400 transition-colors truncate">{r.titre}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 uppercase">{r.type}</span>
                        {r.telechargeable && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Download size={12} /> Téléchargeable
                          </span>
                        )}
                      </div>
                    </div>
                    <Eye size={18} className="text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Navigation bas */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-800">
            <Link to={`/etudiant/modules/${module.id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} /> Toutes les leçons
            </Link>
            <Link to="/etudiant/dashboard" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
              Tableau de bord
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(EtudiantCoursDetail);