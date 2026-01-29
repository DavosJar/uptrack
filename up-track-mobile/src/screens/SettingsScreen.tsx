import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/fetch';
import { colors } from '../theme/colors';

// Íconos SVG
const UserIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const BellIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const ShieldIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const InfoIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </Svg>
);

const LogOutIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const ChevronRightIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const XIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const SaveIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8" />
    <Path d="M7 3v5h8" />
  </Svg>
);

const MonitorIcon = ({ size = 24, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Line x1="8" y1="21" x2="16" y2="21" />
    <Line x1="12" y1="17" x2="12" y2="21" />
  </Svg>
);

// Interfaces
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  timezone: string;
  language: string;
  role: string;
  created_at: string;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
      {icon}
    </View>
    <View style={styles.itemContent}>
      <Text style={[styles.itemTitle, danger && styles.itemTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <ChevronRightIcon size={20} color={colors.textMuted} />}
  </TouchableOpacity>
);

interface SettingsScreenProps {
  onNavigateToNotifications?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigateToNotifications }) => {
  const { logout } = useAuth();

  // Estado para logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Estados para el perfil
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos del formulario de perfil
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');

  // Cargar perfil
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/v1/users/me');
      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        setProfile(userData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Abrir modal de edición
  const handleOpenProfileModal = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTimezone(profile.timezone || 'America/Mexico_City');
      setLanguage(profile.language || 'es');
    }
    setShowProfileModal(true);
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetchWithAuth('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: profile?.avatar_url || '',
          timezone: timezone,
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        setProfile(userData);
        setShowProfileModal(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    console.log('handleLogout called - showing modal');
    setShowLogoutModal(true);
  };

  const handleFirstLogoutConfirm = () => {
    setShowLogoutModal(false);
    setShowLogoutConfirmModal(true);
  };

  const handleFinalLogout = () => {
    setShowLogoutConfirmModal(false);
    console.log('Executing logout');
    logout();
  };

  const handleNotifications = () => {
    if (onNavigateToNotifications) {
      onNavigateToNotifications();
    }
  };

  const handleSecurity = () => {
    Alert.alert('Seguridad', 'Configuración de seguridad próximamente.');
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de UpTrack',
      'UpTrack Mobile v1.0.0\n\nSistema de monitoreo de servicios web.\n\n© 2026 UpTrack',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MonitorIcon size={28} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configuración de la aplicación</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUENTA</Text>
          <View style={styles.sectionContent}>
            {loadingProfile ? (
              <View style={styles.loadingItem}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
              </View>
            ) : (
              <SettingsItem
                icon={<UserIcon size={20} color={colors.primary} />}
                title={profile?.full_name || 'Sin nombre'}
                subtitle={profile?.email || 'Editar información personal'}
                onPress={handleOpenProfileModal}
              />
            )}
          </View>
        </View>

        {/* Preferencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon={<BellIcon size={20} color={colors.statusWarning} />}
              title="Notificaciones"
              subtitle="Alertas y recordatorios"
              onPress={handleNotifications}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon={<ShieldIcon size={20} color={colors.statusSuccess} />}
              title="Seguridad"
              subtitle="Contraseña y autenticación"
              onPress={handleSecurity}
            />
          </View>
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon={<InfoIcon size={20} color={colors.textMuted} />}
              title="Acerca de UpTrack"
              subtitle="Versión 1.0.0"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Cerrar Sesión */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon={<LogOutIcon size={20} color={colors.statusDanger} />}
              title="Cerrar Sesión"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>UpTrack Mobile</Text>
          <Text style={styles.footerVersion}>Versión 1.0.0</Text>
        </View>
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
                onPress={handleFirstLogoutConfirm}
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
                onPress={handleFinalLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edición de Perfil */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProfileModal(false)}
              >
                <XIcon size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Info del email (no editable) */}
            <View style={styles.emailInfo}>
              <Text style={styles.emailLabel}>Correo electrónico</Text>
              <Text style={styles.emailValue}>{profile?.email}</Text>
            </View>

            {/* Campos editables */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre completo</Text>
              <TextInput
                style={styles.formInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tu nombre completo"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Zona horaria</Text>
              <View style={styles.pickerContainer}>
                {['America/Mexico_City', 'America/New_York', 'America/Los_Angeles', 'Europe/Madrid', 'UTC'].map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    style={[styles.pickerItem, timezone === tz && styles.pickerItemActive]}
                    onPress={() => setTimezone(tz)}
                  >
                    <Text style={[styles.pickerItemText, timezone === tz && styles.pickerItemTextActive]}>
                      {tz.split('/')[1]?.replace('_', ' ') || tz}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Idioma</Text>
              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[styles.languageButton, language === 'es' && styles.languageButtonActive]}
                  onPress={() => setLanguage('es')}
                >
                  <Text style={[styles.languageButtonText, language === 'es' && styles.languageButtonTextActive]}>
                    Español
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowProfileModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSaveProfile}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMain,
  },
  itemTitleDanger: {
    color: colors.statusDanger,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderDark,
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  footerVersion: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    opacity: 0.7,
  },
  // Loading item
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  // Modal styles
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
  emailInfo: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 16,
    color: colors.textMain,
    fontWeight: '500',
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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  pickerItemActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  pickerItemText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pickerItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  languageButtonTextActive: {
    color: colors.primary,
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

export default SettingsScreen;
