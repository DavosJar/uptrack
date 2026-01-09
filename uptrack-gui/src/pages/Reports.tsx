import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../api/fetch';
import { Calendar, Download, Printer, FileText, BarChart2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
}

interface ReportData {
  target: any;
  history: any[];
  metrics: any[];
  statistics: any;
  generatedAt: Date;
  dateRange: {
    start: string;
    end: string;
  };
  dailyStats: any[];
  calculatedUptime: number;
  calculatedAvgResponseTime: number;
}

const Reports: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/targets');
        if (response.ok) {
          const data = await response.json();
          setTargets(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching targets:', err);
      }
    };
    fetchTargets();
    
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!selectedTargetId) {
      setError('Please select a target');
      return;
    }
    
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      // 1. Fetch Target Details
      const targetRes = await fetchWithAuth(`/api/v1/targets/${selectedTargetId}`);
      if (!targetRes.ok) throw new Error('Failed to fetch target details');
      const targetJson = await targetRes.json();
      const targetData = targetJson.data || targetJson;

      // 2. Fetch Related Data
      const fetchEndpoint = async (url: string) => {
        if (!url) return [];
        const res = await fetchWithAuth(url);
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      };

      const links = targetJson._links || targetData._links || {};

      const [history, metrics, statistics] = await Promise.all([
        fetchEndpoint(links.history),
        fetchEndpoint(links.metrics),
        fetchEndpoint(links.statistics)
      ]);

      // Filter data based on date range
      // Parse dates as local time to ensure correct day boundaries
      const parseLocal = (dateStr: string) => {
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(y, m - 1, d);
      };
      
      const start = parseLocal(startDate);
      const end = parseLocal(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredHistory = Array.isArray(history) ? history.filter((h: any) => {
        const date = new Date(h.timestamp);
        return date >= start && date <= end;
      }) : [];

      const filteredMetrics = Array.isArray(metrics) ? metrics.filter((m: any) => {
        const date = new Date(m.timestamp);
        return date >= start && date <= end;
      }) : [];

      // Determine Effective Date Range from Data
      // If data exists within the selection, zoom in to that data range.
      // If no data, keep the selected range (to show it's empty).
      let effectiveStart = start;
      let effectiveEnd = end;

      const allTimestamps = [
        ...filteredMetrics.map((m: any) => new Date(m.timestamp).getTime()),
        ...filteredHistory.map((h: any) => new Date(h.timestamp).getTime())
      ];

      if (allTimestamps.length > 0) {
        const minTs = Math.min(...allTimestamps);
        const maxTs = Math.max(...allTimestamps);
        effectiveStart = new Date(minTs);
        effectiveStart.setHours(0, 0, 0, 0);
        
        effectiveEnd = new Date(maxTs);
        effectiveEnd.setHours(23, 59, 59, 999);
      }

      // Helper to get local YYYY-MM-DD string
      const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Process Daily Stats for Charts
      const dailyStatsMap = new Map();
      
      // Initialize days based on EFFECTIVE range
      // Ensure we don't create an infinite loop if dates are wrong
      if (effectiveStart <= effectiveEnd) {
        for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = getLocalDateStr(d);
          dailyStatsMap.set(dateStr, { date: dateStr, uptime: 100, responseTime: 0, count: 0 });
        }
      }

      // Calculate Metrics per day
      filteredMetrics.forEach((m: any) => {
        const dateStr = getLocalDateStr(new Date(m.timestamp));
        // Only add if within the map (it should be, but safety first)
        if (dailyStatsMap.has(dateStr)) {
          const stat = dailyStatsMap.get(dateStr);
          stat.responseTime += (m.response_time_ms || 0);
          stat.count++;
        }
      });

      // Calculate Downtime per day (Simplified)
      filteredHistory.forEach((h: any) => {
        if (h.status !== 'UP') {
           const dateStr = getLocalDateStr(new Date(h.timestamp));
           if (dailyStatsMap.has(dateStr)) {
             const stat = dailyStatsMap.get(dateStr);
             // Rough estimate: deduct 5% for each downtime event for visualization
             stat.uptime = Math.max(0, stat.uptime - 5); 
           }
        }
      });

      const dailyStats = Array.from(dailyStatsMap.values()).map((stat: any) => {
        if (stat.count === 0) {
          return { ...stat, uptime: null, avgResponseTime: null };
        }
        return {
          ...stat,
          avgResponseTime: Math.round(stat.responseTime / stat.count)
        };
      });

      // Calculate Overall Uptime based on History
      const calculateUptime = (historyEvents: any[], startTime: Date, endTime: Date) => {
        if (!historyEvents || historyEvents.length === 0) return 100;

        const sortedHistory = [...historyEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        let totalDuration = endTime.getTime() - startTime.getTime();
        if (totalDuration <= 0) return 0;

        let downDuration = 0;
        let currentStatus = 'UP'; // Default assumption if no prior history
        
        // Find status at start
        const eventsBefore = sortedHistory.filter(h => new Date(h.timestamp) < startTime);
        if (eventsBefore.length > 0) {
          currentStatus = eventsBefore[eventsBefore.length - 1].status;
        }

        let currentTime = startTime.getTime();

        // Events within range
        const eventsInRange = sortedHistory.filter(h => {
          const t = new Date(h.timestamp).getTime();
          return t >= startTime.getTime() && t <= endTime.getTime();
        });

        for (const event of eventsInRange) {
          const eventTime = new Date(event.timestamp).getTime();
          
          if (currentStatus !== 'UP') {
            downDuration += (eventTime - currentTime);
          }
          
          currentStatus = event.status;
          currentTime = eventTime;
        }

        // Time from last event to end
        if (currentTime < endTime.getTime()) {
          if (currentStatus !== 'UP') {
            downDuration += (endTime.getTime() - currentTime);
          }
        }

        const uptime = ((totalDuration - downDuration) / totalDuration) * 100;
        return Math.max(0, Math.min(100, uptime));
      };

      const calculatedUptime = calculateUptime(history, start, end);

      // Calculate Average Response Time from filtered metrics
      const calculatedAvgResponseTime = filteredMetrics.length > 0
        ? filteredMetrics.reduce((acc: number, curr: any) => acc + (curr.response_time_ms || 0), 0) / filteredMetrics.length
        : 0;

      setReportData({
        target: targetData,
        history: filteredHistory,
        metrics: filteredMetrics,
        statistics: statistics,
        generatedAt: new Date(),
        dateRange: { start: startDate, end: endDate },
        dailyStats,
        calculatedUptime,
        calculatedAvgResponseTime
      });

    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto print:p-0 print:max-w-none print:w-full">
      {/* Control Panel - Hidden when printing */}
      <section className="print:hidden bg-background-card rounded-xl border border-border-dark p-6 mb-8 shadow-lg" aria-label="Generador de reportes">
        <h1 className="text-2xl font-bold text-text-main mb-6 flex items-center gap-2">
          <FileText className="text-primary" aria-hidden="true" />
          Generate Performance Report
        </h1>
        
        <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end" onSubmit={(e) => { e.preventDefault(); generateReport(); }} aria-label="Formulario para generar reporte">
          <div className="space-y-2">
            <label htmlFor="target-select" className="text-sm font-medium text-text-muted">Select Target</label>
            <select 
              id="target-select"
              className="w-full bg-background border border-border-dark rounded-lg px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              aria-required="true"
            >
              <option value="">-- Select a System --</option>
              {targets.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.url})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="start-date" className="text-sm font-medium text-text-muted">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
              <input 
                id="start-date"
                type="date" 
                className="w-full bg-background border border-border-dark rounded-lg pl-10 pr-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Fecha de inicio del reporte"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="end-date" className="text-sm font-medium text-text-muted">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
              <input 
                id="end-date"
                type="date" 
                className="w-full bg-background border border-border-dark rounded-lg pl-10 pr-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="Fecha de fin del reporte"
              />
            </div>
          </div>

          <button 
            onClick={generateReport}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={loading}
            aria-label="Generar reporte de rendimiento"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></span>
            ) : (
              <>
                <BarChart2 size={18} aria-hidden="true" />
                Generate Report
              </>
            )}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2" role="alert" aria-live="assertive">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}
      </section>

      {/* Report View */}
      {reportData && (
        <div className="space-y-8">
          <div className="flex justify-end print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-lg transition-colors"
              aria-label="Guardar reporte como PDF"
            >
              <Download size={18} aria-hidden="true" />
              Save as PDF
            </button>
          </div>

          {/* Report Content - Formal Document Style */}
          <div className="bg-white text-black p-[2cm] shadow-2xl mx-auto min-h-[297mm] max-w-[210mm] print:shadow-none print:p-[1.5cm] print:max-w-none print:w-full print:mx-0">
            
            {/* Document Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-serif font-bold text-black mb-1">SERVICE LEVEL REPORT</h1>
                <p className="text-gray-600 font-serif italic">UpTrack AI Monitoring System</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-serif">Generated on: {reportData.generatedAt.toLocaleDateString()}</div>
                <div className="text-sm text-gray-600 font-serif">Ref: {reportData.target.id ? reportData.target.id.slice(0, 8).toUpperCase() : 'N/A'}</div>
              </div>
            </div>

            {/* Executive Summary Table */}
            <div className="mb-8">
              <h2 className="text-lg font-bold uppercase border-b border-black mb-4 pb-1 font-serif">1. Executive Summary</h2>
              <table className="w-full border-collapse border border-black text-sm font-serif">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 bg-gray-100 font-bold w-1/4">System Name</td>
                    <td className="border border-black p-2 w-1/4">{reportData.target.name}</td>
                    <td className="border border-black p-2 bg-gray-100 font-bold w-1/4">Target URL</td>
                    <td className="border border-black p-2 w-1/4 font-mono text-xs">{reportData.target.url}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Reporting Period</td>
                    <td className="border border-black p-2" colSpan={3}>
                      {new Date(reportData.dateRange.start).toLocaleDateString()} to {new Date(reportData.dateRange.end).toLocaleDateString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Overall Uptime</td>
                    <td className="border border-black p-2">
                      {reportData.calculatedUptime !== undefined ? `${reportData.calculatedUptime.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Avg Response Time</td>
                    <td className="border border-black p-2">
                      {reportData.calculatedAvgResponseTime !== undefined ? `${Math.round(reportData.calculatedAvgResponseTime)}ms` : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Total Checks</td>
                    <td className="border border-black p-2">
                      {reportData.metrics.length}
                    </td>
                    <td className="border border-black p-2 bg-gray-100 font-bold">Total Incidents</td>
                    <td className="border border-black p-2">
                      {reportData.history.filter((h: any) => h.status !== 'UP').length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Daily Performance Chart */}
            <div className="mb-8 break-inside-avoid">
              <h2 className="text-lg font-bold uppercase border-b border-black mb-4 pb-1 font-serif">2. Daily Performance Metrics</h2>
              <div className="h-64 w-full border border-black p-2 print:h-[8cm] print:block">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      stroke="#000"
                      fontSize={10}
                      tickMargin={5}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#000"
                      fontSize={10}
                      label={{ value: 'Uptime (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#000"
                      fontSize={10}
                      label={{ value: 'Avg Response (ms)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #000' }}
                      itemStyle={{ color: '#000' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar className="print-uptime-bar" yAxisId="left" dataKey="uptime" name="Uptime %" fill="#4ade80" stroke="#4ade80" barSize={20} isAnimationActive={false} />
                    <Bar className="print-response-bar" yAxisId="right" dataKey="avgResponseTime" name="Response Time (ms)" fill="#3b82f6" stroke="#3b82f6" barSize={20} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-serif italic text-center">Figure 1: Daily uptime percentage vs average response time.</p>
            </div>

            {/* Incident History Table */}
            <div className="break-inside-avoid">
              <h2 className="text-lg font-bold uppercase border-b border-black mb-4 pb-1 font-serif">3. Incident History</h2>
              {reportData.history.length > 0 ? (
                <table className="w-full text-xs font-serif border border-black">
                  <thead className="bg-gray-100 border-b border-black">
                    <tr>
                      <th className="px-4 py-2 border-r border-black font-bold text-black w-1/4">Timestamp</th>
                      <th className="px-4 py-2 border-r border-black font-bold text-black w-1/4">Event Type</th>
                      <th className="px-4 py-2 font-bold text-black w-1/2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {reportData.history.slice(0, 15).map((event: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 border-r border-black">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 border-r border-black font-bold">
                          {event.status}
                        </td>
                        <td className="px-4 py-2">
                          {event.status === 'UP' ? 'System recovered and operational.' : 'System unreachable or returned error.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="border border-black p-4 text-center italic text-gray-600 text-sm">
                  No incidents recorded during this period.
                </div>
              )}
              {reportData.history.length > 15 && (
                <p className="text-xs text-gray-500 mt-2 italic text-right">
                  * Showing first 15 incidents only.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-4 border-t-2 border-black text-center text-xs font-serif">
              <p>CONFIDENTIAL - Generated by UpTrack AI</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
