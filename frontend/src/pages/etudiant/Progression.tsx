import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { 
  TrendingUp, BookOpen, Target, CheckCircle2, LogOut, Bell,
  BarChart3, MessageCircle, Megaphone, Bookmark, Zap, Award, 
  Download, Trophy, Star, Crown, Medal, TrendingDown
} from 'lucide-react';

// Types
interface User {
  id: number; nom: string; prenom: string; email: string; role: string;
}

interface ProgressionData {
  modules: any[];
  progression_globale: number;
  nb_modules: number;
}

interface GraphData {
  data_jours: any[];
  modules_completes: any[];
  stats: any;
}

interface Badge {
  id: string; nom: string; description: string; icone: string; date: string;
}

interface Notification {
  type: string; titre: string; message: string; date: string;
}

interface ExportData {
  etudiant: any;
  modules: any[];
  quiz_resultats: any[];
  date_export: string;
}

const EtudiantProgression: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchAll = async () => {
      try {
        const [progRes, graphRes, badgesRes, notifRes] = await Promise.all([
          api.get<ProgressionData>('/etudiant/progression'),
          api.get<GraphData>('/etudiant/progression/graphique'),
          api.get<Badge[]>('/etudiant/badges'),
          api.get<Notification[]>('/etudiant/notifications'),
        ]);
        setProgression(progRes.data);
        setGraphData(graphRes.data);
        setBadges(badgesRes.data);
        setNotifications(notifRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const handleExport = async () => {
    try {
      const res = await api.get<ExportData>('/etudiant/progression/export');
      const data = res.data;
      
      // Créer un export texte (simulé - à remplacer par jsPDF)
      let content = `=== RELEVÉ DE PROGRESSION ===\n\n`;
      content += `Étudiant : ${data.etudiant.prenom} ${data.etudiant.nom}\n`;
      content += `Filière : ${data.etudiant.filiere || 'N/A'}\n`;
      content += `Date : ${new Date(data.date_export).toLocaleDateString('fr-FR')}\n\n`;
      content += `--- MODULES ---\n\n`;
      data.modules.forEach((m: any) => {
        content += `${m.code} - ${m.titre}\n`;
        content += `  Leçons : ${m.lecons_consultees}/${m.total_lecons}\n`;
        content += `  Progression : ${m.progression_moyenne}%\n`;
        content += `  Complété : ${m.module_complete ? 'Oui' : 'Non'}\n\n`;
      });
      content += `--- QUIZ ---\n\n`;
      data.quiz_resultats.forEach((q: any) => {
        content += `${q.code} - ${q.titre} : ${q.note_obtenue}/20 (${new Date(q.fin_le).toLocaleDateString('fr-FR')})\n`;
      });

      // Télécharger
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progression_${data.etudiant.prenom}_${data.etudiant.nom}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500/30 border-t-violet-500"></div>
    </div>
  );

  const stats = graphData?.stats;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div><h1 className="text-white font-bold text-sm">CodeXLMS</h1><p className="text-gray-500 text-xs">GÉNIE INFORMATIQUE</p></div>
        </div>
        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Apprentissage</p>
          <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Bookmark size={18} /> Mes modules</Link>
          <Link to="/etudiant/progression" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm"><TrendingUp size={18} /> Progression</Link>
        </nav>
        <nav className="space-y-1 mb-8">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Megaphone size={18} /> Annonces</Link>
          <Link to="/forum/1" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><MessageCircle size={18} /> Forum</Link>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-sm">{getInitiales()}</span></div>
            <div><p className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Étudiant</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* CONTENU */}
      <main className="flex-1 p-6 lg:p-10">
        
        {/* En-tête avec bouton export */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Ma progression</h1>
            <p className="text-gray-400 mt-1">Suivez votre avancement</p>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            <Download size={16} /> Exporter
          </button>
        </div>

        {/* A. GRAPHIQUE DE PROGRESSION */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">📈 Évolution (30 jours)</h2>
            <div className="h-48 flex items-end gap-1">
              {graphData?.data_jours?.map((jour: any, i: number) => {
                const hauteur = jour.progression_moyenne || 5;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-purple-400 transition-all hover:from-violet-400 hover:to-purple-300"
                      style={{ height: `${Math.max(hauteur * 1.5, 4)}px` }}
                      title={`${jour.jour}: ${Math.round(hauteur)}%`}
                    ></div>
                    <span className="text-gray-600 text-xs">{new Date(jour.jour).getDate()}</span>
                  </div>
                );
              })}
              {(!graphData?.data_jours || graphData.data_jours.length === 0) && (
                <p className="text-gray-500 text-sm w-full text-center">Pas encore de données</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-gray-500 text-xs">Cours complétés</p>
              <p className="text-2xl font-bold text-white">{stats?.cours_completes || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Quiz soumis</p>
              <p className="text-2xl font-bold text-white">{stats?.quiz_soumis || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Moyenne quiz</p>
              <p className="text-2xl font-bold text-emerald-400">{stats?.moyenne_quiz ? Math.round(stats.moyenne_quiz) + '/20' : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* B. BADGES */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award size={22} className="text-yellow-400" />
            Mes badges
          </h2>
          {badges.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
              <Award size={48} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Complétez des cours pour gagner des badges !</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-center hover:border-yellow-500/30 transition-all">
                  <span className="text-4xl">{badge.icone}</span>
                  <h3 className="text-white font-semibold mt-2">{badge.nom}</h3>
                  <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* C. NOTIFICATIONS */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell size={22} className="text-blue-400" />
            Notifications récentes
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune notification</p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  notif.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <p className="text-white font-semibold text-sm">{notif.titre}</p>
                  <p className="text-gray-400 text-xs mt-1">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* D. PROGRESSION PAR MODULE */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Détail par module</h2>
          <div className="space-y-4">
            {progression?.modules?.map((module: any) => (
              <div key={module.module_id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} style={{ color: module.couleur }} />
                    <div>
                      <p className="text-white font-semibold">{module.titre}</p>
                      <p className="text-gray-500 text-xs">{module.code} · {module.enseignant_nom}</p>
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${module.progression >= 100 ? 'text-emerald-400' : module.progression >= 50 ? 'text-amber-400' : 'text-violet-400'}`}>
                    {module.progression}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ 
                    width: `${module.progression}%`,
                    background: module.progression >= 100 ? 'linear-gradient(to right, #22c55e, #10b981)' : module.progression >= 50 ? 'linear-gradient(to right, #f59e0b, #f97316)' : 'linear-gradient(to right, #8b5cf6, #6366f1)'
                  }}></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-gray-400">
                  <span>📚 {module.lecons_consultees}/{module.total_lecons} leçons</span>
                  <span>🎯 {module.quiz_completes}/{module.total_quiz} quiz</span>
                </div>
                {module.progression >= 80 && (
                  <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm">
                    <CheckCircle2 size={16} /> Presque terminé !
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EtudiantProgression;