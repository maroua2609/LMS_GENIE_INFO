import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/config';
import {
  BookOpen, Save, ArrowLeft, Trash2, Upload,
  Database, Wifi, Server, Globe, Brain, GitBranch,
  // Éléments de la sidebar
  ShieldCheck, LogOut, Users, BarChart3, TrendingUp, MessageCircle, Plus,
  Search, Layers, Megaphone, Pencil, X, RefreshCw
} from 'lucide-react';


const iconMap: Record<string, React.ElementType> = {
  database: Database,
  wifi: Wifi,
  server: Server,
  globe: Globe,
  brain: Brain,
  'git-branch': GitBranch,
};

interface ModuleData {
  id: number;
  code: string;
  titre: string;
  description: string | null;
  couleur: string;
  semestre: number;
  credits: number;
  actif: boolean;
  annee_niveau: number | string;
  icone: string | null;
  enseignant_id: number | null;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

const ModuleEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        else navigate('/login');
      });
  }, [navigate]);

 
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [moduleRes, enseignantsRes] = await Promise.all([
          api.get<ModuleData>(`/admin/modules/${id}`),
          api.get<Enseignant[]>('/admin/enseignants')
        ]);
        setModuleData(moduleRes.data);
        setEnseignants(enseignantsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () =>
    user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (!moduleData) return;

    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'semestre' || name === 'credits') {
      newValue = parseInt(value, 10);
    } else if (name === 'annee_niveau') {
      newValue = isNaN(parseInt(value)) ? value : parseInt(value);
    }

    setModuleData({ ...moduleData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleData) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/admin/modules/${moduleData.id}`, moduleData);
      setSuccess('Module mis à jour avec succès');
      setTimeout(() => navigate('/admin/modules'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleData) return;
    if (!window.confirm(`Supprimer définitivement le module "${moduleData.titre}" ?`)) return;

    try {
      await api.delete(`/admin/modules/${moduleData.id}`);
      navigate('/admin/modules');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const renderIconPreview = () => {
    if (!moduleData?.icone) return <BookOpen size={28} className="text-white/90" />;
    if (moduleData.icone.startsWith('http')) {
      return <img src={moduleData.icone} alt="icône" className="w-14 h-14 rounded-2xl object-cover" />;
    }
    const IconComponent = iconMap[moduleData.icone.toLowerCase()];
    if (IconComponent) return <IconComponent size={28} style={{ color: moduleData.couleur }} />;
    return <span style={{ fontSize: '1.75rem', lineHeight: '1' }}>{moduleData.icone}</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
    </div>
  );

  if (!moduleData) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      Module non trouvé
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">GINFLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ADMINISTRATEUR</p>
          </div>
        </div>

        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Administration</p>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Users size={18} /> Utilisateurs</Link>
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
        </nav>

        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3"></p>
          </nav>

        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/modules')}
                className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold text-white">Modifier le module</h1>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-sm flex items-center gap-2 transition-all"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          </div>

          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400">
              {success}
            </div>
          )}

          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <label className="block text-gray-400 text-sm mb-3">Aperçu de l'icône</label>
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: moduleData.couleur + '20' }}
              >
                {renderIconPreview()}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Valeur actuelle : <span className="font-mono">{moduleData.icone || '(aucune)'}</span>
              </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Code *</label>
                <input
                  type="text"
                  name="code"
                  value={moduleData.code}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Titre *</label>
                <input
                  type="text"
                  name="titre"
                  value={moduleData.titre}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Description</label>
              <textarea
                name="description"
                value={moduleData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Année / Niveau</label>
                <select
                  name="annee_niveau"
                  value={moduleData.annee_niveau}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                >
                  <option value="1">1ère année</option>
                  <option value="2">2ème année</option>
                  <option value="3">3ème année</option>
                  
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Semestre</label>
                <select
                  name="semestre"
                  value={moduleData.semestre}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                >
                  {[1,2,3,4,5,6].map(s => <option key={s} value={s}>S{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Crédits ECTS</label>
                <input
                  type="number"
                  name="credits"
                  value={moduleData.credits}
                  onChange={handleChange}
                  min={1}
                  max={30}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Couleur (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="couleur"
                    value={moduleData.couleur}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-xl border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="couleur"
                    value={moduleData.couleur}
                    onChange={handleChange}
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Icône (emoji ou URL ou nom d'icône)</label>
                <input
                  type="text"
                  name="icone"
                  value={moduleData.icone || ''}
                  onChange={handleChange}
                  placeholder="Ex: 📘, https://.../icon.png, database, wifi"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Suggestion emojis : 📘 💻 🗄️ 📡 ☕ 🧠 🌐
                </p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Enseignant responsable</label>
                <select
                  name="enseignant_id"
                  value={moduleData.enseignant_id || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                >
                  <option value="">-- Non assigné --</option>
                  {enseignants.map(ens => (
                    <option key={ens.id} value={ens.id}>
                      {ens.prenom} {ens.nom} ({ens.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="actif"
                  checked={moduleData.actif}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-400">Module actif</span>
              </label>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => navigate('/admin/modules')}
                className="px-6 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ModuleEdit;