import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  Clock, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, Trophy,
  Zap, Loader2, List, Brain, Sparkles, LogOut, BookOpen,
  BarChart3, Bookmark, TrendingUp, Megaphone, MessageCircle,HelpCircle
} from 'lucide-react';


interface Question {
  id: number;
  enonce: string;
  type: string;
  points: number;
  ordre: number;
  choix: { id: number; texte: string; ordre: number }[];
}
interface QuizData {
  quiz: { id: number; titre: string; description: string; note_max: number; duree_min: number; module_id?: number };
  questions: Question[];
}
interface PreviousAttempt { id: number; note_obtenue: number; fin_le: string; }
interface User { id: number; nom: string; prenom: string; role: string; }

const EtudiantQuiz: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState<{ question_id: number; choix_id: number | null }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);


  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          api.get<QuizData>(`/quiz/${id}/questions`),
          api.get<PreviousAttempt[]>(`/quiz/${id}/mes-tentatives`).catch(() => ({ data: [] }))
        ]);
        setQuizData(quizRes.data);
        setReponses(quizRes.data.questions.map(q => ({ question_id: q.id, choix_id: null })));
        if (quizRes.data.quiz.duree_min) {
          const saved = localStorage.getItem(`quiz_${id}_remaining`);
          const start = localStorage.getItem(`quiz_${id}_start`);
          if (saved && start) {
            const elapsed = Math.floor((Date.now() - parseInt(start)) / 1000);
            setTimeLeft(Math.max(0, parseInt(saved) - elapsed));
          } else {
            setTimeLeft(quizRes.data.quiz.duree_min * 60);
          }
        }
        if (attemptsRes.data.length) {
          setPreviousBest(Math.max(...attemptsRes.data.map(a => a.note_obtenue)));
        }
      } catch (err) {
        setError("Impossible de charger le quiz.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  
  useEffect(() => {
    if (!quizData || submitted) return;
    const saveInterval = setInterval(() => {
      localStorage.setItem(`quiz_${id}_reponses`, JSON.stringify(reponses));
      localStorage.setItem(`quiz_${id}_remaining`, timeLeft.toString());
      localStorage.setItem(`quiz_${id}_start`, Date.now().toString());
    }, 3000);
    return () => clearInterval(saveInterval);
  }, [quizData, reponses, timeLeft, submitted, id]);

  
  useEffect(() => {
    if (timeLeft <= 0 || submitted || autoSubmitTriggered) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submitted && !autoSubmitTriggered) {
            setAutoSubmitTriggered(true);
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, autoSubmitTriggered]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitted) return;
    try {
      const res = await api.post(`/quiz/${id}/soumettre`, reponses);
      setResultat(res.data);
      setSubmitted(true);
      localStorage.removeItem(`quiz_${id}_reponses`);
      localStorage.removeItem(`quiz_${id}_remaining`);
      localStorage.removeItem(`quiz_${id}_start`);
    } catch { setError("Échec de la soumission automatique."); }
  }, [id, reponses, submitted]);

  const handleSelectChoix = (choixId: number) => {
    const newReponses = [...reponses];
    newReponses[currentQuestion].choix_id = choixId;
    setReponses(newReponses);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      const res = await api.post(`/quiz/${id}/soumettre`, reponses);
      setResultat(res.data);
      setSubmitted(true);
      localStorage.removeItem(`quiz_${id}_reponses`);
      localStorage.removeItem(`quiz_${id}_remaining`);
      localStorage.removeItem(`quiz_${id}_start`);
    } catch { setError("Erreur lors de la soumission."); }
    finally { setSaving(false); }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const answeredCount = useMemo(() => reponses.filter(r => r.choix_id !== null).length, [reponses]);
  const totalQuestions = quizData?.questions.length || 0;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const timePercent = quizData?.quiz.duree_min ? (timeLeft / (quizData.quiz.duree_min * 60)) * 100 : 100;
  const moduleId = quizData?.quiz.module_id || 1;

  // --- Écran de chargement ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <Loader2 size={48} className="text-purple-400 animate-spin relative z-10" />
          </div>
          <p className="text-gray-400">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Oups !</h2>
          <p className="text-gray-400 mb-6">{error || "Quiz introuvable"}</p>
          <Link to="/etudiant/dashboard" className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-2">
            Retour au tableau de bord <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

 
  if (submitted && resultat) {
    const isSuccess = resultat.note_obtenue >= resultat.note_max / 2;
    const isRecord = previousBest !== null && resultat.note_obtenue > previousBest;
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            {isSuccess ? <Trophy size={40} className="text-yellow-400" /> : <Brain size={40} className="text-purple-400" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz terminé !</h1>
          <p className="text-gray-400 mb-6">{quizData.quiz.titre}</p>
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black text-white mb-2">
              {resultat.note_obtenue}<span className="text-2xl text-gray-500">/{resultat.note_max}</span>
            </p>
            <p className="text-gray-400">Votre note</p>
            {isRecord && (
              <p className="text-emerald-400 text-sm mt-2 flex items-center justify-center gap-1">
                <Sparkles size={14} /> Nouveau record !
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/etudiant/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Tableau de bord <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              <Zap size={16} /> Repasser le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

 
  const question = quizData.questions[currentQuestion];
  const currentReponse = reponses[currentQuestion]?.choix_id;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">GINFLMS</h1>
            <p className="text-gray-500 text-xs">Plateforme académique</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
          <nav className="space-y-1">
            <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <BarChart3 size={18} /> Tableau de bord
            </Link>
            <Link to={`/etudiant/modules/${moduleId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <Bookmark size={18} /> Module
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
            <Link to={`/forum/${moduleId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <MessageCircle size={18} /> Forum
            </Link>
          </nav>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
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

      
      <main className="flex-1 min-h-screen">
        
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800 shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HelpCircle size={18} className="text-purple-400" />
              </div>
              <h1 className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{quizData.quiz.titre}</h1>
            </div>
            <div className="flex items-center gap-4">
              {previousBest !== null && (
                <div className="hidden md:flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-400 text-xs">
                  <Trophy size={12} /> Record : {previousBest}/{quizData.quiz.note_max}
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
                <Clock size={16} className="text-amber-400" />
                <span className={`font-mono text-sm ${timeLeft < 60 ? 'text-red-400 font-bold animate-pulse' : 'text-amber-300'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="bg-gray-800/50 px-3 py-1.5 rounded-full text-sm">
                <span className="text-purple-400 font-semibold">{answeredCount}</span>
                <span className="text-gray-500">/{totalQuestions}</span>
              </div>
            </div>
          </div>
          
          <div className="h-1 bg-gray-800">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          {timeLeft > 0 && (
            <div className="h-0.5 bg-gray-800/50">
              <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${timePercent}%` }} />
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-80 order-2 lg:order-1">
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <List size={16} className="text-purple-400" />
                Questions
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {quizData.questions.map((q, idx) => {
                  const isAnswered = reponses[idx]?.choix_id !== null;
                  const isActive = idx === currentQuestion;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`
                        relative w-10 h-10 rounded-xl text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105' 
                          : isAnswered 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }
                      `}
                    >
                      {idx + 1}
                      {isAnswered && <CheckCircle2 size={10} className="absolute -top-1 -right-1 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          
          <div className="flex-1 order-1 lg:order-2">
            <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                    Question {currentQuestion + 1}/{totalQuestions}
                  </span>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Zap size={14} /> {question.points} pt{question.points > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
                {question.enonce}
              </h2>

              <div className="space-y-4 mb-10">
                {question.choix.map((choix) => {
                  const isSelected = currentReponse === choix.id;
                  return (
                    <button
                      key={choix.id}
                      onClick={() => handleSelectChoix(choix.id)}
                      className={`
                        w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 group
                        ${isSelected
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/20'
                          : 'border-gray-700 bg-gray-800/30 text-gray-200 hover:border-purple-500/30 hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all
                        ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-500 group-hover:border-purple-400'}
                      `}>
                        {isSelected && <CheckCircle2 size={12} className="text-white mx-auto -mt-0.5" />}
                      </div>
                      <span className="flex-1 text-base md:text-lg">{choix.texte}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-800">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto justify-center"
                >
                  <ArrowLeft size={18} /> Précédent
                </button>

                {currentQuestion < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all w-full sm:w-auto justify-center"
                  >
                    Suivant <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={answeredCount !== totalQuestions}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto justify-center
                      ${answeredCount === totalQuestions
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    <CheckCircle2 size={20} /> Terminer le quiz
                  </button>
                )}
              </div>

              {answeredCount !== totalQuestions && currentQuestion === totalQuestions - 1 && (
                <p className="text-amber-400 text-sm mt-4 text-center flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> {totalQuestions - answeredCount} question(s) sans réponse
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Soumettre le quiz ?</h3>
            <p className="text-gray-300 mb-4">
              Vous avez répondu à <strong className="text-purple-400">{answeredCount}/{totalQuestions}</strong> questions.
              {answeredCount !== totalQuestions && (
                <span className="block mt-1 text-amber-400">⚠️ Certaines questions sont sans réponse.</span>
              )}
            </p>
            <p className="text-gray-500 text-sm mb-6">Une fois soumis, vous ne pourrez plus modifier vos réponses.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtudiantQuiz;