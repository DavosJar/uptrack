
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface SystemStatusWidgetProps {
  systemName: string;
  status: 'UP' | 'DOWN' | 'PENDING' | 'UNKNOWN';
  lastChecked: string;
  responseTime: number | null;
}

export function SystemStatusWidget({
  systemName = 'Sistema',
  status = 'UNKNOWN',
  lastChecked = '--:--',
  responseTime = null,
}: SystemStatusWidgetProps) {
  // Colores seguros
  const getStatusColor = () => {
    switch (status) {
      case 'UP': return '#22C55E';
      case 'DOWN': return '#EF4444';
      case 'PENDING': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'UP': return 'En línea';
      case 'DOWN': return 'Caído';
      case 'PENDING': return '...';
      default: return '?';
    }
  };

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 12, // Usa padding general, no Horizontal/Vertical
        justifyContent: 'space-between'
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget
          text="UpTrack"
          style={{
            fontSize: 12,
            color: '#94A3B8',
            fontWeight: 'bold', // SOLO usa 'bold', 'normal' o 'italic'
          }}
        />
      </FlexWidget>

      {/* Main Content */}
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text={systemName}
          style={{
            fontSize: 16,
            color: '#F8FAFC',
            fontWeight: 'bold',
            marginBottom: 4
          }}
        />
        
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget 
            style={{ 
              height: 10, 
              width: 10, 
              borderRadius: 5, 
              backgroundColor: getStatusColor(),
              marginRight: 6
            }} 
          />
          <TextWidget
            text={getStatusText()}
            style={{
              fontSize: 14,
              color: '#FFFFFF',
              fontWeight: 'normal', // NUNCA uses '500' o '600'
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Footer */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8
        }}
      >
        <TextWidget
          text={`Check: ${lastChecked}`}
          style={{ fontSize: 11, color: '#64748B' }}
        />
        {responseTime !== null && (
          <TextWidget
            text={`${responseTime}ms`}
            style={{ fontSize: 11, color: '#64748B' }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
