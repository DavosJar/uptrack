import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fetchWithAuth } from '../api/fetch';
import Layout from '../components/Layout';

// Íconos
const MonitorIcon = ({ size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Path d="M8 21h8M12 17v4" />
  </Svg>
);

const SettingsIcon = ({ size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const ArrowLeftIcon = ({ size = 20, color = colors.textMain }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const CheckIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const XIcon = ({ size = 20, color = colors.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

interface AddTargetScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const AddTargetScreen: React.FC<AddTargetScreenProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'WEB',
    url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    // Validación
    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    // Validar URL
    try {
      new URL(formData.url);
    } catch {
      setError('La URL no es válida');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth('/api/v1/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          url: formData.url,
        }),
      });

      if (response.ok) {
        setModalType('success');
        setModalMessage('Sistema agregado correctamente');
        setShowModal(true);
      } else {
        const data = await response.json();
        setModalType('error');
        setModalMessage(data.message || 'Error al crear el sistema');
        setShowModal(true);
      }
    } catch (err) {
      setModalType('error');
      setModalMessage('Error de red');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === 'success') {
      onSuccess();
    }
  };

  const typeOptions = [
    { value: 'WEB', label: 'WEB' },
    { value: 'API', label: 'API' },
  ];

  return (
    <Layout>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Encabezado */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeftIcon size={20} color={colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.title}>Agregar Nuevo Sistema</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formCard}>
            {/* Sección: Información del Sistema */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MonitorIcon size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Información del Sistema</Text>
              </View>

              {/* Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Sistema</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ej. API de Producción"
                  placeholderTextColor={colors.textMuted}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  editable={!loading}
                />
                <Text style={styles.helpText}>Alias descriptivo para identificación.</Text>
              </View>

              {/* URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL a Monitorear</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://ejemplo.com"
                  placeholderTextColor={colors.textMuted}
                  value={formData.url}
                  onChangeText={(text) => setFormData({ ...formData, url: text })}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <Text style={styles.helpText}>URL completa del endpoint a verificar.</Text>
              </View>

              {/* Tipo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo</Text>
                <View style={styles.typeContainer}>
                  {typeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.typeOption,
                        formData.type === option.value && styles.typeOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, type: option.value })}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          formData.type === option.value && styles.typeOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.divider} />

            {/* Sección: Configuración */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <SettingsIcon size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Configuración de Monitoreo</Text>
              </View>

              <View style={styles.configNote}>
                <Text style={styles.configNoteText}>
                  Las opciones avanzadas de monitoreo (intervalo, red interna) se pueden configurar desde la versión web.
                </Text>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Botones */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onBack}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Agregar Sistema</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de resultado */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.modalIconContainer,
              { backgroundColor: modalType === 'success' ? colors.statusSuccess + '20' : colors.statusDanger + '20' }
            ]}>
              {modalType === 'success' ? (
                <CheckIcon size={32} color={colors.statusSuccess} />
              ) : (
                <XIcon size={32} color={colors.statusDanger} />
              )}
            </View>
            
            <Text style={styles.modalTitle}>
              {modalType === 'success' ? 'Éxito' : 'Error'}
            </Text>
            
            <Text style={[
              styles.modalMessage,
              { color: modalType === 'success' ? colors.statusSuccess : colors.statusDanger }
            ]}>
              {modalMessage}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: modalType === 'success' ? colors.statusSuccess : colors.primary }
              ]}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  formCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMain,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMain,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textMain,
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundCard,
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  typeOptionTextActive: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDark,
    marginVertical: 8,
  },
  configNote: {
    backgroundColor: colors.backgroundInput,
    borderRadius: 8,
    padding: 16,
  },
  configNoteText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  errorText: {
    color: colors.statusDanger,
    fontSize: 14,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundCard,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  submitButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    maxWidth: 320,
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
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddTargetScreen;
