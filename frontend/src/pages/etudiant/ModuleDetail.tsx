import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module, Cours, Ressource, Quiz } from '../../types';
import { 
  BookOpen, FileText, HelpCircle, MessageCircle, Megaphone, LogOut, Bell,
  BarChart3, TrendingUp, Bookmark, Zap, Search, CheckCircle2, Clock, Eye, 
  Download, Video, Code, LinkIcon, FileArchive
} from 'lucide-react';

interface EnseignantInfo {
  nom: string;
  prenom: string;
}

type TabType = 'lecons' | 'ressources' | 'quiz' | 'annonces' | 'forum';

const EtudiantModuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [cours, setCours] = useState<Cours[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [enseignant, setEnseignant] = useState<EnseignantInfo>({ nom: '', prenom: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('lecons');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchData = async () => {
      try {
        const [moduleRes, coursRes, quizRes, enseignantRes] = await Promise.all([
          api.get<Module>(`/modules/${id}`),
          api.get<Cours[]>(`/modules/${id}/cours`),
          api.get<Quiz[]>(`/modules/${id}/quiz`),
          api.get<EnseignantInfo>(`/modules/${id}/enseignant`),
        ]);
        
        setModule(moduleRes.data);
        setCours(coursRes.data);
        setQuiz(quizRes.data);
        setEnseignant(enseignantRes.data);

        // Charger les ressources de tous les cours
        const allRessources: Ressource[] = [];
        for (const c of coursRes.data) {
          try {
            const res = await api.get<Ressource[]>(`/cours/${c.id}/ressources`);
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
  
  const getInitiales = () => {
    if (!user) return '??';
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`;
  };

  const getEnseignantDisplay = () => {
    if (!enseignant || !enseignant.prenom || enseignant.nom === 'Non assigné') {
      return 'Non assigné';
    }
    return `Dr. ${enseignant.prenom} ${enseignant.nom}`;
  };

  const getIcon = (type: string, size: number = 20) => {
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

  const filteredCours = cours.filter(c => 
    c.titre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500/30 border-t-violet-500"></div>
    </div>
  );

  if (!module) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Module non trouvé</p>
    </div>
  );

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
            <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm">
              <Bookmark size={18} /> Mes modules
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
            <Link to={`/forum/${id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all">
              <MessageCircle size={18} /> Forum
            </Link>
          </nav>
        </div>

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
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 min-h-screen">
        
        {/* HEADER DU MODULE */}
        <div className="relative border-b border-gray-800" style={{ backgroundColor: (module.couleur || '#8B5CF6') + '10' }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
            
            {/* Barre de recherche */}
            <div className="relative mb-6 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un cours..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500 text-sm transition-all"
              />
            </div>

            {/* Info module */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" 
                   style={{ backgroundColor: (module.couleur || '#8B5CF6') + '30' }}>
                <BookOpen size={28} style={{ color: module.couleur || '#8B5CF6' }} />
              </div>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">
                  {module.code} — S{module.semestre}
                </span>
                <h1 className="text-2xl font-bold text-white mt-2">{module.titre}</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Enseignant·e : {getEnseignantDisplay()}
                </p>
              </div>
            </div>
          </div>

          {/* ONGLETS */}
          <div className="max-w-5xl mx-auto px-6 lg:px-10">
            <div className="flex gap-0 border-b border-gray-800 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENU DES ONGLETS */}
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
          
          {/* ONGLET LEÇONS */}
          {activeTab === 'lecons' && (
            <div className="space-y-3">
              {filteredCours.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune leçon disponible</p>
                </div>
              ) : (
                filteredCours.map((c, index) => (
                  <Link
                    key={c.id}
                    to={`/etudiant/cours/${c.id}`}
                    className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-violet-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-bold text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-violet-400 transition-colors">
                        Chapitre {index + 1} — {c.titre}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">Leçon {index + 1}</p>
                    </div>
                    <span className="flex items-center gap-1 text-violet-400 text-xs group-hover:text-white transition-colors">
                      Consulter →
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* ONGLET RESSOURCES */}
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
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-violet-500/30 transition-all group">
                      {getIcon(r.type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm group-hover:text-violet-400">{r.titre}</h3>
                        <span className="text-xs text-gray-600 mt-1">{r.type?.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Eye size={16} className="text-gray-500 group-hover:text-violet-400" />
                        {r.telechargeable && <Download size={16} className="text-gray-500 group-hover:text-violet-400" />}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ONGLET QUIZ */}
          {activeTab === 'quiz' && (
            <div>
              {quiz.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun quiz disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quiz.map((q) => (
                    <Link key={q.id} to={`/etudiant/quiz/${q.id}`}
                      className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                          <HelpCircle size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold group-hover:text-amber-400">{q.titre}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-gray-500 text-xs">Note max : {q.note_max}/20</span>
                            {q.duree_min && <span className="text-gray-500 text-xs flex items-center gap-1"><Clock size={12} /> {q.duree_min} min</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-violet-400 text-sm font-medium">Commencer →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ONGLET ANNONCES */}
          {activeTab === 'annonces' && (
            <div className="text-center py-16">
              <Megaphone size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Aucune annonce pour ce module</p>
            </div>
          )}

          {/* ONGLET FORUM */}
          {activeTab === 'forum' && (
            <div className="text-center py-16">
              <MessageCircle size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Espace de discussion du module</p>
              <Link to={`/forum/${id}`}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                <MessageCircle size={18} /> Accéder au forum
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EtudiantModuleDetail;