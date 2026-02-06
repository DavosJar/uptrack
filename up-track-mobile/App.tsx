
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useRegisterPushNotifications } from './src/notifications/registerPushNotifications';


export default function App() {
  useRegisterPushNotifications(token => {
    console.log('Expo Push Token:', token);
    // Aquí puedes enviar el token a tu backend si lo necesitas
  });
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
