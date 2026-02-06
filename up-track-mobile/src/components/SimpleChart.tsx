import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  title: string;
  unit?: string;
  color?: string;
  height?: number;
  showGradient?: boolean;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title,
  unit = 'ms',
  color = colors.primary,
  height = 200,
  showGradient = true,
}) => {
  const width = Dimensions.get('window').width - 64; // Padding
  const headerHeight = 50; // Espacio para título y stats
  const chartHeight = height - headerHeight - 40; // Espacio para gráfica (más margen inferior)
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 20;
  const chartWidth = width - paddingLeft - paddingRight;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sin datos disponibles</Text>
        </View>
      </View>
    );
  }

  // Calcular valores - rango de 0 al máximo
  const values = data.map((d) => d.value);
  const minValue = 0; // Siempre desde 0
  const maxValue = Math.max(...values);
  const valueRange = maxValue || 1; // Evitar división por 0

  // Calcular promedio
  const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Normalizar puntos (desde 0)
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.value / valueRange) * chartHeight;
    return { x, y, value: d.value, timestamp: d.timestamp };
  });

  // Posición Y de la línea de promedio
  const avgY = paddingTop + chartHeight - (avgValue / valueRange) * chartHeight;

  // Crear path de línea
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Crear path de área (para gradiente)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`;

  // Valores para eje Y (0, mitad, máximo)
  const yLabels = [
    { value: maxValue, y: paddingTop },
    { value: Math.round(maxValue / 2), y: paddingTop + chartHeight / 2 },
    { value: 0, y: paddingTop + chartHeight },
  ];

  // Último valor
  const lastValue = values[values.length - 1];
  const lastPoint = points[points.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Actual</Text>
            <Text style={[styles.statValue, { color }]}>{lastValue}{unit}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Promedio</Text>
            <Text style={styles.statValue}>{avgValue}{unit}</Text>
          </View>
        </View>
      </View>

      <Svg width={width} height={chartHeight + paddingTop + paddingBottom}>
        <Defs>
          <LinearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>

        {/* Grid lines horizontales */}
        {yLabels.map((label, i) => (
          <Line
            key={i}
            x1={paddingLeft}
            y1={label.y}
            x2={width - paddingRight}
            y2={label.y}
            stroke={colors.borderDark}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Línea de promedio (referencia) */}
        <Line
          x1={paddingLeft}
          y1={avgY}
          x2={width - paddingRight}
          y2={avgY}
          stroke={colors.statusWarning}
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />

        {/* Área con relleno transparente */}
        {showGradient && (
          <Path d={areaPath} fill={color} fillOpacity={0.08} />
        )}

        {/* Línea principal */}
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto actual (último) */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={5}
          fill={colors.backgroundCard}
          stroke={color}
          strokeWidth={2}
        />

        {/* Labels Y */}
        {yLabels.map((label, i) => (
          <React.Fragment key={`label-${i}`}>
            {/* Background para mejor legibilidad */}
            <Rect
              x={0}
              y={label.y - 8}
              width={36}
              height={16}
              fill={colors.backgroundCard}
            />
          </React.Fragment>
        ))}
      </Svg>

      {/* Y-axis labels (fuera del SVG para mejor renderizado de texto) */}
      <View style={[styles.yLabels, { height: chartHeight + paddingTop, top: headerHeight + 16 }]}>
        <Text style={styles.yLabel}>{maxValue}</Text>
        <Text style={styles.yLabel}>{Math.round(maxValue / 2)}</Text>
        <Text style={styles.yLabel}>0</Text>
      </View>

      {/* Etiqueta del promedio */}
      <View style={[styles.avgLabel, { top: headerHeight + 16 + avgY - 8 }]}>
        <Text style={styles.avgLabelText}>Prom: {avgValue}</Text>
      </View>
    </View>
  );
};

interface UptimeBarChartProps {
  data: { timestamp: string; status: 'UP' | 'DOWN' | 'PENDING' }[];
  title?: string;
  height?: number;
}

export const UptimeBarChart: React.FC<UptimeBarChartProps> = ({
  data,
  title = 'Disponibilidad (últimas 24h)',
  height = 120,
}) => {
  const width = Dimensions.get('window').width - 64;
  const barHeight = 28;
  const barsToShow = Math.min(data.length, 48); // Máximo 48 barras

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sin datos de disponibilidad</Text>
        </View>
      </View>
    );
  }

  const displayData = data.slice(-barsToShow);
  const barWidth = (width - 8) / displayData.length;
  const gap = 1;

  // Calcular uptime
  const upCount = displayData.filter((d) => d.status === 'UP').length;
  const uptimePercent = Math.round((upCount / displayData.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP':
        return colors.statusSuccess;
      case 'DOWN':
        return colors.statusDanger;
      default:
        return colors.statusWarning;
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.uptimeBadge}>
          <Text style={[styles.uptimeValue, { color: uptimePercent >= 99 ? colors.statusSuccess : uptimePercent >= 95 ? colors.statusWarning : colors.statusDanger }]}>
            {uptimePercent}%
          </Text>
        </View>
      </View>

      <View style={styles.barsContainer}>
        <Svg width={width} height={barHeight + 8}>
          {displayData.map((d, i) => (
            <Rect
              key={i}
              x={i * barWidth + gap}
              y={4}
              width={Math.max(barWidth - gap * 2, 2)}
              height={barHeight}
              rx={2}
              fill={getStatusColor(d.status)}
              opacity={0.9}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.statusSuccess }]} />
          <Text style={styles.legendText}>Online</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.statusDanger }]} />
          <Text style={styles.legendText}>Offline</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.statusWarning }]} />
          <Text style={styles.legendText}>Pendiente</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  yLabels: {
    position: 'absolute',
    left: 16,
    top: 48,
    justifyContent: 'space-between',
  },
  yLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    width: 32,
  },
  avgLabel: {
    position: 'absolute',
    right: 8,
    backgroundColor: colors.statusWarning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  avgLabelText: {
    fontSize: 9,
    color: colors.statusWarning,
    fontWeight: '600',
  },
  barsContainer: {
    marginVertical: 4,
  },
  uptimeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  uptimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});

export default SimpleLineChart;
