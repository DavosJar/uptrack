import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { fetchWithAuth } from '../api/fetch';
import { WIDGET_SYSTEM_KEY } from '../widgets/widget-task-handler';

// Solo importar en Android
let requestWidgetUpdate: ((widgetName: string) => void) | null = null;
if (Platform.OS === 'android') {
  try {
    const androidWidget = require('react-native-android-widget');
    requestWidgetUpdate = androidWidget.requestWidgetUpdate;
  } catch (e) {
    console.log('Widget module not available');
  }
}

// Icons
const ArrowLeftIcon = ({ size = 24, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const WidgetIcon = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </Svg>
);

const CheckCircleIcon = ({ size = 24, color = colors.statusSuccess }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

const MonitorIcon = ({ size = 24, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Path d="M8 21h8M12 17v4" />
  </Svg>
);

interface Target {
  id: string;
  name: string;
  url: string;
  current_status: string;
  is_active: boolean;
}

interface WidgetConfigScreenProps {
  onBack: () => void;
}

const WidgetConfigScreen: React.FC<WidgetConfigScreenProps> = ({ onBack }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/targets');
      if (response.ok) {
        const data = await response.json();
        setTargets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSelectedSystem = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_SYSTEM_KEY);
      if (stored) {
        const system = JSON.parse(stored);
        setSelectedSystem(system.id);
      }
    } catch (error) {
      console.error('Error loading selected system:', error);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
    loadSelectedSystem();
  }, [fetchTargets, loadSelectedSystem]);

  const handleSelectSystem = async (target: Target) => {
    setSaving(true);
    try {
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(
        WIDGET_SYSTEM_KEY,
        JSON.stringify({ id: target.id, name: target.name })
      );
      setSelectedSystem(target.id);

      // Actualizar widget si está en Android
      if (Platform.OS === 'android' && requestWidgetUpdate) {
        requestWidgetUpdate('SystemStatusWidget');
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving widget config:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP':
        return colors.statusSuccess;
      case 'DOWN':
        return colors.statusDanger;
      default:
        return colors.statusWarning;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeftIcon size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.title}>Configurar Widget</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.title}>Configurar Widget</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instrucciones */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <WidgetIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Widget de Sistema</Text>
          <Text style={styles.infoText}>
            Selecciona el sistema que deseas mostrar en el widget de la pantalla de inicio.
            El widget mostrará el estado actual, última verificación y tiempo de respuesta.
          </Text>
          {Platform.OS !== 'android' && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>
                ⚠️ Los widgets solo están disponibles en Android
              </Text>
            </View>
          )}
        </View>

        {/* Lista de sistemas */}
        <Text style={styles.sectionTitle}>SELECCIONAR SISTEMA</Text>
        <View style={styles.systemsList}>
          {targets.length === 0 ? (
            <View style={styles.emptyState}>
              <MonitorIcon size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay sistemas disponibles</Text>
              <Text style={styles.emptySubtext}>Agrega un sistema primero</Text>
            </View>
          ) : (
            targets.map((target) => (
              <TouchableOpacity
                key={target.id}
                style={[
                  styles.systemCard,
                  selectedSystem === target.id && styles.systemCardSelected,
                ]}
                onPress={() => handleSelectSystem(target)}
                disabled={saving}
              >
                <View style={styles.systemInfo}>
                  <View style={styles.systemHeader}>
                    <Text style={styles.systemName}>{target.name}</Text>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(target.current_status) },
                      ]}
                    />
                  </View>
                  <Text style={styles.systemUrl} numberOfLines={1}>
                    {target.url}
                  </Text>
                </View>
                {selectedSystem === target.id && (
                  <CheckCircleIcon size={24} color={colors.statusSuccess} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Instrucciones adicionales */}
        {Platform.OS === 'android' && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Cómo agregar el widget:</Text>
            <Text style={styles.instructionsText}>
              1. Mantén presionada la pantalla de inicio{'\n'}
              2. Selecciona "Widgets"{'\n'}
              3. Busca "UpTrack"{'\n'}
              4. Arrastra el widget a tu pantalla
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <CheckCircleIcon size={40} color={colors.statusSuccess} />
            </View>
            <Text style={styles.modalTitle}>¡Configurado!</Text>
            <Text style={styles.modalMessage}>
              El widget mostrará el estado de este sistema.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningBadge: {
    marginTop: 12,
    backgroundColor: colors.statusWarning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.statusWarning,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  systemsList: {
    marginBottom: 24,
  },
  systemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  systemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  systemInfo: {
    flex: 1,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMain,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemUrl: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMain,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  instructionsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default WidgetConfigScreen;
