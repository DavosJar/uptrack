import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  
  // Solo agregar timestamp para peticiones GET (evitar caché)
  const method = options.method?.toUpperCase() || 'GET';
  let finalUrl = url;
  
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(`${API_BASE_URL}${finalUrl}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem('token');
    throw new Error('Unauthorized');
  }

  return response;
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  return data;
}

export async function apiRegister(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrarse');
  }

  return data;
}
