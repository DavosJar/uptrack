import React from 'react';
import { FlexWidget, TextWidget, ColorProp } from 'react-native-android-widget';

interface SystemStatusWidgetProps {
  systemName: string;
  status: 'UP' | 'DOWN' | 'PENDING' | 'UNKNOWN';
  lastChecked: string;
  responseTime: number | null;
}

const getStatusColor = (status: string): ColorProp => {
  switch (status) {
    case 'UP':
      return '#22C55E'; // green
    case 'DOWN':
      return '#EF4444'; // red
    case 'PENDING':
      return '#F59E0B'; // yellow
    default:
      return '#6B7280'; // gray
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'UP':
      return '● En línea';
    case 'DOWN':
      return '● Fuera de línea';
    case 'PENDING':
      return '● Pendiente';
    default:
      return '● Desconocido';
  }
};

export function SystemStatusWidget({
  systemName = 'Sistema',
  status = 'UNKNOWN',
  lastChecked = '--:--',
  responseTime = null,
}: SystemStatusWidgetProps) {
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Logo y título */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="📊"
          style={{
            fontSize: 16,
            marginRight: 6,
          }}
        />
        <TextWidget
          text="UpTrack"
          style={{
            fontSize: 14,
            color: '#94A3B8',
            fontWeight: '500',
          }}
        />
      </FlexWidget>

      {/* Nombre del sistema */}
      <TextWidget
        text={systemName}
        style={{
          fontSize: 18,
          color: '#F8FAFC',
          fontWeight: 'bold',
          marginBottom: 8,
        }}
      />

      {/* Estado */}
      <TextWidget
        text={statusText}
        style={{
          fontSize: 16,
          color: statusColor,
          fontWeight: '600',
          marginBottom: 12,
        }}
      />

      {/* Info adicional */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingHorizontal: 8,
        }}
      >
        <FlexWidget style={{ alignItems: 'center' }}>
          <TextWidget
            text="Último check"
            style={{
              fontSize: 10,
              color: '#64748B',
            }}
          />
          <TextWidget
            text={lastChecked}
            style={{
              fontSize: 12,
              color: '#CBD5E1',
              fontWeight: '500',
            }}
          />
        </FlexWidget>

        {responseTime !== null && (
          <FlexWidget style={{ alignItems: 'center' }}>
            <TextWidget
              text="Respuesta"
              style={{
                fontSize: 10,
                color: '#64748B',
              }}
            />
            <TextWidget
              text={`${responseTime}ms`}
              style={{
                fontSize: 12,
                color: '#CBD5E1',
                fontWeight: '500',
              }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

export default SystemStatusWidget;
