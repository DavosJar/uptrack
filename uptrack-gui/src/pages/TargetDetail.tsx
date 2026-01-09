import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { fetchWithAuth } from '../api/fetch';

const buildApiUrl = (baseUrl: string, link: string): string => {
  return link;
};

interface StatusSegmentProps {
  segment: {
    status: string;
    percentage: number;
    color: string;
    startTime: Date;
    endTime: Date;
    duration: string;
  };
  index: number;
}

const StatusSegment: React.FC<StatusSegmentProps> = ({ segment, index }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div
      key={index}
      className={`${segment.color} flex items-center justify-center text-xs ${segment.status === 'DEGRADED' ? 'text-black' : 'text-white'} font-medium relative group transition-opacity hover:opacity-90 cursor-pointer`}
      style={{ width: `${segment.percentage}%` }}
      role="status"
      aria-label={`${segment.status}: ${segment.duration} desde ${formatTime(segment.startTime)} hasta ${formatTime(segment.endTime)}`}
      tabIndex={0}
    >
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-background-surface text-text-main text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-border-dark shadow-2xl" role="tooltip">
        <div className="font-bold mb-2 text-base text-text-main">{segment.status}</div>
        <div className="text-text-muted mb-1">Inicio: {formatTime(segment.startTime)}</div>
        <div className="text-text-muted mb-1">Fin: {formatTime(segment.endTime)}</div>
        <div className="text-text-muted">Duración: {segment.duration}</div>
      </div>
    </div>
  );
};

interface HeatmapCellProps {
  hourData: {
    hour: number;
    ms: number;
    status: 'normal' | 'slow' | 'critical' | 'empty';
    hasData: boolean;
    count: number;
  };
  dayData: {
    date: string;
  };
  hourIdx: number;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ hourData, dayData, hourIdx }) => {
  const bgColor =
    hourData.status === 'empty'
      ? 'bg-transparent border border-border-dark' // Empty cells: Transparent with border
      : hourData.status === 'critical'
      ? 'bg-red-600'
      : hourData.status === 'slow'
      ? 'bg-yellow-500'
      : 'bg-green-600';

  // Calcular inicio y fin de la hora
  const startTime = new Date(dayData.date);
  startTime.setHours(hourData.hour, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(hourData.hour + 1, 0, 0, 0);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div
      key={hourIdx}
      className={`flex-1 h-6 ${bgColor} rounded ${hourData.hasData ? 'hover:opacity-80 cursor-pointer' : ''} relative group`}
      role={hourData.hasData ? 'status' : undefined}
      aria-label={hourData.hasData ? `${hourData.status.toUpperCase()}: ${hourData.ms}ms, ${hourData.count} checks de ${formatTime(startTime)} a ${formatTime(endTime)}` : undefined}
      tabIndex={hourData.hasData ? 0 : undefined}
    >
      {hourData.hasData && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background-surface text-text-main text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 border border-border-dark shadow-lg" role="tooltip">
          <div className="font-semibold mb-1 text-text-main">{hourData.status.toUpperCase()}</div>
          <div className="text-text-muted">Fecha: {dayData.date}</div>
          <div className="text-text-muted">Inicio: {formatTime(startTime)}</div>
          <div className="text-text-muted">Fin: {formatTime(endTime)}</div>
          <div className="text-text-muted">Promedio: {hourData.ms}ms</div>
          <div className="text-text-muted">Checks: {hourData.count}</div>
        </div>
      )}
    </div>
  );
};

const TargetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [target, setTarget] = useState<any>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [metricsList, setMetricsList] = useState<any[]>([]);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpointData = async (link: string) => {
    const fullUrl = buildApiUrl('', link);
    const response = await fetchWithAuth(fullUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.data;
  };

  useEffect(() => {
    const fetchTarget = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const url = `/api/v1/targets/${id}`;
        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setTarget(data);
        const history_events = await fetchEndpointData(data._links?.history);
        console.log("HISTORY EVENTS:", history_events);
        setHistoryEvents(history_events);
        const metrics_list = await fetchEndpointData(data._links?.metrics);
        setMetricsList(metrics_list);
        const statistics_data = await fetchEndpointData(data._links?.statistics);
        setStatisticsData(statistics_data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching target details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load target details');
        setLoading(false);
      }
    };
    fetchTarget();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-text-main text-xl">Cargando...</div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="alert" aria-live="assertive">
        <div className="text-red-500 text-xl">{error || 'Sistema no encontrado'}</div>
      </div>
    );
  }
  console.log(target)
  console.log("TARGET STATE:", target.data.current_status);

  const statusColor = target.data.current_status === 'UP' ? 'bg-status-success' : target.data.current_status === 'DOWN' ? 'bg-status-danger' : 'bg-status-warning';
  
  // Filter metrics for the last 24 hours
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Prepare Metrics
  const filteredMetrics = metricsList
    .filter((m: any) => new Date(m.timestamp) >= twentyFourHoursAgo)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 2. Prepare History
  const filteredHistory = historyEvents
    .filter((e: any) => new Date(e.timestamp) >= twentyFourHoursAgo)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 3. Determine Start Time (Adaptive)
  // Default to 24h ago
  let startTime = twentyFourHoursAgo;
  
  // If we have data, check if the oldest data point is more recent than 24h ago
  let oldestDataTime = now.getTime();
  let hasData = false;

  if (filteredMetrics.length > 0) {
      oldestDataTime = Math.min(oldestDataTime, new Date(filteredMetrics[0].timestamp).getTime());
      hasData = true;
  }
  // Also check history, but only if it starts within the window
  if (filteredHistory.length > 0) {
      oldestDataTime = Math.min(oldestDataTime, new Date(filteredHistory[0].timestamp).getTime());
      hasData = true;
  }

  if (hasData) {
      // Use the oldest data point as start time, but clamp to 24h ago max
      // (Logic: if oldestDataTime > twentyFourHoursAgo, use oldestDataTime)
      if (oldestDataTime > twentyFourHoursAgo.getTime()) {
          startTime = new Date(oldestDataTime);
      }
  }

  const metricsChartData = filteredMetrics.map((m: any) => ({
      timestamp: new Date(m.timestamp).getTime(),
      value: m.response_time_ms
    }));

  // Usar el promedio histórico real (del backend) en lugar de calcularlo sobre las métricas visibles
  const avgResponseTime = statisticsData?.avg_response_time_ms || 0;

  const cpuChartData = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 60) + 10 }));

  const generateHeatmapData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const data = [];
    
    // Usar el promedio histórico global para determinar umbrales de lentitud
    const globalAvg = statisticsData?.avg_response_time_ms || 100;
    
    // Ordenar historial cronológicamente una sola vez
    const sortedHistory = [...historyEvents].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const hours = [];
      
      for (let h = 0; h < 24; h++) {
        // Definir límites de la hora actual
        const hourStart = new Date(d);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(h + 1, 0, 0, 0);
        
        // Ignorar horas futuras
        if (hourStart > new Date()) {
          hours.push({ hour: h, ms: 0, status: 'empty' as 'empty', hasData: false, count: 0 });
          continue;
        }

        // Buscar métricas en esta hora
        const hourMetrics = metricsList.filter((metric: any) => {
          const mTime = new Date(metric.timestamp).getTime();
          return mTime >= hourStart.getTime() && mTime < hourEnd.getTime();
        });
        
        // Buscar eventos en esta hora
        const hourEvents = sortedHistory.filter((event: any) => {
          const eTime = new Date(event.timestamp).getTime();
          return eTime >= hourStart.getTime() && eTime < hourEnd.getTime();
        });
        
        // Determinar el estado inicial de la hora (basado en el último evento ANTES de esta hora)
        let initialStatus: 'UP' | 'DOWN' | 'DEGRADED' | null = null;
        const priorEvents = sortedHistory.filter((e: any) => new Date(e.timestamp).getTime() < hourStart.getTime());
        if (priorEvents.length > 0) {
          initialStatus = priorEvents[priorEvents.length - 1].status as 'UP' | 'DOWN' | 'DEGRADED';
        }

        let ms = 0;
        let status: 'normal' | 'slow' | 'critical' | 'empty' = 'empty';
        
        // Lógica de Prioridad de Estados:
        // 1. CRITICAL: Si hubo un evento DOWN en la hora, O si empezamos la hora en DOWN.
        // 2. SLOW: Si hubo un evento DEGRADED, O si empezamos en DEGRADED (y no hubo DOWN).
        // 3. NORMAL: Si hay métricas, O evento UP, O empezamos en UP.
        
        const hasDownEvent = hourEvents.some((e: any) => e.status === 'DOWN');
        const startDown = initialStatus === 'DOWN';
        
        const hasDegradedEvent = hourEvents.some((e: any) => e.status === 'DEGRADED');
        const startDegraded = initialStatus === 'DEGRADED';
        
        // Calcular latencia promedio si hay métricas
        let isLatencyCritical = false;
        let isLatencySlow = false;
        
        if (hourMetrics.length > 0) {
          const avgMs = hourMetrics.reduce((sum: number, m: any) => sum + (m.response_time_ms || 0), 0) / hourMetrics.length;
          ms = Math.round(avgMs);
          
          if (ms > globalAvg * 4) isLatencyCritical = true;
          else if (ms > globalAvg * 2.5) isLatencySlow = true;
        }

        // Determinar STATUS final
        if (hasDownEvent || (startDown && !hourEvents.some((e: any) => e.status === 'UP'))) {
             status = 'critical';
        } else if (isLatencyCritical) {
             status = 'critical';
        } else if (hasDegradedEvent || (startDegraded && !hourEvents.some((e: any) => e.status === 'UP' || e.status === 'DOWN'))) {
             status = 'slow';
        } else if (isLatencySlow) {
             status = 'slow';
        } else if (hourMetrics.length > 0 || hourEvents.some((e: any) => e.status === 'UP') || initialStatus === 'UP') {
             status = 'normal';
        } else {
             status = 'empty';
        }

        // Ensure status is always of the correct type
        const statusTyped = status as 'normal' | 'slow' | 'critical' | 'empty';

        hours.push({ hour: h, ms, status: statusTyped as 'normal' | 'slow' | 'critical' | 'empty', hasData: statusTyped !== 'empty', count: hourMetrics.length });
      }
      data.push({ day: dayName, date: d.toLocaleDateString(), hours });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();


  const buildStatusHistoryBar = () => {
    // Use the adaptive startTime calculated above
    const barStartTime = startTime;
    const totalDuration = now.getTime() - barStartTime.getTime();

    // If duration is very small (e.g. < 1 min), show full bar as current status
    if (totalDuration < 60000) {
         const status = target.data.current_status || 'UNKNOWN';
         return [{ 
            status: status, 
            percentage: 100, 
            color: status === 'UP' ? 'bg-status-success' : status === 'DOWN' ? 'bg-status-danger' : status === 'DEGRADED' ? 'bg-status-warning' : 'bg-gray-600',
            startTime: barStartTime,
            endTime: now,
            duration: 'Just now'
          }];
    }

    if (historyEvents.length === 0) {
      const status = target.data.current_status || 'UNKNOWN';
      return [{ 
        status: status, 
        percentage: 100, 
        color: status === 'UP' ? 'bg-status-success' : status === 'DOWN' ? 'bg-status-danger' : status === 'DEGRADED' ? 'bg-status-warning' : 'bg-gray-600',
        startTime: barStartTime,
        endTime: now,
        duration: '24h'
      }];
    }
    
    // Ordenar eventos por timestamp ascendente (usamos todos para buscar el estado inicial)
    const sortedAllEvents = [...historyEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find initial status at barStartTime
    let currentStatus = 'UNKNOWN';
    let startIndex = 0;

    // Find the first event that is INSIDE our window (>= barStartTime)
    const firstEventInWindowIndex = sortedAllEvents.findIndex(e => new Date(e.timestamp) >= barStartTime);

    if (firstEventInWindowIndex === -1) {
        // All events are older than barStartTime. Use the status of the last event.
        if (sortedAllEvents.length > 0) {
             currentStatus = sortedAllEvents[sortedAllEvents.length - 1].status;
        }
        return [{
            status: currentStatus,
            percentage: 100,
            color: currentStatus === 'UP' ? 'bg-status-success' : currentStatus === 'DOWN' ? 'bg-status-danger' : currentStatus === 'DEGRADED' ? 'bg-status-warning' : 'bg-gray-600',
            startTime: barStartTime,
            endTime: now,
            duration: '24h'
        }];
    } else if (firstEventInWindowIndex === 0) {
        // All events are within the window.
        // The status BEFORE the first event is technically unknown if we have no prior history.
        // However, usually we assume the first event establishes the status.
        // Or we can start the bar AT the first event time?
        // But barStartTime is already set to the oldest data point (which would be this event).
        currentStatus = sortedAllEvents[0].status;
        startIndex = 0;
    } else {
        // There is an event before barStartTime.
        currentStatus = sortedAllEvents[firstEventInWindowIndex - 1].status;
        startIndex = firstEventInWindowIndex;
    }
    
    const segments: any[] = [];
    let segmentStartTime = barStartTime;
    
    for (let i = startIndex; i < sortedAllEvents.length; i++) {
      // Only process events that are effectively changing status or are the first one in window
      // But we already set currentStatus. We look for CHANGES.
      if (sortedAllEvents[i].status !== currentStatus) {
        const eventTime = new Date(sortedAllEvents[i].timestamp);
        
        // Ensure we don't go back in time (shouldn't happen due to sort and index logic)
        if (eventTime < segmentStartTime) continue;

        const endTime = eventTime;
        const durationMs = endTime.getTime() - segmentStartTime.getTime();
        
        // Only add segment if it has duration
        if (durationMs > 0) {
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            const durationHours = Math.floor(durationMinutes / 60);
            const remainingMinutes = durationMinutes % 60;
            
            let durationText = '';
            if (durationHours > 0) {
            durationText = `${durationHours}h ${remainingMinutes}m`;
            } else {
            durationText = `${durationMinutes}m`;
            }
            
            segments.push({
            status: currentStatus,
            color: currentStatus === 'UP' ? 'bg-status-success' : currentStatus === 'DOWN' ? 'bg-status-danger' : currentStatus === 'DEGRADED' ? 'bg-status-warning' : 'bg-gray-600',
            startTime: segmentStartTime,
            endTime,
            duration: durationText
            });
        }
        
        currentStatus = sortedAllEvents[i].status;
        segmentStartTime = endTime;
      }
    }
    
    // Agregar el último segmento hasta ahora
    const durationMs = now.getTime() - segmentStartTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    
    let durationText = '';
    if (durationHours > 0) {
      durationText = `${durationHours}h ${remainingMinutes}m`;
    } else {
      durationText = `${durationMinutes}m`;
    }
    
    segments.push({
      status: currentStatus,
      color: currentStatus === 'UP' ? 'bg-status-success' : currentStatus === 'DOWN' ? 'bg-status-danger' : currentStatus === 'DEGRADED' ? 'bg-status-warning' : 'bg-gray-600',
      startTime: segmentStartTime,
      endTime: now,
      duration: durationText
    });
    
    // Calcular percentages based on dynamic totalDuration
    return segments.map(seg => ({
      ...seg,
      percentage: ((seg.endTime.getTime() - seg.startTime.getTime()) / totalDuration) * 100
    }));
  };

  const statusHistoryBar = buildStatusHistoryBar();

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
          <span className="hover:text-text-main cursor-pointer" onClick={() => navigate('/systems')}>Sistemas</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text-main">{target.data.name}</span>
        </div>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main">{target.data.name}</h1>
            <p className="text-text-muted mt-1">{target.data.url}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden sm:block">
              Última verificación: {new Date(target.data.last_checked_at).toLocaleString()} 
            </span>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-background-hover hover:bg-border-dark text-text-main px-4 h-10 rounded-lg font-medium transition-colors border border-border-dark"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border-dark p-6 rounded-xl">
          <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Estado Actual</p>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColor} ${target.data.current_status === 'UP' ? 'animate-pulse' : ''}`}></div>
            <span className="text-2xl font-bold text-text-main">{target.data.current_status}</span>
          </div>
        </div>

        <div className="bg-background-card border border-border-dark p-6 rounded-xl">
          <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Disponibilidad (24h)</p>
          <span className="text-2xl font-bold text-text-main">
            {statisticsData?.success_rate 
              ? (statisticsData.success_rate > 1 
                  ? statisticsData.success_rate.toFixed(2) 
                  : (statisticsData.success_rate * 100).toFixed(2))
              : 0}%
          </span>
        </div>

        <div className="bg-background-card border border-border-dark p-6 rounded-xl">
          <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Respuesta Prom. (24h)</p>
          <span className="text-2xl font-bold text-text-main">{statisticsData?.avg_response_time_ms ? statisticsData.avg_response_time_ms.toFixed(0) : 0}ms</span>
        </div>

        <div className="bg-background-card border border-border-dark p-6 rounded-xl">
          <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Pico CPU (24h)</p>
          <span className="text-2xl font-bold text-text-main">N/A</span>
        </div>
      </div>

      {/* Status History (24h) */}
      <div className="bg-background-card border border-border-dark rounded-xl p-6">
        <h2 className="text-xl font-bold text-text-main mb-4">Historial de Estado (24h)</h2>
        <div className="flex w-full h-8 rounded overflow-visible">
          {statusHistoryBar.map((segment, idx) => (
            <StatusSegment key={idx} segment={segment} index={idx} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-text-muted">
          <span>Hace 24 horas</span>
          <span>Ahora</span>
        </div>
      </div>

      {/* Response Time History (7-day Heatmap) */}
      <div className="bg-background-card border border-border-dark rounded-xl p-6">
        <h2 className="text-xl font-bold text-text-main mb-4">Historial de Tiempos de Respuesta (7 días)</h2>
        <div className="space-y-2">
          {heatmapData.map((dayData, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-2">
              <div className="text-sm text-text-muted w-20">{dayData.day.slice(0, 3)}</div>
              <div className="flex flex-1 gap-1">
                {dayData.hours.map((hourData, hourIdx) => (
                  <HeatmapCell 
                    key={hourIdx} 
                    hourData={hourData} 
                    dayData={dayData} 
                    hourIdx={hourIdx} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-background-card border border-border-dark rounded-xl p-6">
        <h2 className="text-xl font-bold text-text-main mb-4">Métricas de Rendimiento</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Chart */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-3">Tiempo de Respuesta (24h)</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metricsChartData}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#135bec" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#135bec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="timestamp" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#232f48" vertical={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#181F2D', border: '1px solid #324467', borderRadius: '8px'}} 
                    itemStyle={{color: '#fff'}} 
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => avgResponseTime} 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                    name="Promedio"
                  />
                  <Area type="monotone" dataKey="value" stroke="#135bec" strokeWidth={2} fillOpacity={1} fill="url(#colorResponse)" name="Tiempo de Respuesta" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CPU Usage Chart */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-3">Uso de CPU (24h)</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cpuChartData}>
                  <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#232f48" vertical={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#181F2D', border: '1px solid #324467', borderRadius: '8px'}} 
                    itemStyle={{color: '#fff'}} 
                  />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-main">Configuración</h2>
        <div className="bg-background-card border border-border-dark p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">Alerta en Fallo</p>
              <p className="text-text-main font-medium">{target.configuration?.alert_on_failure ? 'Activada' : 'Desactivada'}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">Alerta en Recuperación</p>
              <p className="text-text-main font-medium">{target.configuration?.alert_on_recovery ? 'Activada' : 'Desactivada'}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">Intentos de Reintento</p>
              <p className="text-text-main font-medium">{target.configuration?.retry_count || 0}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">Tiempo Límite</p>
              <p className="text-text-main font-medium">{target.configuration?.timeout_seconds || 0}s</p>
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium mb-1">Fecha de Creación</p>
              <p className="text-text-main font-medium">{new Date(target.data.created_at).toLocaleString()}</p>
            </div>
    
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetDetail;

