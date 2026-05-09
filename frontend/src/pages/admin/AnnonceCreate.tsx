import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  Megaphone, Send, ArrowLeft, ShieldCheck, BookOpen, Users,
  BarChart3, TrendingUp, MessageCircle, LogOut, Plus, X,
  User, Info
} from 'lucide-react';

interface Module {
  id: number;
  code: string;
  titre: string;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

const AdminAnnonceCreate: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [moduleEnseignant, setModuleEnseignant] = useState<string>('');
  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    type: 'information',
    module_id: '' as number | '',
    enseignant_id: '' as number | '', // optionnel
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Récupérer l'utilisateur connecté
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

    // Récupérer les modules et les enseignants
    Promise.all([
      api.get<Module[]>('/admin/modules'),
      api.get<Enseignant[]>('/admin/enseignants')
    ])
      .then(([modulesRes, enseignantsRes]) => {
        setModules(modulesRes.data);
        setEnseignants(enseignantsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Charger l'enseignant associé au module sélectionné (pour info)
  useEffect(() => {
    if (!form.module_id) {
      setModuleEnseignant('');
      return;
    }
    // Récupérer l'enseignant du module via l'API
    api.get(`/api/admin/modules/${form.module_id}/enseignant`)
      .then(res => {
        if (res.data.nom) {
          setModuleEnseignant(`${res.data.prenom} ${res.data.nom}`);
        } else {
          setModuleEnseignant('Non assigné');
        }
      })
      .catch(() => setModuleEnseignant('Non assigné'));
  }, [form.module_id]);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.contenu.trim()) {
      setError('Le titre et le contenu sont obligatoires.');
      return;
    }
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        titre: form.titre,
        contenu: form.contenu,
        type: form.type,
        module_id: form.module_id === '' ? null : form.module_id,
      };
      // Si vous avez modifié le backend pour accepter enseignant_id, décommentez la ligne suivante
      // if (form.enseignant_id) payload.enseignant_id = form.enseignant_id;

      await api.post('/annonces', payload);
      setSuccess('Annonce publiée avec succès !');
      setTimeout(() => navigate('/admin/moderation'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar identique - le code est le même que précédemment, je le coupe pour la lisibilité */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-900/30 border-r border-gray-800/50 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CodexLMS</p>
            <p className="text-gray-500 text-xs">ESPACE ADMINISTRATEUR</p>
          </div>
        </div>
        <nav className="space-y-1 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Administration</p>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BarChart3 size={18} /> Tableau de bord</Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><Users size={18} /> Utilisateurs</Link>
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
        </nav>
        <nav className="space-y-1 mt-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Communauté</p>
          <Link to="/admin/activite" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><TrendingUp size={18} /> Activité</Link>
          <Link to="/admin/forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><MessageCircle size={18} /> Forum</Link>
        </nav>
        <div className="pt-6 border-t border-gray-800 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{getInitiales()}</div>
            <div><p className="text-white text-sm">{user?.prenom} {user?.nom}</p><p className="text-gray-500 text-xs">Admin</p></div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-1"><LogOut size={16} /> Déconnexion</button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin/moderation" className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Nouvelle annonce</h1>
              <p className="text-gray-400 mt-1">Publier une communication pour tous les utilisateurs ou pour un module spécifique</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
              <X size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-2">
              <Megaphone size={18} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Titre *</label>
              <input
                type="text"
                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="ex: Report de séance, Nouveau cours..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              >
                <option value="information">Information</option>
                <option value="urgent">Urgent</option>
                <option value="evenement">Événement</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Module (optionnel)</label>
              <select
                name="module_id"
                value={form.module_id}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              >
                <option value="">-- Tous les modules (annonce générale) --</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>{mod.code} - {mod.titre}</option>
                ))}
              </select>
              {form.module_id && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                  <Info size={14} />
                  <span>Enseignant responsable : <span className="text-white">{moduleEnseignant || 'Chargement...'}</span></span>
                </div>
              )}
              <p className="text-gray-500 text-xs mt-1">Laissez vide pour une annonce générale visible par tous.</p>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Enseignant concerné (optionnel)</label>
              <select
                name="enseignant_id"
                value={form.enseignant_id}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              >
                <option value="">-- Non spécifié --</option>
                {enseignants.map(ens => (
                  <option key={ens.id} value={ens.id}>
                    {ens.prenom} {ens.nom} ({ens.email})
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Permet de cibler un enseignant particulier (par exemple pour signaler un remplacement).
                {!form.enseignant_id && ' Si aucun enseignant n’est sélectionné, l’annonce reste générale.'}
              </p>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Contenu *</label>
              <textarea
                name="contenu"
                value={form.contenu}
                onChange={handleChange}
                rows={6}
                placeholder="Détail de l'annonce..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Link
                to="/admin/moderation"
                className="px-6 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white transition-all"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {sending ? 'Publication...' : 'Publier l\'annonce'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminAnnonceCreate;