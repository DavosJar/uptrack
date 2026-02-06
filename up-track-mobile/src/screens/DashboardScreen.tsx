import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Svg, Path, Rect, Circle, Polyline } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/fetch';
import Layout from '../components/Layout';

// Icons
const MonitorIcon = ({ size = 20, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Path d="M8 21h8M12 17v4" />
  </Svg>
);

const CheckCircleIcon = ({ size = 20, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 20, color = colors.statusDanger }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Path d="M12 9v4M12 17h.01" />
  </Svg>
);

const SearchIcon = ({ size = 20, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </Svg>
);

const PlusIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const LogOutIcon = ({ size = 20, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
  current_status: string;
  last_checked_at: string | null;
  avg_response_time: number;
}

interface DashboardScreenProps {
  onNavigateToAddTarget?: () => void;
  onNavigateToDetails?: (targetId: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToAddTarget, onNavigateToDetails }) => {
  const { logout } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Estados para logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/targets');
      if (response.ok) {
        const data = await response.json();
        const targetsData = data.data || [];
        console.log('Targets loaded:', JSON.stringify(targetsData.map((t: Target) => ({ name: t.name, status: t.current_status }))));
        setTargets(targetsData);
        setError('');
      } else {
        setError('Error al cargar los sistemas');
      }
    } catch (err) {
      setError('Error de red');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTargets();
  }, [fetchTargets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return colors.statusSuccess;
      case 'DOWN': return colors.statusDanger;
      case 'DEGRADED': return colors.statusWarning;
      case 'FLAPPING': return '#F97316';
      case 'UNSTABLE': return '#A855F7';
      default: return colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UP': return 'En línea';
      case 'DOWN': return 'Fuera de línea';
      case 'DEGRADED': return 'Degradado';
      case 'FLAPPING': return 'Inestable';
      case 'UNSTABLE': return 'Inestable';
      default: return 'Desconocido';
    }
  };

  const totalTargets = targets.length;
  const onlineTargets = targets.filter(t => t.current_status === 'UP').length;
  const alertsTargets = targets.filter(t => 
    ['DOWN', 'DEGRADED', 'FLAPPING', 'UNSTABLE'].includes(t.current_status)
  ).length;

  const filteredTargets = targets
    .filter(target => target.current_status !== 'UP')
    .filter(target => {
      const matchesSearch = target.name.toLowerCase().includes(search.toLowerCase()) ||
                           target.url.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || target.current_status === filterStatus;
      return matchesSearch && matchesFilter;
    });

  const filterOptions = [
    { key: 'ALL', label: 'Todos' },
    { key: 'DOWN', label: 'Offline' },
    { key: 'DEGRADED', label: 'Degradado' },
    { key: 'FLAPPING', label: 'Inestable' },
  ];

  return (
    <Layout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Bienvenido al dashboard de monitoreo.</Text>
          </View>
          <View style={styles.headerRight}>
            {onNavigateToAddTarget && (
              <TouchableOpacity style={styles.addButton} onPress={onNavigateToAddTarget}>
                <PlusIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
              <LogOutIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MonitorIcon size={18} color={colors.primary} />
              <Text style={styles.statLabel}>Total Sistemas</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalTargets}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <CheckCircleIcon size={18} color={colors.statusSuccess} />
              <Text style={styles.statLabel}>Online</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.statusSuccess }]}>{onlineTargets}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangleIcon size={18} color={colors.statusDanger} />
              <Text style={styles.statLabel}>Alertas</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.statusDanger }]}>{alertsTargets}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando sistemas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTargets}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : targets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MonitorIcon size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay sistemas configurados.</Text>
            <Text style={styles.emptySubtext}>Agrega uno desde la versión web.</Text>
          </View>
        ) : (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <SearchIcon size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar sistemas..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContainer}
            >
              {filterOptions.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterButton,
                    filterStatus === key && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterStatus(key)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === key && styles.filterButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Targets List */}
            <View style={styles.targetsContainer}>
              {filteredTargets.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {search ? 'No se encontraron sistemas.' : 'Todos los sistemas están en línea.'}
                  </Text>
                </View>
              ) : (
                filteredTargets.map((target) => (
                  <TouchableOpacity
                    key={target.id}
                    style={styles.targetCard}
                    activeOpacity={0.7}
                    onPress={() => onNavigateToDetails?.(target.id)}
                  >
                    <View style={styles.targetHeader}>
                      <Text style={styles.targetName} numberOfLines={1}>{target.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(target.current_status) + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(target.current_status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(target.current_status) }]}>
                          {getStatusText(target.current_status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.targetUrl} numberOfLines={1}>{target.url}</Text>

                    <View style={styles.targetFooter}>
                      <View style={styles.targetMeta}>
                        <Text style={styles.targetMetaLabel}>Tipo</Text>
                        <Text style={styles.targetMetaValue}>{target.target_type}</Text>
                      </View>
                      <View style={styles.targetMeta}>
                        <Text style={styles.targetMetaLabel}>Tiempo</Text>
                        <Text style={styles.targetMetaValue}>
                          {target.avg_response_time ? `${target.avg_response_time}ms` : 'N/A'}
                        </Text>
                      </View>
                      {target.last_checked_at && (
                        <View style={styles.targetMeta}>
                          <Text style={styles.targetMetaLabel}>Última check</Text>
                          <Text style={styles.targetMetaValue}>
                            {new Date(target.last_checked_at).toLocaleTimeString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal de Logout - Primera confirmación */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <LogOutIcon size={32} color={colors.statusDanger} />
            </View>
            <Text style={styles.logoutModalTitle}>Cerrar Sesión</Text>
            <Text style={styles.logoutModalMessage}>
              ¿Estás seguro de que deseas cerrar sesión?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmButton}
                onPress={() => {
                  setShowLogoutModal(false);
                  setShowLogoutConfirmModal(true);
                }}
              >
                <Text style={styles.logoutConfirmButtonText}>Sí, continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Logout - Segunda confirmación */}
      <Modal
        visible={showLogoutConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirmModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={[styles.logoutIconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
              <LogOutIcon size={32} color={colors.statusDanger} />
            </View>
            <Text style={styles.logoutModalTitle}>Confirmar</Text>
            <Text style={styles.logoutModalMessage}>
              Se cerrará tu sesión y tendrás que volver a iniciar sesión.
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setShowLogoutConfirmModal(false)}
              >
                <Text style={styles.logoutCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutConfirmButton, { backgroundColor: colors.statusDanger }]}
                onPress={() => {
                  setShowLogoutConfirmModal(false);
                  logout();
                }}
              >
                <Text style={styles.logoutConfirmButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  addButton: {
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  logoutButton: {
    padding: 12,
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  // Loading/Error/Empty
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: colors.statusDanger,
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMain,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 16,
    color: colors.textMain,
  },
  // Filters
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMain,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Targets
  targetsContainer: {
    gap: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  targetCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetUrl: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  targetFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 12,
    gap: 16,
  },
  targetMeta: {
    flex: 1,
  },
  targetMetaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  targetMetaValue: {
    fontSize: 13,
    color: colors.textMain,
    fontWeight: '500',
  },
  // Estilos para modal de logout
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  logoutCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.statusWarning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default DashboardScreen;
