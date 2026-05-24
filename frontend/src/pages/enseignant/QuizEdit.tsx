import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/config';
import {
  Save, PlusCircle, Trash2, HelpCircle, ArrowLeft, GraduationCap,
  LogOut, Users, BarChart3, BookOpen, FileText, MessageCircle,
  Megaphone, ClipboardCheck, AlertCircle
} from 'lucide-react';

interface Question {
  enonce: string;
  type: 'qcm' | 'vrai_faux' | 'ouvert';
  points: number;
  choix: { texte: string; est_correct: boolean }[];
}

const EnseignantQuizEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('qcm');
  const [note_max, setNoteMax] = useState(20);
  const [duree_min, setDureeMin] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    // Charger le quiz
    api.get(`/quiz/${id}/detail`)
      .then(res => {
        const quiz = res.data.quiz;
        setTitre(quiz.titre);
        setDescription(quiz.description || '');
        setType(quiz.type);
        setNoteMax(quiz.note_max);
        setDureeMin(quiz.duree_min || 30);
        // Transformer les questions
        const qs = res.data.questions.map((q: any) => ({
          enonce: q.enonce,
          type: q.type,
          points: q.points,
          choix: q.choix.map((c: any) => ({ texte: c.texte, est_correct: c.est_correct }))
        }));
        setQuestions(qs);
      })
      .catch(err => { console.error(err); setError('Impossible de charger le quiz.'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { enonce: '', type: 'qcm', points: 1, choix: [{ texte: '', est_correct: false }, { texte: '', est_correct: false }, { texte: '', est_correct: false }, { texte: '', est_correct: false }] }]);
  };
  const handleRemoveQuestion = (index: number) => setQuestions(questions.filter((_, i) => i !== index));

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleChoixChange = (qIdx: number, cIdx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[qIdx].choix[cIdx] as any)[field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre) { setError('Le titre est requis'); return; }
    try {
      await api.put(`/quiz/${id}`, {
        titre, description, type, note_max, duree_min,
        questions: questions.map((q, idx) => ({
          ...q,
          ordre: idx + 1,
          choix: q.choix.map((c, cIdx) => ({ ...c, ordre: cIdx + 1 }))
        }))
      });
      setSuccess('Quiz mis à jour avec succès !');
      setTimeout(() => navigate('/enseignant/quiz/create'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar complète */}
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

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Link to="/enseignant/quiz/create" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1"><ArrowLeft size={16} /> Retour aux quiz</Link>
          <h1 className="text-3xl font-bold text-white mb-8">Modifier le quiz</h1>
          {success && <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-xl flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mêmes champs que CreateQuiz : module non modifiable, titre, description, type, note_max, duree_min */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Titre</label>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500">
                  <option value="qcm">QCM</option>
                  <option value="vrai_faux">Vrai/Faux</option>
                  <option value="ouvert">Ouverte</option>
                  <option value="mixte">Mixte</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Note max</label>
                <input type="number" value={note_max} onChange={(e) => setNoteMax(parseInt(e.target.value))} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Durée (min)</label>
                <input type="number" value={duree_min} onChange={(e) => setDureeMin(parseInt(e.target.value))} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>
            </div>

            {/* Questions */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Questions ({questions.length})</h3>
                <button type="button" onClick={handleAddQuestion} className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-2 rounded-xl text-sm"><PlusCircle size={16} /> Ajouter</button>
              </div>
              {questions.map((q, idx) => (
                <div key={idx} className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 mb-4">
                  <div className="flex justify-between mb-3">
                    <h4 className="text-white font-semibold">Question {idx + 1}</h4>
                    <button type="button" onClick={() => handleRemoveQuestion(idx)} className="text-red-400"><Trash2 size={16} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400">Énoncé</label>
                      <textarea value={q.enonce} onChange={(e) => handleQuestionChange(idx, 'enonce', e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400">Type</label>
                        <select value={q.type} onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1">
                          <option value="qcm">QCM</option><option value="vrai_faux">Vrai/Faux</option><option value="ouvert">Ouverte</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Points</label>
                        <input type="number" value={q.points} onChange={(e) => handleQuestionChange(idx, 'points', parseFloat(e.target.value))} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-2 text-white mt-1" />
                      </div>
                    </div>
                    {q.type === 'qcm' && (
                      <div>
                        <label className="text-xs text-gray-400 mb-2">Choix</label>
                        {q.choix.map((c, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2 mb-2">
                            <input type="text" value={c.texte} onChange={(e) => handleChoixChange(idx, cIdx, 'texte', e.target.value)} className="flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-3 py-1 text-white text-sm" placeholder={`Choix ${cIdx + 1}`} />
                            <label className="flex items-center gap-1 text-xs text-gray-300">
                              <input type="checkbox" checked={c.est_correct} onChange={(e) => handleChoixChange(idx, cIdx, 'est_correct', e.target.checked)} /> Correct
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
                          }} /> Vrai
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input type="radio" name={`vf-${idx}`} checked={q.choix[1]?.est_correct} onChange={() => {
                            const updated = [...questions];
                            updated[idx].choix = [{ texte: 'Vrai', est_correct: false }, { texte: 'Faux', est_correct: true }];
                            setQuestions(updated);
                          }} /> Faux
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"><Save size={20} /> Enregistrer les modifications</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EnseignantQuizEdit;