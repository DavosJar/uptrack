import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Svg, Path, Rect, Circle, Polyline, Polygon } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fetchWithAuth } from '../api/fetch';
import Layout from '../components/Layout';

// Íconos
const ArrowLeftIcon = ({ size = 20, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SettingsIcon = ({ size = 20, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const TrashIcon = ({ size = 20, color = colors.statusDanger }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const PlayIcon = ({ size = 20, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2}>
    <Polygon points="5,3 19,12 5,21" fill={color} />
  </Svg>
);

const PauseIcon = ({ size = 20, color = colors.statusWarning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="6" y="4" width="4" height="16" />
    <Rect x="14" y="4" width="4" height="16" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 20, color = colors.statusWarning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Path d="M12 9v4M12 17h.01" />
  </Svg>
);

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
  is_active: boolean;
  current_status: string;
  last_checked_at: string | null;
  avg_response_time: number;
}

interface SystemsScreenProps {
  onBack: () => void;
  onNavigateToDetails?: (targetId: string) => void;
}

const SystemsScreen: React.FC<SystemsScreenProps> = ({ onBack, onNavigateToDetails }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [targetToToggle, setTargetToToggle] = useState<Target | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/targets');
      if (response.ok) {
        const data = await response.json();
        const targetsData = data.data || [];
        console.log('SystemsScreen - Targets loaded:', JSON.stringify(targetsData.map((t: Target) => ({ name: t.name, is_active: t.is_active }))));
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

  const handleToggleActive = (target: Target) => {
    setTargetToToggle(target);
    setShowToggleModal(true);
  };

  const confirmToggle = async () => {
    if (!targetToToggle) return;

    setIsToggling(true);
    const newActiveState = !targetToToggle.is_active;

    try {
      const response = await fetchWithAuth(`/api/v1/targets/${targetToToggle.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActiveState }),
      });

      if (response.ok) {
        setTargets(prev =>
          prev.map(t => (t.id === targetToToggle.id ? { ...t, is_active: newActiveState } : t))
        );
        setShowToggleModal(false);
        setTargetToToggle(null);
      } else {
        Alert.alert('Error', 'No se pudo cambiar el estado del sistema');
        setShowToggleModal(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Error de conexión');
      setShowToggleModal(false);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = (target: Target) => {
    setTargetToDelete(target);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!targetToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetchWithAuth(`/api/v1/targets/${targetToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTargets(prev => prev.filter(t => t.id !== targetToDelete.id));
        setShowDeleteModal(false);
        setTargetToDelete(null);
      } else {
        Alert.alert('Error', 'No se pudo eliminar el sistema');
        setShowDeleteModal(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Error de conexión');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeftIcon size={20} color={colors.textMain} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Gestión de Sistemas</Text>
            <Text style={styles.subtitle}>Administra tus sistemas monitoreados.</Text>
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
            <Text style={styles.emptyText}>No hay sistemas configurados.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {targets.map((target) => (
              <TouchableOpacity
                key={target.id}
                style={styles.targetCard}
                activeOpacity={0.8}
                onPress={() => onNavigateToDetails?.(target.id)}
              >
                {/* Header del sistema */}
                <View style={styles.targetHeader}>
                  <View style={styles.targetInfo}>
                    <Text style={styles.targetName} numberOfLines={1}>{target.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(target.current_status) + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(target.current_status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(target.current_status) }]}>
                        {getStatusText(target.current_status)}
                      </Text>
                    </View>
                  </View>
                  {/* Badge activo/inactivo */}
                  <View style={[styles.activeBadge, { backgroundColor: target.is_active ? colors.statusSuccess + '20' : colors.textMuted + '20' }]}>
                    <Text style={[styles.activeBadgeText, { color: target.is_active ? colors.statusSuccess : colors.textMuted }]}>
                      {target.is_active ? 'Activo' : 'Pausado'}
                    </Text>
                  </View>
                </View>

                {/* Detalles */}
                <View style={styles.targetDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{target.target_type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>URL:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{target.url}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tiempo promedio:</Text>
                    <Text style={styles.detailValue}>
                      {target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}
                    </Text>
                  </View>
                  {target.last_checked_at && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Última verificación:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(target.last_checked_at).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Acciones */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleActive(target)}
                  >
                    {target.is_active ? (
                      <>
                        <PauseIcon size={16} color={colors.statusWarning} />
                        <Text style={[styles.actionButtonText, { color: colors.statusWarning }]}>Pausar</Text>
                      </>
                    ) : (
                      <>
                        <PlayIcon size={16} color={colors.statusSuccess} />
                        <Text style={[styles.actionButtonText, { color: colors.statusSuccess }]}>Activar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(target)}
                  >
                    <TrashIcon size={16} color={colors.statusDanger} />
                    <Text style={[styles.actionButtonText, { color: colors.statusDanger }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Confirmar Toggle */}
      <Modal
        visible={showToggleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToggleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: colors.statusWarning + '20' }]}>
              <AlertTriangleIcon size={32} color={colors.statusWarning} />
            </View>
            <Text style={styles.modalTitle}>
              {targetToToggle?.is_active ? 'Pausar Sistema' : 'Activar Sistema'}
            </Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas {targetToToggle?.is_active ? 'pausar' : 'activar'} el monitoreo de "{targetToToggle?.name}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowToggleModal(false)}
                disabled={isToggling}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: targetToToggle?.is_active ? colors.statusWarning : colors.statusSuccess }]}
                onPress={confirmToggle}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>
                    {targetToToggle?.is_active ? 'Pausar' : 'Activar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: colors.statusDanger + '20' }]}>
              <TrashIcon size={32} color={colors.statusDanger} />
            </View>
            <Text style={styles.modalTitle}>Eliminar Sistema</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas eliminar "{targetToDelete?.name}"? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.statusDanger }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Eliminar</Text>
                )}
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
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
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
    color: colors.textMuted,
    fontSize: 16,
  },
  // Lista
  listContainer: {
    gap: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  targetInfo: {
    flex: 1,
    marginRight: 12,
  },
  targetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
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
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetDetails: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
    width: 120,
  },
  detailValue: {
    fontSize: 13,
    color: colors.textMain,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleButton: {
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundInput,
  },
  deleteButton: {
    borderColor: colors.statusDanger + '40',
    backgroundColor: colors.statusDanger + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundCard,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  modalConfirmButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SystemsScreen;
