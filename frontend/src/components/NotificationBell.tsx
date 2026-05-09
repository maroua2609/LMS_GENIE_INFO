import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/config';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  lien?: string;
  lu: boolean;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get<Notification[]>('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.lu).length);
    } catch (err) {
      console.error('Erreur chargement notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // toutes les 30s
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await api.put(`/notifications/${notif.id}/lire`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n));
        setUnreadCount(prev => prev - 1);
      } catch (err) {
        console.error('Erreur marquage notification', err);
      }
    }
    // Rediriger vers le lien si présent
    if (notif.lien) {
      navigate(notif.lien);
    }
    setShowDropdown(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '📝';
      case 'annonce': return '📢';
      case 'ressource': return '📁';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Notifications</h3>
            <p className="text-gray-400 text-xs mt-1">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune notification</p>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors flex items-start gap-3 ${!notif.lu ? 'bg-gray-800/20' : ''}`}
                >
                  <span className="text-xl">{getIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notif.lu ? 'text-white' : 'text-gray-400'}`}>
                        {notif.titre}
                      </p>
                      {!notif.lu && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-gray-600 text-xs mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;