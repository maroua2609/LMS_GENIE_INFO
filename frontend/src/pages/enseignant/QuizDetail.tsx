import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  HelpCircle, ArrowLeft, Clock, Trash2, CheckCircle2, XCircle,
  GraduationCap, LogOut, Users, BarChart3, BookOpen, FileText,
  MessageCircle, Megaphone, ClipboardCheck, PenLine
} from 'lucide-react';

interface QuizDetail {
  id: number;
  titre: string;
  description: string;
  type: string;
  note_max: number;
  duree_min: number;
  module_id: number;
  created_by: number;
  publie: boolean;
  created_at: string;
}

interface Question {
  id: number;
  enonce: string;
  type: string;
  points: number;
  ordre: number;
  choix: { id: number; texte: string; est_correct: boolean; ordre: number }[];
}

const EnseignantQuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quiz/${id}/detail`);
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      navigate('/enseignant/quiz/create');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce quiz ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/quiz/${id}`);
      alert('Quiz supprimé');
      navigate('/enseignant/quiz/create');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">GINFLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ENSEIGNANT</p>
          </div>
        </div>
        <nav className="space-y-1 mb-6">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Enseignement</p>
                  <Link to="/enseignant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
                  <Link to="/enseignant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Mes modules</Link>
                  <Link to="/enseignant/ressources" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><FileText size={18} /> Ressources</Link>
                  <Link to="/enseignant/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><Megaphone size={18} /> Annonces</Link>
                  <Link to="/enseignant/quiz/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Évaluations</Link>
                  <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"><BookOpen size={18} /> Progression</Link>
                </nav>
        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Users size={18} /> Étudiants</Link>
          <Link to="/enseignant/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><MessageCircle size={18} /> Forum</Link>
        </nav>
        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Enseignant</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Link to="/enseignant/quiz/create" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Retour aux quiz
          </Link>

          {quiz && (
            <>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white">{quiz.titre}</h1>
                  <p className="text-gray-400 mt-1">{quiz.description || 'Aucune description'}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14} /> {quiz.duree_min} min</span>
                    <span className="text-sm text-gray-500">Note max : {quiz.note_max}/20</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${quiz.publie ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {quiz.publie ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/enseignant/quiz/${quiz.id}/edit`}
                    className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-xl font-medium transition-all"
                  >
                    <PenLine size={18} /> Modifier
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl font-medium transition-all"
                  >
                    <Trash2 size={18} /> Supprimer le quiz
                  </button>
                </div>
              </div>

              {/* Liste des questions */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-semibold">
                        Question {idx + 1} <span className="text-gray-500 text-sm font-normal">({q.points} point{q.points > 1 ? 's' : ''})</span>
                      </h3>
                      <span className="text-xs uppercase text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{q.type}</span>
                    </div>
                    <p className="text-gray-300 mb-4">{q.enonce}</p>

                    {q.type === 'qcm' && (
                      <div className="space-y-2">
                        {q.choix.map((choix) => (
                          <div key={choix.id} className={`flex items-center justify-between p-3 rounded-xl ${choix.est_correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800/30'}`}>
                            <span className="text-gray-200 text-sm">{choix.texte}</span>
                            {choix.est_correct ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : (
                              <XCircle size={16} className="text-gray-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'vrai_faux' && (
                      <div className="flex gap-4">
                        <div className={`flex-1 p-3 rounded-xl text-center ${q.choix[0]?.est_correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800/30'}`}>
                          <span className="text-white">Vrai</span>
                          {q.choix[0]?.est_correct && <CheckCircle2 size={16} className="text-emerald-400 inline ml-2" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-xl text-center ${q.choix[1]?.est_correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800/30'}`}>
                          <span className="text-white">Faux</span>
                          {q.choix[1]?.est_correct && <CheckCircle2 size={16} className="text-emerald-400 inline ml-2" />}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default EnseignantQuizDetail;