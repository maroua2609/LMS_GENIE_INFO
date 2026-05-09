import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { HelpCircle, Clock, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, Trophy } from 'lucide-react';

interface Question {
  id: number;
  enonce: string;
  type: string;
  points: number;
  ordre: number;
  choix: { id: number; texte: string; ordre: number }[];
}

interface QuizData {
  quiz: {
    id: number;
    titre: string;
    description: string;
    note_max: number;
    duree_min: number;
  };
  questions: Question[];
}

const EtudiantQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState<{ question_id: number; choix_id: number | null }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get<QuizData>(`/quiz/${id}/questions`);
        setQuizData(res.data);
        setReponses(res.data.questions.map((q) => ({ question_id: q.id, choix_id: null })));
        if (res.data.quiz.duree_min) {
          setTimeLeft(res.data.quiz.duree_min * 60);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuiz();
  }, [id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleSelectChoix = (choixId: number) => {
    const newReponses = [...reponses];
    newReponses[currentQuestion].choix_id = choixId;
    setReponses(newReponses);
  };

  const handleNext = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post(`/quiz/${id}/soumettre`, reponses);
      setResultat(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Quiz non trouvé</p>
      </div>
    );
  }

  // Page de résultat
  if (submitted && resultat) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Quiz terminé !</h1>
          <p className="text-slate-400 mb-6">{quizData.quiz.titre}</p>
          
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black text-white mb-2">
              {resultat.note_obtenue}<span className="text-2xl text-slate-400">/{resultat.note_max}</span>
            </p>
            <p className="text-slate-400">Votre note</p>
          </div>
          
          <Link
            to="/etudiant/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
          >
            Retour au tableau de bord
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold truncate">{quizData.quiz.titre}</h2>
          <div className="flex items-center gap-4">
            {timeLeft > 0 && (
              <span className="flex items-center gap-1 text-amber-400 text-sm">
                <Clock size={16} />
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-slate-400 text-sm">
              {currentQuestion + 1}/{quizData.questions.length}
            </span>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          {/* Numéro et points */}
          <div className="flex justify-between items-center mb-6">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
              Question {currentQuestion + 1}
            </span>
            <span className="text-slate-400 text-sm">{question.points} point{question.points > 1 ? 's' : ''}</span>
          </div>

          {/* Énoncé */}
          <h3 className="text-xl font-semibold text-white mb-8">{question.enonce}</h3>

          {/* Choix */}
          <div className="space-y-3">
            {question.choix.map((choix) => (
              <button
                key={choix.id}
                onClick={() => handleSelectChoix(choix.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                  reponses[currentQuestion]?.choix_id === choix.id
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-slate-700 hover:border-slate-600 text-slate-300'
                }`}
              >
                <span className="font-medium">{choix.texte}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={18} />
              Précédent
            </button>

            {currentQuestion < quizData.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-medium transition-all"
              >
                Suivant
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
              >
                <CheckCircle2 size={20} />
                Terminer le quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtudiantQuiz;