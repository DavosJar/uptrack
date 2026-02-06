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
  Modal,
  TextInput,
} from 'react-native';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fetchWithAuth } from '../api/fetch';
import SimpleLineChart, { UptimeBarChart } from '../components/SimpleChart';

// Íconos SVG
const ArrowLeftIcon = ({ size = 24, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const MonitorIcon = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Path d="M8 21h8M12 17v4" />
  </Svg>
);

const GlobeIcon = ({ size = 24, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

const ClockIcon = ({ size = 24, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const ActivityIcon = ({ size = 24, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Svg>
);

const CheckCircleIcon = ({ size = 24, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

const XCircleIcon = ({ size = 24, color = colors.statusDanger }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M15 9l-6 6M9 9l6 6" />
  </Svg>
);

const AlertCircleIcon = ({ size = 24, color = colors.statusWarning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const PlayIcon = ({ size = 24, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="10 8 16 12 10 16 10 8" />
  </Svg>
);

const PauseIcon = ({ size = 24, color = colors.statusWarning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="10" y1="15" x2="10" y2="9" />
    <Line x1="14" y1="15" x2="14" y2="9" />
  </Svg>
);

const TrashIcon = ({ size = 24, color = colors.statusDanger }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

const SettingsIcon = ({ size = 24, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const XIcon = ({ size = 24, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const SaveIcon = ({ size = 24, color = colors.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Polyline points="17 21 17 13 7 13 7 21" />
    <Polyline points="7 3 7 8 15 8" />
  </Svg>
);

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
  current_status: string;
  is_active: boolean;
  last_checked_at: string | null;
  avg_response_time: number;
  created_at: string;
  updated_at: string;
  configuration?: {
    timeout_seconds: number;
    retry_count: number;
    retry_delay_seconds: number;
    check_interval_seconds: number;
    alert_on_failure: boolean;
    alert_on_recovery: boolean;
  };
}

interface TargetDetailsScreenProps {
  targetId: string;
  onBack: () => void;
}

interface MetricData {
  timestamp: string;
  response_time_ms: number;
}

interface HistoryData {
  timestamp: string;
  status: string;
  response_time_ms: number;
}

const TargetDetailsScreen: React.FC<TargetDetailsScreenProps> = ({ targetId, onBack }) => {
  const [target, setTarget] = useState<Target | null>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estado para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modal de configuración
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTimeout, setConfigTimeout] = useState(30);
  const [configRetryCount, setConfigRetryCount] = useState(3);
  const [configRetryDelay, setConfigRetryDelay] = useState(5);
  const [configCheckInterval, setConfigCheckInterval] = useState(300);
  const [configAlertOnFailure, setConfigAlertOnFailure] = useState(true);
  const [configAlertOnRecovery, setConfigAlertOnRecovery] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTarget = useCallback(async () => {
    try {
      // Fetch target details
      const response = await fetchWithAuth(`/api/v1/targets/${targetId}`);
      if (response.ok) {
        const data = await response.json();
        const targetData = data.data || data;
        console.log('Target loaded - is_active:', targetData.is_active, 'full data:', JSON.stringify(targetData));
        setTarget(targetData);
        setError('');
      } else {
        setError('Error al cargar los detalles del sistema');
      }

      // Fetch metrics (response times)
      try {
        const metricsResponse = await fetchWithAuth(`/api/v1/targets/${targetId}/metrics?limit=50`);
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData.data || []);
        }
      } catch {
        // Silently fail - metrics are optional
      }

      // Fetch history (status changes)
      try {
        const historyResponse = await fetchWithAuth(`/api/v1/targets/${targetId}/history?limit=48`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.data || []);
        }
      } catch {
        // Silently fail - history is optional
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTarget();
  };

  // Preparar datos para gráficas
  const chartData = metrics.slice().reverse().map((m) => ({
    timestamp: m.timestamp,
    value: m.response_time_ms,
  }));

  const uptimeData = history.slice().reverse().map((h) => ({
    timestamp: h.timestamp,
    status: h.status.toUpperCase() as 'UP' | 'DOWN' | 'PENDING',
  }));

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP':
      case 'ONLINE':
        return colors.statusSuccess;
      case 'DOWN':
      case 'OFFLINE':
        return colors.statusDanger;
      case 'PENDING':
        return colors.statusWarning;
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP':
      case 'ONLINE':
        return 'Online';
      case 'DOWN':
      case 'OFFLINE':
        return 'Offline';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status || 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP':
      case 'ONLINE':
        return <CheckCircleIcon size={24} color={colors.statusSuccess} />;
      case 'DOWN':
      case 'OFFLINE':
        return <XCircleIcon size={24} color={colors.statusDanger} />;
      case 'PENDING':
        return <AlertCircleIcon size={24} color={colors.statusWarning} />;
      default:
        return <AlertCircleIcon size={24} color={colors.textMuted} />;
    }
  };

  const handleToggleActive = async () => {
    if (!target || actionLoading) return;
    
    const newState = !target.is_active;
    const wasActive = target.is_active;
    
    console.log('handleToggleActive - targetId:', targetId, 'currentIsActive:', wasActive, 'newState:', newState);
    
    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/v1/targets/${targetId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newState }),
      });
      
      console.log('Toggle response status:', response.status);
      
      if (response.ok) {
        // Actualizar estado local inmediatamente
        setTarget(prev => prev ? { ...prev, is_active: newState } : null);
        setSuccessMessage(`Sistema ${wasActive ? 'pausado' : 'activado'} correctamente`);
        setShowSuccessModal(true);
        
        // Esperar un momento y refrescar para confirmar persistencia
        setTimeout(() => {
          fetchTarget();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error('Toggle error:', errorText);
        Alert.alert('Error', `No se pudo ${wasActive ? 'pausar' : 'activar'} el sistema`);
      }
    } catch (err) {
      console.error('Toggle exception:', err);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  const [pendingDelete, setPendingDelete] = useState(false);
  
  // Efecto para ejecutar el delete
  useEffect(() => {
    if (pendingDelete) {
      setPendingDelete(false);
      performDelete();
    }
  }, [pendingDelete]);

  const handleDelete = () => {
    if (!target) return;
    
    Alert.alert(
      'Eliminar Sistema',
      `¿Estás seguro de que deseas eliminar "${target.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPendingDelete(true);
          },
        },
      ]
    );
  };

  const performDelete = async () => {
    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/v1/targets/${targetId}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        setSuccessMessage('Sistema eliminado correctamente');
        setShowSuccessModal(true);
        // Esperar a que el usuario cierre el modal y luego volver
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('Delete error:', errorText);
        Alert.alert('Error', 'No se pudo eliminar el sistema');
      }
    } catch (err) {
      console.error('Delete exception:', err);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenConfig = () => {
    if (!target) return;
    const config = target.configuration;
    if (config) {
      setConfigTimeout(config.timeout_seconds ?? 30);
      setConfigRetryCount(config.retry_count ?? 3);
      setConfigRetryDelay(config.retry_delay_seconds ?? 5);
      setConfigCheckInterval(config.check_interval_seconds ?? 300);
      setConfigAlertOnFailure(config.alert_on_failure ?? true);
      setConfigAlertOnRecovery(config.alert_on_recovery ?? true);
    } else {
      // Valores por defecto
      setConfigTimeout(30);
      setConfigRetryCount(3);
      setConfigRetryDelay(5);
      setConfigCheckInterval(300);
      setConfigAlertOnFailure(true);
      setConfigAlertOnRecovery(true);
    }
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Asegurar valores válidos antes de enviar
      const payload = {
        timeout_seconds: configTimeout || 30,
        retry_count: configRetryCount ?? 3,
        retry_delay_seconds: configRetryDelay || 5,
        check_interval_seconds: configCheckInterval || 300,
        alert_on_failure: configAlertOnFailure,
        alert_on_recovery: configAlertOnRecovery,
      };
      
      console.log('Sending configuration:', payload);
      
      const response = await fetchWithAuth(`/api/v1/targets/${targetId}/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowConfigModal(false);
        fetchTarget(); // Recargar datos
        setSuccessMessage('Configuración actualizada correctamente');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Config update error:', errorData);
        Alert.alert('Error', errorData.message || 'No se pudo actualizar la configuración');
      }
    } catch (err) {
      console.error('Config update exception:', err);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} seg`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} hora(s)`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeftIcon size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles del Sistema</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (error || !target) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeftIcon size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles del Sistema</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Sistema no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTarget}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeftIcon size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Sistema</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconContainer}>
              <MonitorIcon size={32} color={colors.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{target.name}</Text>
              <Text style={styles.heroType}>{target.target_type}</Text>
            </View>
          </View>
          
          <View style={[styles.statusCard, { backgroundColor: getStatusColor(target.current_status) + '15' }]}>
            {getStatusIcon(target.current_status)}
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: getStatusColor(target.current_status) }]}>
                Estado Actual
              </Text>
              <Text style={[styles.statusValue, { color: getStatusColor(target.current_status) }]}>
                {getStatusText(target.current_status)}
              </Text>
            </View>
            {!target.is_active && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedBadgeText}>PAUSADO</Text>
              </View>
            )}
          </View>
        </View>

        {/* URL Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <GlobeIcon size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>URL</Text>
          </View>
          <Text style={styles.infoValue} selectable>{target.url}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ActivityIcon size={24} color={colors.statusSuccess} />
            <Text style={styles.statLabel}>Tiempo de Respuesta</Text>
            <Text style={styles.statValue}>
              {target.avg_response_time ? `${target.avg_response_time}ms` : 'N/A'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <ClockIcon size={24} color={colors.primary} />
            <Text style={styles.statLabel}>Última Verificación</Text>
            <Text style={styles.statValue}>
              {target.last_checked_at 
                ? new Date(target.last_checked_at).toLocaleTimeString('es-ES')
                : 'Nunca'}
            </Text>
          </View>
        </View>

        {/* Response Time Chart */}
        <View style={styles.chartContainer}>
          <SimpleLineChart
            data={chartData}
            title="Tiempo de Respuesta"
            unit="ms"
            color={colors.primary}
            height={220}
          />
        </View>

        {/* Uptime Bar Chart */}
        <View style={styles.chartContainer}>
          <UptimeBarChart
            data={uptimeData}
            title="Disponibilidad (últimas verificaciones)"
            height={130}
          />
        </View>

        {/* Timeline Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <ClockIcon size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>Información</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Creado</Text>
            <Text style={styles.timelineValue}>{formatDate(target.created_at)}</Text>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Última actualización</Text>
            <Text style={styles.timelineValue}>{formatDate(target.updated_at)}</Text>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Última verificación</Text>
            <Text style={styles.timelineValue}>{formatDate(target.last_checked_at)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Configurar Sistema */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleOpenConfig}
            disabled={actionLoading}
          >
            <SettingsIcon size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Configurar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              target.is_active ? styles.actionButtonWarning : styles.actionButtonSuccess,
            ]}
            onPress={handleToggleActive}
            disabled={actionLoading}
          >
            {target.is_active ? (
              <PauseIcon size={20} color={colors.white} />
            ) : (
              <PlayIcon size={20} color={colors.white} />
            )}
            <Text style={styles.actionButtonText}>
              {target.is_active ? 'Pausar Monitoreo' : 'Activar Monitoreo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
            disabled={actionLoading}
          >
            <TrashIcon size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>Eliminar Sistema</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <CheckCircleIcon size={32} color={colors.statusSuccess} />
            </View>
            <Text style={styles.successModalTitle}>¡Éxito!</Text>
            <Text style={styles.successModalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuración */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Monitoreo</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowConfigModal(false)}
              >
                <XIcon size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.configScrollView} showsVerticalScrollIndicator={false}>
              {/* Intervalo de verificación */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Intervalo de verificación</Text>
                <Text style={styles.formHint}>Cada cuánto tiempo se verifica el sistema</Text>
                <View style={styles.intervalButtonsRow}>
                  {[60, 300, 600, 1800, 3600].map((seconds) => (
                    <TouchableOpacity
                      key={seconds}
                      style={[
                        styles.intervalButton,
                        configCheckInterval === seconds && styles.intervalButtonActive,
                      ]}
                      onPress={() => setConfigCheckInterval(seconds)}
                    >
                      <Text
                        style={[
                          styles.intervalButtonText,
                          configCheckInterval === seconds && styles.intervalButtonTextActive,
                        ]}
                      >
                        {formatInterval(seconds)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Timeout */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Timeout (segundos)</Text>
                <Text style={styles.formHint}>Tiempo máximo de espera por respuesta: {configTimeout}s</Text>
                <View style={styles.sliderRow}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigTimeout(Math.max(1, configTimeout - 5))}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderValueContainer}>
                    <Text style={styles.sliderValue}>{configTimeout}s</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigTimeout(Math.min(60, configTimeout + 5))}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reintentos */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reintentos antes de marcar como caído</Text>
                <Text style={styles.formHint}>Número de intentos: {configRetryCount}</Text>
                <View style={styles.sliderRow}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigRetryCount(Math.max(0, configRetryCount - 1))}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderValueContainer}>
                    <Text style={styles.sliderValue}>{configRetryCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigRetryCount(Math.min(10, configRetryCount + 1))}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delay entre reintentos */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Delay entre reintentos</Text>
                <Text style={styles.formHint}>Segundos entre cada reintento: {configRetryDelay}s</Text>
                <View style={styles.sliderRow}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigRetryDelay(Math.max(1, configRetryDelay - 1))}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderValueContainer}>
                    <Text style={styles.sliderValue}>{configRetryDelay}s</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setConfigRetryDelay(Math.min(60, configRetryDelay + 1))}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alertas */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notificaciones</Text>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setConfigAlertOnFailure(!configAlertOnFailure)}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Alertar cuando falle</Text>
                    <Text style={styles.toggleHint}>Recibir notificación al detectar caída</Text>
                  </View>
                  <View style={[styles.toggle, configAlertOnFailure && styles.toggleActive]}>
                    <View style={[styles.toggleDot, configAlertOnFailure && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setConfigAlertOnRecovery(!configAlertOnRecovery)}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Alertar al recuperarse</Text>
                    <Text style={styles.toggleHint}>Recibir notificación al volver online</Text>
                  </View>
                  <View style={[styles.toggle, configAlertOnRecovery && styles.toggleActive]}>
                    <View style={[styles.toggleDot, configAlertOnRecovery && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfigModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <SaveIcon size={18} color={colors.white} />
                    <Text style={styles.modalSaveButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {actionLoading && (
        <View style={styles.actionLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.statusDanger,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  // Hero Card
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  heroType: {
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pausedBadge: {
    backgroundColor: colors.statusWarning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pausedBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Info Card
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
    marginTop: 4,
  },
  // Charts
  chartContainer: {
    marginBottom: 16,
  },
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  timelineValue: {
    fontSize: 14,
    color: colors.textMain,
    fontWeight: '500',
  },
  timelineDivider: {
    height: 1,
    backgroundColor: colors.borderDark,
  },
  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonSuccess: {
    backgroundColor: colors.statusSuccess,
  },
  actionButtonWarning: {
    backgroundColor: colors.statusWarning,
  },
  actionButtonDanger: {
    backgroundColor: colors.statusDanger,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  actionLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal de Edición
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  modalCloseButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textMain,
  },
  configScrollView: {
    maxHeight: 400,
  },
  formHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    opacity: 0.8,
  },
  intervalButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  intervalButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  intervalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  intervalButtonTextActive: {
    color: colors.primary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textMain,
  },
  sliderValueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMain,
  },
  toggleHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textMuted,
  },
  toggleDotActive: {
    backgroundColor: colors.white,
    alignSelf: 'flex-end',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  successModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default TargetDetailsScreen;
