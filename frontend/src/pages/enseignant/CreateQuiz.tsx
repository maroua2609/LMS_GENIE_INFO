import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  Save, PlusCircle, Trash2, HelpCircle, GraduationCap,
  LogOut, Users, BarChart3, TrendingUp, BookOpen, FileText,
  MessageCircle, Megaphone, ClipboardCheck, Eye
} from 'lucide-react';

interface QuestionForm {
  enonce: string;
  type: 'qcm' | 'vrai_faux' | 'ouvert';
  points: number;
  choix: { texte: string; est_correct: boolean }[];
}

interface QuizExistant {
  id: number;
  titre: string;
  description?: string;
  type: string;
  note_max: number;
  duree_min?: number;
  module_id: number;
  module_code: string;
  module_titre: string;
  publie: boolean;
  created_at: string;
}

const EnseignantCreateQuiz: React.FC = () => {
  
  const [module_id, setModuleId] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('qcm');
  const [note_max, setNoteMax] = useState(20);
  const [duree_min, setDureeMin] = useState(30);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  
  const [modules, setModules] = useState<Module[]>([]);
  const [quizExistants, setQuizExistants] = useState<QuizExistant[]>([]);
  const [user, setUser] = useState<any>(null);

  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    Promise.all([
      api.get<Module[]>('/modules'),
      api.get<QuizExistant[]>('/enseignant/quiz')
    ])
      .then(([modRes, quizRes]) => {
        setModules(modRes.data);
        setQuizExistants(quizRes.data);
      })
      .catch(console.error);
  }, []);

  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  
  const addQuestion = () => {
    setQuestions([...questions, {
      enonce: '',
      type: 'qcm',
      points: 1,
      choix: [
        { texte: '', est_correct: false },
        { texte: '', est_correct: false },
        { texte: '', est_correct: false },
        { texte: '', est_correct: false },
      ]
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleChoixChange = (qIndex: number, cIndex: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[qIndex].choix[cIndex] as any)[field] = value;
    setQuestions(updated);
  };

  // Soumission du quiz
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module_id || !titre) {
      setError('Veuillez remplir le module et le titre');
      return;
    }
    if (questions.length === 0) {
      setError('Ajoutez au moins une question');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/quiz', {
        module_id: parseInt(module_id),
        titre,
        description,
        type,
        note_max,
        duree_min,
        questions: questions.map((q, idx) => ({
          enonce: q.enonce,
          type: q.type,
          points: q.points,
          ordre: idx + 1,
          choix: q.choix.map((c, cIdx) => ({
            texte: c.texte,
            est_correct: c.est_correct,
            ordre: cIdx + 1
          }))
        }))
      });
      setSuccess('Quiz créé avec succès !');
      
      const updated = await api.get<QuizExistant[]>('/enseignant/quiz');
      setQuizExistants(updated.data);
      
      setTitre('');
      setDescription('');
      setType('qcm');
      setNoteMax(20);
      setDureeMin(30);
      setQuestions([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Supprimer ce quiz ?')) return;
    try {
      await api.delete(`/quiz/${quizId}`);
      setQuizExistants(quizExistants.filter(q => q.id !== quizId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

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
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <Users size={18} /> Étudiants
          </Link>
          <Link to="/enseignant/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
            <MessageCircle size={18} /> Forum
          </Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitiales()}
            </div>
            <div>
              <p className="text-white text-sm">{user?.prenom} {user?.nom}</p>
              <p className="text-gray-500 text-xs">Enseignant</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Link to="/enseignant/dashboard" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">← Retour</Link>
          <h1 className="text-3xl font-bold text-white mb-8">Gestion des quiz</h1>

          {/* Messages */}
          {success && <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-xl">{error}</div>}

          {/* Formulaire de création */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-purple-400" /> Nouveau quiz
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Module</label>
                  <select value={module_id} onChange={(e) => setModuleId(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500">
                    <option value="">Sélectionner</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.titre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500">
                    <option value="qcm">QCM</option>
                    <option value="vrai_faux">Vrai/Faux</option>
                    <option value="ouvert">Ouverte</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Titre du quiz</label>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Note max</label>
                  <input type="number" value={note_max} onChange={(e) => setNoteMax(parseInt(e.target.value))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Durée (min)</label>
                  <input type="number" value={duree_min} onChange={(e) => setDureeMin(parseInt(e.target.value))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Questions ({questions.length})</h3>
                  <button type="button" onClick={addQuestion} className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-2 rounded-xl text-sm">
                    <PlusCircle size={16} /> Ajouter une question
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 mb-4">
                    <div className="flex justify-between mb-3">
                      <h4 className="text-white font-semibold">Question {idx + 1}</h4>
                      <button type="button" onClick={() => removeQuestion(idx)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Énoncé</label>
                        <textarea value={q.enonce} onChange={(e) => handleQuestionChange(idx, 'enonce', e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1" rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400">Type</label>
                          <select value={q.type} onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1">
                            <option value="qcm">QCM</option>
                            <option value="vrai_faux">Vrai/Faux</option>
                            <option value="ouvert">Ouverte</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Points</label>
                          <input type="number" value={q.points} onChange={(e) => handleQuestionChange(idx, 'points', parseFloat(e.target.value))}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1" />
                        </div>
                      </div>
                      {q.type === 'qcm' && (
                        <div>
                          <label className="text-xs text-gray-400 mb-2">Choix</label>
                          {q.choix.map((c, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2 mb-2">
                              <input type="text" value={c.texte} onChange={(e) => handleChoixChange(idx, cIdx, 'texte', e.target.value)}
                                className="flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-3 py-1 text-white text-sm" placeholder={`Choix ${cIdx + 1}`} />
                              <label className="flex items-center gap-1 text-xs text-gray-300">
                                <input type="checkbox" checked={c.est_correct} onChange={(e) => handleChoixChange(idx, cIdx, 'est_correct', e.target.checked)} />
                                Correct
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'vrai_faux' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input type="radio" name={`vf-${idx}`} checked={q.choix[0]?.est_correct} onChange={() => {
                              const updated = [...questions];
                              updated[idx].choix = [{ texte: 'Vrai', est_correct: true }, { texte: 'Faux', est_correct: false }];
                              setQuestions(updated);
                            }} />
                            Vrai
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input type="radio" name={`vf-${idx}`} checked={q.choix[1]?.est_correct} onChange={() => {
                              const updated = [...questions];
                              updated[idx].choix = [{ texte: 'Vrai', est_correct: false }, { texte: 'Faux', est_correct: true }];
                              setQuestions(updated);
                            }} />
                            Faux
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2">
                <Save size={20} /> Enregistrer le quiz
              </button>
            </form>
          </div>

          {/* Liste des quiz existants */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye size={20} className="text-emerald-400" /> Quiz existants ({quizExistants.length})
            </h2>
            {quizExistants.length === 0 ? (
              <p className="text-gray-500">Aucun quiz créé pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {quizExistants.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <HelpCircle size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{quiz.titre}</h3>
                        <p className="text-gray-400 text-xs">
                          {quiz.module_code} – {quiz.module_titre} | {quiz.type.toUpperCase()} | Note max : {quiz.note_max} | 
                          {quiz.duree_min ? ` ${quiz.duree_min} min` : ''}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Créé le {new Date(quiz.created_at).toLocaleDateString('fr-FR')}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${quiz.publie ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {quiz.publie ? 'Publié' : 'Brouillon'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/enseignant/quiz/${quiz.id}`} className="text-gray-400 hover:text-blue-400">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => handleDeleteQuiz(quiz.id)} className="text-gray-400 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnseignantCreateQuiz;