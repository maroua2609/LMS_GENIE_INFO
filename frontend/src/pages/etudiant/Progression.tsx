import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  TrendingUp, BookOpen, LogOut, Bell,
  BarChart3, MessageCircle, Megaphone, Bookmark, Zap, Award,
  Download, CheckCircle2, Flame, Trophy, Star, Target,
} from 'lucide-react';


interface User { id: number; nom: string; prenom: string; email: string; role: string; }
interface ModuleProgression {
  module_id: number; code: string; titre: string; couleur: string;
  enseignant_nom: string; total_lecons: number; lecons_consultees: number;
  ratio_lecons: number; total_quiz: number; quiz_completes: number;
  ratio_quiz: number; progression: number; module_complete: boolean;
  derniere_activite: string | null;
}
interface ProgressionData { modules: ModuleProgression[]; progression_globale: number; nb_modules: number; }
interface JourData { jour: string; cours_actifs: number; progression_moyenne: number; }
interface GraphData {
  data_jours: JourData[];
  modules_completes: any[];
  stats: { cours_completes: number; quiz_soumis: number; moyenne_quiz: number; streak: number; } | null;
}
interface Badge { id: string; nom: string; description: string; icone: string; date: string; }
interface Notification { type: string; titre: string; message: string; date: string; }


const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 140 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = value >= 100 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#8b5cf6';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2937" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize={size / 5} fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontFamily: 'inherit' }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
};


const BarChart: React.FC<{ data: JourData[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.progression_moyenne), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="h-44 flex items-end gap-[3px] px-1">
      {data.map((jour, i) => {
        const h = (jour.progression_moyenne / max) * 100;
        const isToday = i === data.length - 1;
        const hasActivity = jour.cours_actifs > 0;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 cursor-pointer group relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap z-10 shadow-lg">
                <p className="font-semibold">{new Date(jour.jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                <p className="text-gray-400">{Math.round(jour.progression_moyenne)}% moy.</p>
                <p className="text-gray-400">{jour.cours_actifs} cours</p>
              </div>
            )}
            <div className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-80"
              style={{
                height: `${Math.max(h, hasActivity ? 4 : 1)}%`,
                background: hasActivity
                  ? (isToday ? 'linear-gradient(to top, #7c3aed, #a78bfa)' : 'linear-gradient(to top, #4c1d95, #7c3aed)')
                  : '#1f2937',
                minHeight: hasActivity ? '4px' : '1px'
              }}
            />
            {isToday && (
              <span className="text-violet-400 text-[9px] font-semibold">auj.</span>
            )}
          </div>
        );
      })}
    </div>
  );
};


