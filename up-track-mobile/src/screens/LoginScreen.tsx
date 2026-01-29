import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Svg, Path, Rect, Circle, Polyline } from 'react-native-svg';
import { colors } from '../theme/colors';
import { apiLogin, apiRegister } from '../api/fetch';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const { width } = Dimensions.get('window');

// Check Circle Icon
const CheckCircleIcon = ({ size = 24, color = colors.statusSuccess }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

// Monitor Icon SVG Component
const MonitorIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <Path d="M8 21h8" />
    <Path d="M12 17v4" />
  </Svg>
);

// Eye Icon SVG Component
const EyeIcon = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </Svg>
);

// Eye Off Icon SVG Component
const EyeOffIcon = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Path d="M1 1l22 22" />
  </Svg>
);

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      if (isLoginMode) {
        const data = await apiLogin(email, password);
        // Mostrar modal de éxito y guardar token
        setPendingToken(data.data.token);
        setShowSuccessModal(true);
      } else {
        await apiRegister(email, password);
        setSuccess('Registro exitoso. Por favor inicia sesión.');
        setIsLoginMode(true);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = async () => {
    setShowSuccessModal(false);
    if (pendingToken) {
      await login(pendingToken);
      setPendingToken(null);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

  return (
    <Layout>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section - Similar to web aside */}
          <View style={styles.heroSection}>
            {/* Gradient overlay effect */}
            <View style={styles.gradientOverlay} />
            
            <View style={styles.heroContent}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <MonitorIcon size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.logoText}>UpTrack</Text>
              </View>
              
              {/* Tagline */}
              <Text style={styles.heroTitle}>
                Tu centro de control unificado.
              </Text>
              <Text style={styles.heroSubtitle}>
                Monitoreo inteligente y en tiempo real para todos tus sistemas web críticos.
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isLoginMode ? 'Bienvenido de nuevo' : 'Crear cuenta'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isLoginMode
                  ? 'Inicia sesión para acceder a tu dashboard.'
                  : 'Regístrate para comenzar a monitorear tus sistemas.'}
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="ejemplo@tuempresa.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={[styles.passwordContainer, loading && styles.inputDisabled]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} color={colors.textMuted} />
                  ) : (
                    <EyeIcon size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Success Message */}
            {success ? (
              <Text style={styles.successText}>{success}</Text>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLoginMode ? 'Iniciar Sesión' : 'Crear cuenta'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Mode Link */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                onPress={toggleMode}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isLoginMode
                    ? '¿No tienes cuenta? Crear cuenta'
                    : '¿Ya tienes cuenta? Iniciar sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <CheckCircleIcon size={40} color={colors.statusSuccess} />
            </View>
            <Text style={styles.successModalTitle}>¡Bienvenido!</Text>
            <Text style={styles.successModalMessage}>
              Has iniciado sesión correctamente.
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.successModalButtonText}>Continuar</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  // Hero Section Styles
  heroSection: {
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.05,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMain,
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: width > 380 ? 32 : 28,
    fontWeight: '900',
    color: colors.textMain,
    lineHeight: width > 380 ? 40 : 36,
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
  },
  // Form Section Styles
  formSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  formHeader: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
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
  inputDisabled: {
    opacity: 0.6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    height: 44,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textMain,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.statusDanger,
    fontSize: 14,
    marginBottom: 16,
  },
  successText: {
    color: colors.statusSuccess,
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Estilos para modal de éxito
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
    width: '85%',
    maxWidth: 320,
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successModalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default LoginScreen;
