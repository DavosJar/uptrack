import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fetchWithAuth } from '../api/fetch';

// Íconos SVG
const ArrowLeftIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Path d="M12 19l-7-7 7-7" />
  </Svg>
);

const BellIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const AlertCircleIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const CheckCircleIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Path d="M22 4L12 14.01l-3-3" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const SendIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13" />
    <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

const SettingsIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

// Interfaces
interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'RECOVERY';
  is_read: boolean;
  created_at: string;
}

interface NotificationMethod {
  id: string;
  type: 'TELEGRAM' | 'SLACK';
  value: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface NotificationsScreenProps {
  onBack: () => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [methods, setMethods] = useState<NotificationMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/notifications/history');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error al cargar notificaciones');
    }
  }, []);

  const fetchMethods = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/notifications/methods');
      if (response.ok) {
        const data = await response.json();
        setMethods(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching methods:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchMethods()]);
    setLoading(false);
  }, [fetchNotifications, fetchMethods]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetchWithAuth(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleLinkTelegram = async () => {
    try {
      const response = await fetchWithAuth('/api/v1/notifications/telegram/link');
      if (response.ok) {
        const data = await response.json();
        const linkData = data.data || data;
        if (linkData.telegram_link) {
          Alert.alert(
            'Vincular Telegram',
            'Se abrirá Telegram para vincular tu cuenta. Envía el comando /start al bot.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Telegram', onPress: () => Linking.openURL(linkData.telegram_link) },
            ]
          );
        } else {
          Alert.alert('Error', 'No se pudo obtener el enlace de Telegram');
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el enlace de Telegram');
      }
    } catch (err) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return colors.statusDanger;
      case 'WARNING': return colors.statusWarning;
      case 'RECOVERY': return colors.statusSuccess;
      case 'INFO': return colors.primary;
      default: return colors.textMuted;
    }
  };

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    switch (severity) {
      case 'CRITICAL': return <AlertCircleIcon size={20} color={color} />;
      case 'WARNING': return <AlertTriangleIcon size={20} color={color} />;
      case 'RECOVERY': return <CheckCircleIcon size={20} color={color} />;
      default: return <BellIcon size={20} color={color} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeftIcon size={24} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <BellIcon size={18} color={activeTab === 'history' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} color={activeTab === 'settings' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Configuración
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : activeTab === 'history' ? (
          // Historial de Notificaciones
          notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BellIcon size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
              <Text style={styles.emptySubtext}>
                Las alertas de tus sistemas aparecerán aquí
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.is_read && styles.notificationCardUnread,
                  ]}
                  onPress={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: getSeverityColor(notification.severity) + '20' }]}>
                    {getSeverityIcon(notification.severity)}
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          // Configuración de Notificaciones
          <View style={styles.settingsContainer}>
            {/* Métodos de Notificación */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MÉTODOS DE NOTIFICACIÓN</Text>
              
              {methods.length === 0 ? (
                <View style={styles.emptyMethodsCard}>
                  <SendIcon size={32} color={colors.textMuted} />
                  <Text style={styles.emptyMethodsText}>
                    No tienes métodos configurados
                  </Text>
                  <Text style={styles.emptyMethodsSubtext}>
                    Configura Telegram o Slack para recibir alertas
                  </Text>
                </View>
              ) : (
                <View style={styles.methodsList}>
                  {methods.map((method) => (
                    <View key={method.id} style={styles.methodCard}>
                      <View style={styles.methodIconContainer}>
                        {method.type === 'TELEGRAM' ? (
                          <SendIcon size={20} color={colors.primary} />
                        ) : (
                          <SendIcon size={20} color="#4A154B" />
                        )}
                      </View>
                      <View style={styles.methodInfo}>
                        <Text style={styles.methodType}>{method.type}</Text>
                        <Text style={styles.methodValue} numberOfLines={1}>
                          {method.value}
                        </Text>
                      </View>
                      <View style={[
                        styles.methodStatusBadge,
                        { backgroundColor: method.is_active ? colors.statusSuccess + '20' : colors.textMuted + '20' }
                      ]}>
                        <Text style={[
                          styles.methodStatusText,
                          { color: method.is_active ? colors.statusSuccess : colors.textMuted }
                        ]}>
                          {method.is_active ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Acciones */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VINCULAR CUENTA</Text>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleLinkTelegram}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#0088cc20' }]}>
                  <SendIcon size={20} color="#0088cc" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Vincular Telegram</Text>
                  <Text style={styles.actionSubtitle}>Recibe alertas en tu Telegram</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { opacity: 0.5 }]} 
                disabled
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#4A154B20' }]}>
                  <SendIcon size={20} color="#4A154B" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Vincular Slack</Text>
                  <Text style={styles.actionSubtitle}>Próximamente</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  unreadBadge: {
    marginLeft: 8,
    backgroundColor: colors.statusDanger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  notificationCardUnread: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMain,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textMuted,
    opacity: 0.7,
  },
  settingsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyMethodsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  emptyMethodsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMain,
    marginTop: 12,
  },
  emptyMethodsSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  methodsList: {
    gap: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  methodValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  methodStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMain,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default NotificationsScreen;