const EtudiantProgression: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'badges' | 'notifs'>('modules');
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
      const res = await api.get('/etudiant/progression/export');
      const data = res.data;
      let content = `=== RELEVÉ DE PROGRESSION ===\n\nÉtudiant : ${data.etudiant.prenom} ${data.etudiant.nom}\nFilière : ${data.etudiant.filiere || 'N/A'}\nDate : ${new Date(data.date_export).toLocaleDateString('fr-FR')}\n\n--- MODULES ---\n\n`;
      data.modules.forEach((m: any) => {
        content += `${m.code} - ${m.titre}\n  Leçons : ${m.lecons_consultees}/${m.total_lecons}\n  Progression : ${m.progression_moyenne}%\n  Complété : ${m.module_complete ? 'Oui' : 'Non'}\n\n`;
      });
      content += `--- QUIZ ---\n\n`;
      data.quiz_resultats.forEach((q: any) => {
        content += `${q.code} - ${q.titre} : ${q.note_obtenue}/20 (${new Date(q.fin_le).toLocaleDateString('fr-FR')})\n`;
      });
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
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm animate-pulse">Chargement de votre progression…</p>
      </div>
    </div>
  );

  const stats = graphData?.stats;
  const globalProg = progression?.progression_globale ?? 0;

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
          <Link to="/etudiant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/etudiant/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all"><Bookmark size={18} /> Mes modules</Link>
          <Link to="/etudiant/progression" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 text-violet-400 font-medium text-sm"><TrendingUp size={18} /> Progression</Link>
        </nav>

        <nav className="space-y-1 mb-8">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/annonces" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all"><Megaphone size={18} /> Annonces</Link>
          <Link to="/forum/1" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm transition-all"><MessageCircle size={18} /> Forum</Link>
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">

        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Ma progression</h1>
            <p className="text-gray-400 mt-1">Suivez votre avancement en temps réel</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-500/20">
            <Download size={16} /> Exporter
          </button>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Anneau global */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
            <p className="text-gray-400 text-sm font-medium">Progression globale</p>
            <CircularProgress value={globalProg} size={140} />
            <p className="text-gray-500 text-xs text-center">
              {progression?.nb_modules ?? 0} module{(progression?.nb_modules ?? 0) > 1 ? 's' : ''} · basé sur leçons + quiz
            </p>
          </div>

          
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Cours complétés', value: stats?.cours_completes ?? 0, icon: <CheckCircle2 size={20} className="text-emerald-400" />, color: 'emerald' },
              { label: 'Quiz soumis', value: stats?.quiz_soumis ?? 0, icon: <Target size={20} className="text-blue-400" />, color: 'blue' },
              { label: 'Moyenne quiz', value: stats?.moyenne_quiz ? `${Math.round(stats.moyenne_quiz)}/20` : 'N/A', icon: <Star size={20} className="text-amber-400" />, color: 'amber' },
              { label: 'Streak actuel', value: `${stats?.streak ?? 0}j 🔥`, icon: <Flame size={20} className="text-orange-400" />, color: 'orange' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-xl bg-${s.color}-500/10 flex items-center justify-center`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}

            {/* Graphique 30 jours */}
            <div className="col-span-2 sm:col-span-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Activité — 30 derniers jours</h3>
                <span className="text-xs text-gray-500">% moyen par jour</span>
              </div>
              {graphData?.data_jours && graphData.data_jours.length > 0
                ? <BarChart data={graphData.data_jours} />
                : <p className="text-gray-600 text-sm text-center py-12">Aucune activité enregistrée</p>
              }
            </div>
          </div>
        </div>

        
        <div className="flex gap-2 mb-6">
          {[
            { key: 'modules', label: 'Modules', icon: <BookOpen size={15} /> },
            { key: 'badges',  label: `Badges (${badges.length})`, icon: <Award size={15} /> },
            { key: 'notifs',  label: `Notifications (${notifications.length})`, icon: <Bell size={15} /> },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {!progression?.modules?.length && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 text-center">
                <BookOpen size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucun module inscrit pour le moment.</p>
              </div>
            )}
            {progression?.modules?.map((module) => {
              const pct = module.progression;
              const barColor = pct >= 100
                ? 'linear-gradient(to right, #22c55e, #10b981)'
                : pct >= 60 ? 'linear-gradient(to right, #f59e0b, #f97316)'
                : 'linear-gradient(to right, #8b5cf6, #6366f1)';
              return (
                <div key={module.module_id}
                  className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all group">

                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      
                      <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: module.couleur || '#8b5cf6' }} />
                      <div>
                        <p className="text-white font-semibold leading-tight">{module.titre}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {module.code} · {module.enseignant_nom}
                          {module.derniere_activite && (
                            <span className="ml-2 text-gray-600">
                              · dernière activité {new Date(module.derniere_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {module.module_complete && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-lg font-medium">
                          <CheckCircle2 size={12} /> Complété
                        </span>
                      )}
                      <span className={`text-xl font-bold ${pct >= 100 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-violet-400'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  
                  <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                  </div>

                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/40 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-gray-400 text-xs">📚 Leçons</span>
                        <span className="text-white text-xs font-semibold">{module.lecons_consultees}/{module.total_lecons}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${module.total_lecons > 0 ? (module.lecons_consultees / module.total_lecons) * 100 : 0}%` }} />
                      </div>
                      <span className="text-gray-600 text-xs mt-1 block">{module.ratio_lecons}% · poids 60%</span>
                    </div>

                    <div className="bg-gray-800/40 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-gray-400 text-xs">🎯 Quiz</span>
                        <span className="text-white text-xs font-semibold">{module.quiz_completes}/{module.total_quiz}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-700"
                          style={{ width: `${module.total_quiz > 0 ? (module.quiz_completes / module.total_quiz) * 100 : 0}%` }} />
                      </div>
                      <span className="text-gray-600 text-xs mt-1 block">{module.ratio_quiz}% · poids 40%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        
        {activeTab === 'badges' && (
          <>
            {badges.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                <Award size={52} className="text-gray-700 mx-auto mb-4" />
                <p className="text-white font-semibold mb-1">Pas encore de badges</p>
                <p className="text-gray-500 text-sm">Complétez des cours et réussissez des quiz pour en gagner !</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-center hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group cursor-default">
                    <span className="text-5xl block mb-3 group-hover:scale-110 transition-transform duration-200">
                      {badge.icone}
                    </span>
                    <h3 className="text-white font-semibold text-sm">{badge.nom}</h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{badge.description}</p>
                  </div>
                ))}

                
                {[
                  { nom: 'Assidu', description: '7 jours consécutifs d\'activité', icone: '🔥' },
                  { nom: 'Parfait', description: '20/20 à un quiz', icone: '💎' },
                  { nom: 'Expert', description: 'Progression globale à 100%', icone: '👑' },
                ].filter(b => !badges.find(bb => bb.nom === b.nom)).map((badge, i) => (
                  <div key={i}
                    className="bg-gray-900/20 border border-gray-800/50 rounded-2xl p-5 text-center opacity-40">
                    <span className="text-5xl block mb-3 grayscale">{badge.icone}</span>
                    <h3 className="text-gray-500 font-semibold text-sm">{badge.nom}</h3>
                    <p className="text-gray-600 text-xs mt-1">{badge.description}</p>
                    <p className="text-gray-700 text-xs mt-2">🔒 Verrouillé</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        
        {activeTab === 'notifs' && (
          <>
            {notifications.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                <Bell size={48} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Aucune notification pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, i) => (
                  <div key={i}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      notif.type === 'success'
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                        : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                    }`}>
                    <span className="text-2xl mt-0.5">
                      {notif.type === 'success' ? '🎉' : '🎯'}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-sm">{notif.titre}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default EtudiantProgression;