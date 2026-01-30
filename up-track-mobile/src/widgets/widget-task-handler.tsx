import React from 'react';
import { registerWidgetTaskHandler, WidgetTaskHandlerProps } from 'react-native-android-widget';
import { SystemStatusWidget } from './SystemStatusWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../api/config';

const WIDGET_SYSTEM_KEY = 'widget_selected_system';

interface StoredSystem {
  id: string;
  name: string;
}

async function fetchSystemStatus(systemId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/targets/${systemId}?_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    return null;
  } catch (error) {
    console.error('Widget: Error fetching system status:', error);
    return null;
  }
}

async function getWidgetData() {
  try {
    const token = await AsyncStorage.getItem('token');
    const storedSystem = await AsyncStorage.getItem(WIDGET_SYSTEM_KEY);
    
    if (!token || !storedSystem) {
      return {
        systemName: 'No configurado',
        status: 'UNKNOWN' as const,
        lastChecked: '--:--',
        responseTime: null,
      };
    }
    
    const system: StoredSystem = JSON.parse(storedSystem);
    const systemData = await fetchSystemStatus(system.id, token);
    
    if (!systemData) {
      return {
        systemName: system.name,
        status: 'UNKNOWN' as const,
        lastChecked: 'Error',
        responseTime: null,
      };
    }
    
    const lastChecked = systemData.last_checked_at 
      ? new Date(systemData.last_checked_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    
    return {
      systemName: systemData.name,
      status: (systemData.current_status?.toUpperCase() || 'UNKNOWN') as 'UP' | 'DOWN' | 'PENDING' | 'UNKNOWN',
      lastChecked,
      responseTime: systemData.avg_response_time || null,
    };
  } catch (error) {
    console.error('Widget: Error getting widget data:', error);
    return {
      systemName: 'Error',
      status: 'UNKNOWN' as const,
      lastChecked: '--:--',
      responseTime: null,
    };
  }
}

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget = props.renderWidget;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      const data = await getWidgetData();
      Widget(
        <SystemStatusWidget
          systemName={data.systemName}
          status={data.status}
          lastChecked={data.lastChecked}
          responseTime={data.responseTime}
        />
      );
      break;

    case 'WIDGET_DELETED':
      // Widget removed, cleanup if needed
      break;

    case 'WIDGET_CLICK':
      // Handle click - will open the app by default with clickAction="OPEN_APP"
      break;

    default:
      break;
  }
}

// Register the widget task handler (only for Android)
if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}

export { WIDGET_SYSTEM_KEY };
