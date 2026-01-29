import { Platform } from 'react-native';

// API Configuration
// Detecta automáticamente el entorno
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080'; // Android emulator localhost
  }
  // iOS simulator
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

