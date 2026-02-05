// @ts-ignore
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useEffect } from 'react';

export async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('No se concedieron permisos para notificaciones push.');
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

// Hook para registrar automáticamente al iniciar la app
export function useRegisterPushNotifications(onToken?: (token: string) => void) {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token && onToken) onToken(token);
    });
  }, []);
}
