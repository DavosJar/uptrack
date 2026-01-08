import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Loader2, Info } from 'lucide-react';
import { fetchWithAuth } from '../../api/fetch';
import Modal from './Modal';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal state
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Helper to fix backend severity encoding issue (int -> string char conversion bug)
  const normalizeSeverity = (s: string): string => {
    // If backend passes correct strings
    if (s === 'CRITICAL' || s === 'WARNING' || s === 'OK' || s === 'INFO') return s;
    
    // If backend passes integer-as-char (0=\x00, 1=\x01, etc)
    if (s && s.length === 1) {
      const code = s.charCodeAt(0);
      if (code === 0) return 'OK';
      if (code === 1) return 'WARNING';
      if (code === 2) return 'CRITICAL';
      if (code === 3) return 'INFO';
    }
    
    return 'INFO';
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/v1/notifications/history');
      if (response.ok) {
        const data = await response.json();
        const apiNotifications = (data.data || []).map((n: Notification) => ({
             ...n,
             severity: normalizeSeverity(n.severity)
        }));
        setNotifications(apiNotifications);
        setUnreadCount(apiNotifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside modal
      if (isModalOpen) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  const handleNotificationClick = async (notif: Notification) => {
    // 1. Open Modal immediately with basic info
    setIsModalOpen(true);
    setModalLoading(true);
    setSelectedNotification(notif);
    setIsOpen(false); // Close dropdown

    try {
      // 2. Fetch detailed notification by ID
      const response = await fetchWithAuth(`/api/v1/notifications/history/${notif.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
           const normalizedData = {
              ...data.data,
              severity: normalizeSeverity(data.data.severity)
           };
           setSelectedNotification(normalizedData);
           
           // 3. Mark as read if not already
           if (!data.data.is_read) {
             await fetchWithAuth(`/api/v1/notifications/${notif.id}/read`, { method: 'PUT' });
             
             // Update local list state
             setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
             setUnreadCount(c => Math.max(0, c - 1));
           }
        }
      }
    } catch (error) {
      console.error('Error handling notification click', error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-lg text-text-main hover:bg-background-hover transition-colors"
        aria-label={`Ver notificaciones ${unreadCount > 0 ? `(${unreadCount} nuevas)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
        )}
      </button>

      {/* Notification List Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-background-surface border border-border-dark rounded-xl shadow-lg z-50 overflow-hidden"
          role="dialog"
          aria-label="Lista de notificaciones"
        >
          <div className="p-4 border-b border-border-dark flex justify-between items-center">
            <h3 className="font-semibold text-text-main">Notificaciones</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-text-main p-1"
              aria-label="Cerrar notificaciones"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <p>No tienes notificaciones nuevas</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-dark">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button 
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-background-hover transition-colors relative group border-l-4 ${
                        !notification.is_read ? 
                          (notification.severity === 'CRITICAL' ? 'bg-red-500/10' :
                           notification.severity === 'WARNING' ? 'bg-yellow-500/10' :
                           notification.severity === 'OK' ? 'bg-green-500/10' :
                           'bg-blue-500/10')
                          : 'opacity-70'
                      } ${
                        notification.severity === 'CRITICAL' ? 'border-l-red-500' :
                        notification.severity === 'WARNING' ? 'border-l-yellow-500' :
                        notification.severity === 'OK' ? 'border-l-green-500' :
                        'border-l-blue-500'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm font-medium truncate ${notification.is_read ? 'text-text-muted' : 'text-text-main'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                notification.severity === 'CRITICAL' ? 'bg-red-500' :
                                notification.severity === 'WARNING' ? 'bg-yellow-500' :
                                notification.severity === 'OK' ? 'bg-green-500' :
                                'bg-blue-500'
                              }`} aria-label="No leída" />
                            )}
                          </div>
                          <p className="text-sm text-text-muted mt-1 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-muted mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de Notificación"
        borderColor={
            selectedNotification?.severity === 'CRITICAL' ? 'border-red-500' :
            selectedNotification?.severity === 'WARNING' ? 'border-yellow-500' :
            selectedNotification?.severity === 'OK' ? 'border-green-500' :
            'border-blue-500'
        }
      >
        {selectedNotification && (
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  selectedNotification.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                  selectedNotification.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' :
                  selectedNotification.severity === 'OK' ? 'bg-green-500/20 text-green-500' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  <Info size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-text-main">{selectedNotification.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                        selectedNotification.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        selectedNotification.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                        selectedNotification.severity === 'OK' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                    }`}>
                      {selectedNotification.severity === 'CRITICAL' ? 'DOWN' :
                       selectedNotification.severity === 'WARNING' ? 'DEGRADED' :
                       selectedNotification.severity === 'OK' ? 'UP' :
                       'INFO'}
                    </span>
                  </div>
                  <span className="text-sm text-text-muted">{new Date(selectedNotification.created_at).toLocaleString()}</span>
                </div>
             </div>
             
             <div className={`p-4 rounded-lg border ${
               selectedNotification.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
               selectedNotification.severity === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
               selectedNotification.severity === 'OK' ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
               'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
             }`}>
                <p className="text-text-main whitespace-pre-wrap leading-relaxed">
                   {selectedNotification.message}
                </p>
             </div>

            <div className="flex justify-end pt-4">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="px-4 py-2 bg-background-hover hover:bg-border-dark text-text-main rounded-lg transition-colors"
               >
                 Cerrar
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
