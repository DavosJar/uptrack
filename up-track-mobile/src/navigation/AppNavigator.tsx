import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddTargetScreen from '../screens/AddTargetScreen';
import SystemsScreen from '../screens/SystemsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TargetDetailsScreen from '../screens/TargetDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WidgetConfigScreen from '../screens/WidgetConfigScreen';
import BottomTabBar, { TabScreen } from '../components/BottomTabBar';
import { colors } from '../theme/colors';

type Screen = TabScreen | 'addTarget' | 'targetDetails' | 'notifications' | 'widgetConfig';

const AppNavigator: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('dashboard');

  // Navegar a detalles de un target
  const navigateToDetails = (targetId: string, fromScreen: Screen = currentScreen) => {
    setSelectedTargetId(targetId);
    setPreviousScreen(fromScreen);
    setCurrentScreen('targetDetails');
  };

  // Determinar el tab activo (para la barra inferior)
  const getCurrentTab = (): TabScreen => {
    if (currentScreen === 'addTarget' || currentScreen === 'targetDetails') {
      if (previousScreen === 'systems') return 'systems';
      return 'dashboard';
    }
    return currentScreen;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Renderizar la pantalla actual
  const renderScreen = () => {
    switch (currentScreen) {
      case 'addTarget':
        return (
          <AddTargetScreen
            onBack={() => setCurrentScreen('dashboard')}
            onSuccess={() => setCurrentScreen('dashboard')}
          />
        );
      case 'targetDetails':
        if (!selectedTargetId) {
          setCurrentScreen(previousScreen);
          return null;
        }
        return (
          <TargetDetailsScreen
            targetId={selectedTargetId}
            onBack={() => {
              setSelectedTargetId(null);
              setCurrentScreen(previousScreen);
            }}
          />
        );
      case 'systems':
        return (
          <SystemsScreen
            onBack={() => setCurrentScreen('dashboard')}
            onNavigateToDetails={(id) => navigateToDetails(id, 'systems')}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'widgetConfig':
        return (
          <WidgetConfigScreen
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onNavigateToNotifications={() => setCurrentScreen('notifications')}
            onNavigateToWidgetConfig={() => setCurrentScreen('widgetConfig')}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardScreen
            onNavigateToAddTarget={() => setCurrentScreen('addTarget')}
            onNavigateToDetails={(id) => navigateToDetails(id, 'dashboard')}
          />
        );
    }
  };

  // Ocultar barra inferior en AddTarget, TargetDetails, Notifications y WidgetConfig
  const showBottomBar = currentScreen !== 'addTarget' && currentScreen !== 'targetDetails' && currentScreen !== 'notifications' && currentScreen !== 'widgetConfig';

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      {showBottomBar && (
        <BottomTabBar currentTab={getCurrentTab()} onTabPress={setCurrentScreen} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
});

export default AppNavigator;
