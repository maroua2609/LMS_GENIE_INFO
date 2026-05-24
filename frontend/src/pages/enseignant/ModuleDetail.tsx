import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, FileText, HelpCircle, MessageCircle, Megaphone, LogOut, Bell,
  BarChart3, TrendingUp, Bookmark, Zap, Search, CheckCircle2, Clock, Eye,
  Download, Video, Code, LinkIcon, PlusCircle, Edit, Trash2, EyeOff, Users
} from 'lucide-react';

interface ModuleInfo {
  id: number;
  code: string;
  titre: string;
  description: string;
  credits: number;
  annee_niveau: number;
  semestre: number;
  couleur: string;
}

interface CoursItem {
  id: number;
  titre: string;
  description?: string;
  ordre: number;
  publie: boolean;
  module_id: number;
}

interface QuizItem {
  id: number;
  titre: string;
  type: string;
  note_max: number;
  duree_min?: number;
  publie: boolean;
  module_id: number;
}

interface RessourceItem {
  id: number;
  titre: string;
  type: string;
  url?: string;
  telechargeable: boolean;
  cours_id: number;
}

type TabType = 'lecons' | 'ressources' | 'quiz' | 'annonces' | 'forum';

const ModuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [module, setModule] = useState<ModuleInfo | null>(null);
  const [cours, setCours] = useState<CoursItem[]>([]);
  const [ressources, setRessources] = useState<RessourceItem[]>([]);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('lecons');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchData = async () => {
      try {
        const [moduleRes, coursRes, quizRes] = await Promise.all([
          api.get(`/modules/${id}`),
          api.get(`/modules/${id}/cours`),
          api.get(`/modules/${id}/quiz`),
        ]);

        setModule(moduleRes.data);
        setCours(coursRes.data);
        setQuiz(quizRes.data);

        const allRessources: RessourceItem[] = [];
        for (const c of coursRes.data) {
          try {
            const res = await api.get(`/cours/${c.id}/ressources`);
            allRessources.push(...res.data);
          } catch (e) {}
        }
        setRessources(allRessources);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const handleDeleteCours = async (coursId: number) => {
    if (!confirm('Supprimer ce cours et ses ressources ?')) return;
    try {
      await api.delete(`/cours/${coursId}`);
      setCours(cours.filter(c => c.id !== coursId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublier = async (coursId: number) => {
    try {
      const res = await api.put(`/cours/${coursId}/publier`);
      setCours(cours.map(c => c.id === coursId ? { ...c, publie: res.data.publie } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string, size = 20) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-400" size={size} />;
      case 'video': return <Video className="text-blue-400" size={size} />;
      case 'code': return <Code className="text-green-400" size={size} />;
      case 'lien': return <LinkIcon className="text-purple-400" size={size} />;
      default: return <FileText className="text-gray-400" size={size} />;
    }
  };

  const tabs: { key: TabType; label: string; count: number; icon: JSX.Element }[] = [
    { key: 'lecons', label: 'Leçons', count: cours.length, icon: <BookOpen size={16} /> },
    { key: 'ressources', label: 'Ressources', count: ressources.length, icon: <FileText size={16} /> },
    { key: 'quiz', label: 'Quiz', count: quiz.length, icon: <HelpCircle size={16} /> },
    { key: 'annonces', label: 'Annonces', count: 0, icon: <Megaphone size={16} /> },
    { key: 'forum', label: 'Forum', count: 0, icon: <MessageCircle size={16} /> },
  ];

  const filteredCours = cours.filter(c => c.titre.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-500"></div>
    </div>
  );

  if (!module) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Module non trouvé</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap size={20} className="text-white" />
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
          <Link to={`/forum/${id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm">
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

      
      <main className="flex-1 min-h-screen">
        <div className="relative border-b border-gray-800" style={{ backgroundColor: (module.couleur || '#10b981') + '10' }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
            <div className="relative mb-6 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un cours..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500 text-sm transition-all"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (module.couleur || '#10b981') + '30' }}>
                  <BookOpen size={28} style={{ color: module.couleur || '#10b981' }} />
                </div>
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">
                    {module.code} — S{module.semestre}
                  </span>
                  <h1 className="text-2xl font-bold text-white mt-2">{module.titre}</h1>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/enseignant/cours/create?module=${module.id}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  <PlusCircle size={18} />
                  Ajouter cours
                </Link>
                <Link
                  to={`/enseignant/quiz/create?module=${module.id}`}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  <HelpCircle size={18} />
                  Nouveau quiz
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 lg:px-10">
            <div className="flex gap-0 border-b border-gray-800 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          {activeTab === 'lecons' && (
            <div className="space-y-3">
              {filteredCours.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune leçon</p>
                  <Link to={`/enseignant/cours/create?module=${module.id}`} className="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">
                    + Créer la première leçon
                  </Link>
                </div>
              ) : (
                filteredCours.map((c, index) => (
                  <div key={c.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <span className="text-emerald-400 font-bold text-sm">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">Chapitre {index + 1} — {c.titre}</h3>
                          <p className="text-gray-500 text-xs">Leçon {index + 1}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            c.publie ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {c.publie ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTogglePublier(c.id)} className="p-2 text-gray-400 hover:text-amber-400">
                          {c.publie ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <Link to={`/enseignant/cours/${c.id}/edit`} className="p-2 text-gray-400 hover:text-blue-400">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDeleteCours(c.id)} className="p-2 text-gray-400 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ressources' && (
            <div>
              {ressources.length === 0 ? (
                <div className="text-center py-16">
                  <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune ressource</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ressources.map((r) => (
                    <div key={r.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                      {getIcon(r.type)}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{r.titre}</h4>
                        <span className="text-xs text-gray-500">{r.type?.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2">
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400">
                            <Eye size={16} />
                          </a>
                        )}
                        {r.telechargeable && (
                          <a href={r.url} download className="text-gray-400 hover:text-emerald-400">
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div>
              {quiz.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun quiz</p>
                  <Link to={`/enseignant/quiz/create?module=${module.id}`} className="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">
                    + Créer un quiz
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {quiz.map((q) => (
                    <div key={q.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                          <HelpCircle size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{q.titre}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>Note max : {q.note_max}/20</span>
                            {q.duree_min && <span>{q.duree_min} min</span>}
                            <span className={`px-2 py-0.5 rounded-full ${q.publie ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {q.publie ? 'Publié' : 'Brouillon'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-400"><Edit size={16} /></button>
                        <button className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'annonces' && (
            <div className="text-center py-16">
              <Megaphone size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Aucune annonce pour ce module</p>
            </div>
          )}

          {activeTab === 'forum' && (
            <div className="text-center py-16">
              <MessageCircle size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Espace de discussion</p>
              <Link to={`/forum/${id}`} className="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">
                Accéder au forum
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModuleDetail;