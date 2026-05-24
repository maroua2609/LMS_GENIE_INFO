import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import { Module } from '../../types';
import {
  Users, BarChart3, Search, GraduationCap, LogOut, BookOpen,
  FileText, MessageCircle, Megaphone, ClipboardCheck, ChevronDown,
  ChevronRight, Target, TrendingUp, AlertTriangle, ArrowUpDown,
  Download
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  numero_etudiant?: string;
  progression_moyenne: number;
  meilleure_note?: number;
  quiz_soumis: number;
}

interface ModuleProgression {
  code: string;
  titre: string;
  couleur: string;
  total_cours: number;
  cours_consultees: number;
  progression_moyenne: number;
}

interface QuizResultat {
  titre: string;
  note_obtenue: number;
  fin_le: string;
  code: string;
}

interface StatsGlobales {
  total_etudiants: number;
  progression_globale: number;
  total_quiz: number;
  a_risque: number;
}

interface DetailEtudiant {
  modules_progression: ModuleProgression[];
  quiz_resultats: QuizResultat[];
}

type TriType = 'progression_desc' | 'progression_asc' | 'nom_asc' | 'nom_desc' | 'quiz_desc' | 'quiz_asc';

// ─── Composant ─────────────────────────────────────────────────────────────────
const EnseignantNotes: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [stats, setStats] = useState<StatsGlobales>({ total_etudiants: 0, progression_globale: 0, total_quiz: 0, a_risque: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tri, setTri] = useState<TriType>('progression_desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // FIX 1 : detail est un Map par etudiant_id pour éviter les mélanges
  const [detailMap, setDetailMap] = useState<Record<number, DetailEtudiant>>({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);
  const navigate = useNavigate();

  // FIX 3 : utilisateur chargé via l'API, pas localStorage
  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(console.error);
    api.get<Module[]>('/modules').then(res => setModules(res.data)).catch(console.error);
  }, []);

  // Chargement des étudiants et statistiques en fonction du module sélectionné
  useEffect(() => {
    setLoading(true);
    const params = selectedModule ? { module_id: selectedModule } : {};
    Promise.all([
      api.get<Etudiant[]>('/enseignant/etudiants', { params }),
      api.get<StatsGlobales>('/enseignant/stats/etudiants', { params })
    ])
      .then(([etudiantsRes, statsRes]) => {
        setEtudiants(etudiantsRes.data);
        setStats(statsRes.data);
        // Réinitialiser les détails ouverts si le module change
        setExpandedId(null);
        setDetailMap({});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedModule]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  // Filtrage et tri
  const filteredEtudiants = useMemo(() => {
    let filtered = etudiants.filter(e =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      (e.numero_etudiant && e.numero_etudiant.toLowerCase().includes(search.toLowerCase()))
    );
    switch (tri) {
      case 'progression_desc': filtered.sort((a, b) => b.progression_moyenne - a.progression_moyenne); break;
      case 'progression_asc':  filtered.sort((a, b) => a.progression_moyenne - b.progression_moyenne); break;
      case 'nom_asc':          filtered.sort((a, b) => a.nom.localeCompare(b.nom) || a.prenom.localeCompare(b.prenom)); break;
      case 'nom_desc':         filtered.sort((a, b) => b.nom.localeCompare(a.nom) || b.prenom.localeCompare(a.prenom)); break;
      case 'quiz_desc':        filtered.sort((a, b) => b.quiz_soumis - a.quiz_soumis); break;
      case 'quiz_asc':         filtered.sort((a, b) => a.quiz_soumis - b.quiz_soumis); break;
    }
    return filtered;
  }, [etudiants, search, tri]);

  // FIX 1 : chaque étudiant a son propre détail dans detailMap
  const toggleExpand = async (etudiantId: number) => {
    if (expandedId === etudiantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(etudiantId);
    // Ne recharge pas si déjà en cache
    if (detailMap[etudiantId]) return;
    setDetailLoading(etudiantId);
    try {
      const res = await api.get<DetailEtudiant>(`/enseignant/etudiants/${etudiantId}/detail`);
      setDetailMap(prev => ({ ...prev, [etudiantId]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(null);
    }
  };

  // FIX 4 : export via l'instance api (baseURL centralisée)
  const handleExportCSV = async () => {
    try {
      const params = selectedModule ? { module_id: selectedModule } : {};
      const response = await api.get('/enseignant/export/notes-complet', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notes_detaillees.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ─── SIDEBAR ────────────────────────────────────────── */}
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
          <Link to="/enseignant/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-sm"><Users size={18} /> Étudiants</Link>
          <Link to="/enseignant/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><MessageCircle size={18} /> Forum</Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Enseignant</p></div>
          </div>
          {/* FIX 5 : flex items-center gap-1 pour aligner icône et texte */}
          <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ─── CONTENU PRINCIPAL ─────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Étudiants</h1>
            <p className="text-gray-400 mt-1">Suivi détaillé de la progression et des évaluations</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        </div>

        {/* Sélecteur de module */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Filtrer par module</label>
          <select
            value={selectedModule ?? ''}
            onChange={(e) => setSelectedModule(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full md:w-72 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all text-sm"
          >
            <option value="">Tous les modules</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.code} — {m.titre}</option>
            ))}
          </select>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <Users size={24} className="text-blue-400 mb-3" />
            <p className="text-3xl font-bold text-white">{stats.total_etudiants}</p>
            <p className="text-gray-400 text-sm">Étudiants suivis</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <TrendingUp size={24} className="text-emerald-400 mb-3" />
            <p className="text-3xl font-bold text-white">{stats.progression_globale}%</p>
            <p className="text-gray-400 text-sm">Progression moy.</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <Target size={24} className="text-purple-400 mb-3" />
            <p className="text-3xl font-bold text-white">{stats.total_quiz}</p>
            <p className="text-gray-400 text-sm">Quiz soumis</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <AlertTriangle size={24} className="text-red-400 mb-3" />
            <p className="text-3xl font-bold text-white">{stats.a_risque}</p>
            <p className="text-gray-400 text-sm">À risque (&lt;30%)</p>
          </div>
        </div>

        {/* Recherche + tri */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom ou numéro..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTri(tri === 'progression_desc' ? 'progression_asc' : 'progression_desc')}
              className={`flex items-center gap-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${tri.startsWith('progression') ? 'bg-emerald-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
              <ArrowUpDown size={14} /> Progression
            </button>
            <button onClick={() => setTri(tri === 'nom_asc' ? 'nom_desc' : 'nom_asc')}
              className={`flex items-center gap-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${tri.startsWith('nom') ? 'bg-emerald-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
              <ArrowUpDown size={14} /> Nom
            </button>
            <button onClick={() => setTri(tri === 'quiz_desc' ? 'quiz_asc' : 'quiz_desc')}
              className={`flex items-center gap-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${tri.startsWith('quiz') ? 'bg-emerald-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
              <ArrowUpDown size={14} /> Quiz
            </button>
          </div>
        </div>

        {/* FIX 2 : spinner affiché pendant le chargement */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEtudiants.map((etudiant) => {
              // FIX 1 : détail propre à chaque étudiant
              const etudiantDetail = detailMap[etudiant.id] ?? null;
              const isLoadingDetail = detailLoading === etudiant.id;

              return (
                <div key={etudiant.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/30 transition-all"
                    onClick={() => toggleExpand(etudiant.id)}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold">
                        {etudiant.prenom.charAt(0)}{etudiant.nom.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{etudiant.prenom} {etudiant.nom}</h3>
                        <p className="text-gray-400 text-xs">{etudiant.email}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 mr-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Progression</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-2 rounded-full ${etudiant.progression_moyenne < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(etudiant.progression_moyenne, 100)}%` }}></div>
                          </div>
                          <span className="text-white font-bold text-sm">{etudiant.progression_moyenne}%</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Meilleure note</p>
                        {/* FIX 6 : protection sur meilleure_note undefined */}
                        <p className="text-white font-bold text-sm">
                          {etudiant.meilleure_note != null ? `${etudiant.meilleure_note}/20` : '—'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Quiz</p>
                        <p className="text-white font-bold text-sm">{etudiant.quiz_soumis}</p>
                      </div>
                      {etudiant.progression_moyenne < 30 && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">À risque</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedId === etudiant.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Panneau détaillé — FIX 1 : données isolées par étudiant */}
                  {expandedId === etudiant.id && (
                    <div className="border-t border-gray-800 p-6 bg-gray-900/30">
                      {isLoadingDetail ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                        </div>
                      ) : etudiantDetail ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <BarChart3 size={16} className="text-emerald-400" /> Progression par module
                            </h4>
                            {etudiantDetail.modules_progression.map((mod) => (
                              <div key={mod.code} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mod.couleur }}></span>
                                  <span className="text-white text-sm">{mod.code}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-xs">{mod.cours_consultees}/{mod.total_cours} cours</span>
                                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mod.progression_moyenne}%` }}></div>
                                  </div>
                                  <span className="text-white text-xs font-semibold w-8 text-right">{Math.round(mod.progression_moyenne)}%</span>
                                </div>
                              </div>
                            ))}
                            {etudiantDetail.modules_progression.length === 0 && <p className="text-gray-500 text-sm">Aucun module.</p>}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <Target size={16} className="text-purple-400" /> Derniers quiz
                            </h4>
                            {etudiantDetail.quiz_resultats.map((quiz, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                                <div>
                                  <p className="text-white text-sm">{quiz.titre}</p>
                                  <p className="text-gray-500 text-xs">{quiz.code} – {new Date(quiz.fin_le).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <span className={`font-bold text-sm ${quiz.note_obtenue >= 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {quiz.note_obtenue}/20
                                </span>
                              </div>
                            ))}
                            {etudiantDetail.quiz_resultats.length === 0 && <p className="text-gray-500 text-sm">Aucun quiz soumis.</p>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Impossible de charger les détails.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredEtudiants.length === 0 && (
              <p className="text-gray-500 text-center py-12">Aucun étudiant trouvé.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EnseignantNotes;