import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/config';
import {
  ShieldCheck, BookOpen, Users, BarChart3, TrendingUp, MessageCircle,
  LogOut, Megaphone, AlertTriangle, Trash2, Eye, EyeOff, CheckCircle,
  X, RefreshCw, Filter, Calendar, User, MessageSquare,
  Plus
} from 'lucide-react';

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  auteur_id: number;
  auteur_nom: string;
  auteur_prenom: string;
  module_id: number | null;
  module_titre?: string;
  publie: boolean;
  created_at: string;
}

interface Sujet {
  id: number;
  titre: string;
  contenu: string;
  auteur_id: number;
  auteur_nom: string;
  auteur_prenom: string;
  module_id: number;
  module_titre?: string;
  reponses_count: number;
  created_at: string;
}

const AdminModeration: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'annonces' | 'forum'>('annonces');
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'delete' | 'toggle' | ''>('');
  const [filterModule, setFilterModule] = useState<string>('tous');
  const [modules, setModules] = useState<{ id: number; titre: string }[]>([]);

  
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

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      const [annoncesRes, sujetsRes] = await Promise.all([
        api.get<Annonce[]>('/annonces'),
        api.get<Sujet[]>('/forum/sujets') 
      ]);
      setAnnonces(annoncesRes.data);
      setSujets(sujetsRes.data);
      
      // Extraire les modules uniques pour le filtre
      const allModules = [...annoncesRes.data, ...sujetsRes.data]
        .filter(item => item.module_id)
        .map(item => ({ id: item.module_id!, titre: item.module_titre || `Module ${item.module_id}` }));
      const uniqueModules = Array.from(new Map(allModules.map(m => [m.id, m])).values());
      setModules(uniqueModules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const getInitiales = () => user ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}` : '??';

  
  const deleteAnnonce = async (id: number) => {
    try {
      await api.delete(`/annonces/${id}`);
      setAnnonces(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  
  const deleteSujet = async (id: number) => {
    try {
      await api.delete(`/forum/sujets/${id}`);
      setSujets(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

 
  const toggleAnnonce = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/annonces/${id}/toggle`, { publie: !currentStatus });
      setAnnonces(prev => prev.map(a => a.id === id ? { ...a, publie: !currentStatus } : a));
    } catch (err) {
      console.error(err);
      alert('Erreur lors du changement de statut');
    }
  };

  
  const confirmAction = (item: any, type: 'delete' | 'toggle') => {
    setSelectedItem(item);
    setActionType(type);
    setShowConfirm(true);
  };

  const executeAction = () => {
    if (!selectedItem) return;
    if (activeTab === 'annonces') {
      if (actionType === 'delete') deleteAnnonce(selectedItem.id);
      else if (actionType === 'toggle') toggleAnnonce(selectedItem.id, selectedItem.publie);
    } else {
      if (actionType === 'delete') deleteSujet(selectedItem.id);
    }
    setShowConfirm(false);
    setSelectedItem(null);
    setActionType('');
  };

  
  const filteredAnnonces = filterModule === 'tous' 
    ? annonces 
    : annonces.filter(a => a.module_id?.toString() === filterModule);
  
  const filteredSujets = filterModule === 'tous'
    ? sujets
    : sujets.filter(s => s.module_id.toString() === filterModule);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
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
          <Link to="/admin/modules" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium text-sm"><BookOpen size={18} /> Modules</Link>
          <Link to="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium text-sm"><ShieldCheck size={18} /> Modération</Link>
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
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-white">Modération</h1>
      <p className="text-gray-400 mt-1">Surveillez et retirez les contenus inappropriés publiés sur la plateforme.</p>
    </div>
    <Link
      to="/admin/annonces/create"
      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
    >
      <Plus size={16} /> Nouvelle annonce
    </Link>
  </div>

        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <Megaphone size={24} className="text-blue-400 mb-3" />
            <p className="text-3xl font-bold text-white">{annonces.length}</p>
            <p className="text-gray-400 text-sm">Annonces</p>
            
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <MessageSquare size={24} className="text-purple-400 mb-3" />
            <p className="text-3xl font-bold text-white">{sujets.length}</p>
            <p className="text-gray-400 text-sm">Sujets forum</p>
          </div>
        </div>

        
        <div className="flex gap-2 border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('annonces')}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-t-xl ${
              activeTab === 'annonces'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Megaphone size={16} className="inline mr-2" /> Annonces
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-t-xl ${
              activeTab === 'forum'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle size={16} className="inline mr-2" /> Forum
          </button>
        </div>

        
        <div className="flex items-center gap-3 mb-6">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-purple-500 outline-none"
          >
            <option value="tous">Tous les modules</option>
            {modules.map(m => (
              <option key={m.id} value={m.id.toString()}>{m.titre}</option>
            ))}
          </select>
          <button onClick={fetchData} className="ml-auto p-2 text-gray-400 hover:text-white transition-colors" title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
        </div>

        
        {activeTab === 'annonces' && (
          <div className="space-y-4">
            {filteredAnnonces.map(annonce => (
              <div key={annonce.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {annonce.publie ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <EyeOff size={14} className="text-gray-500" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${annonce.type === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {annonce.type || 'Générale'}
                      </span>
                      {annonce.module_titre && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          {annonce.module_titre}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{annonce.titre}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{annonce.contenu}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User size={12} /> {annonce.auteur_prenom} {annonce.auteur_nom}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(annonce.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmAction(annonce, 'toggle')}
                      className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      title={annonce.publie ? 'Masquer' : 'Publier'}
                    >
                      {annonce.publie ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => confirmAction(annonce, 'delete')}
                      className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredAnnonces.length === 0 && (
              <div className="text-center py-12 text-gray-500">Aucune annonce trouvée.</div>
            )}
          </div>
        )}

        {/* Liste des sujets forum */}
        {activeTab === 'forum' && (
          <div className="space-y-4">
            {filteredSujets.map(sujet => (
              <div key={sujet.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle size={14} className="text-purple-400" />
                      {sujet.module_titre && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          {sujet.module_titre}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">💬 {sujet.reponses_count} réponses</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{sujet.titre}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{sujet.contenu}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User size={12} /> {sujet.auteur_prenom} {sujet.auteur_nom}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(sujet.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmAction(sujet, 'delete')}
                      className="p-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Supprimer le sujet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredSujets.length === 0 && (
              <div className="text-center py-12 text-gray-500">Aucun sujet trouvé.</div>
            )}
          </div>
        )}
      </main>

      
      {showConfirm && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Confirmer l'action</h3>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-2">
              {actionType === 'delete' && `Voulez-vous vraiment supprimer ${activeTab === 'annonces' ? 'cette annonce' : 'ce sujet'} ?`}
              {actionType === 'toggle' && `Voulez-vous ${selectedItem.publie ? 'masquer' : 'publier'} cette annonce ?`}
            </p>
            <p className="text-red-400 text-sm mb-6">
              {actionType === 'delete' && 'Cette action est irréversible.'}
              {actionType === 'toggle' && (selectedItem.publie ? "L'annonce ne sera plus visible par les utilisateurs." : "L'annonce redeviendra visible.")}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white">
                Annuler
              </button>
              <button onClick={executeAction} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;