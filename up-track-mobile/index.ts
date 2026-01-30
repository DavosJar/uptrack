import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Registrar el widget task handler para Android
if (Platform.OS === 'android') {
  require('./src/widgets/widget-task-handler');
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
