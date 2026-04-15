// @ts-nocheck
// WEEK 12 ADMIN 2: Waiting Rooms
// Hook: useQueueAnalytics
// Purpose: Analytics and reporting - KPIs, trends, statistics
// Status: Production-ready

import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export interface QueueAnalyticPoint {
  timestamp: string;
  total_queued: number;
  total_attended: number;
  total_no_show: number;
  avg_wait_time: number;
  max_wait_time: number;
  min_wait_time: number;
  priority_breakdown: Record<string, number>;
}

export interface QueueAnalyticsSummary {
  period: string;
  total_patients_queued: number;
  total_patients_attended: number;
  total_no_show: number;
  no_show_rate_percent: number;
  completion_rate_percent: number;
  avg_wait_time: number;
  max_wait_time: number;
  min_wait_time: number;
  peak_hours: Record<string, number>;
  busiest_day?: string;
  quietest_day?: string;
}

export interface TimeSeriesDataPoint {
  time: string;
  avgWait: number;
  attended: number;
  noShow: number;
  queued: number;
}

export interface UseQueueAnalyticsOptions {
  roomId?: string;
  timeRange?: 'today' | 'week' | 'month' | 'quarter';
  autoRefresh?: number;
  enabled?: boolean;
}

/**
 * Hook for queue analytics and reporting
 * - Fetch analytics data for time range
 * - Calculate KPIs and summaries
 * - Generate trends and charts data
 * - Export analytics to PDF/Excel
 */
export const useQueueAnalytics = ({
  roomId,
  timeRange = 'today',
  autoRefresh = 60000,
  enabled = true,
}: UseQueueAnalyticsOptions) => {
  const [selectedMetric, setSelectedMetric] = useState<'avgWait' | 'attended' | 'noShow'>('avgWait');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Fetch analytics data
  const { data: analyticsData = [], isLoading } = useQuery<QueueAnalyticPoint[]>({
    queryKey: ['queue-analytics', roomId, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: timeRange,
        ...(roomId && { room_id: roomId }),
      });
      const response = await fetch(`/api/v1/waiting-rooms/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled,
    refetchInterval: autoRefresh,
    staleTime: autoRefresh - 5000,
  });

  // Calculate summary statistics
  const summary = useMemo<QueueAnalyticsSummary | null>(() => {
    if (analyticsData.length === 0) return null;

    const totalQueued = analyticsData.reduce((sum, d) => sum + d.total_queued, 0);
    const totalAttended = analyticsData.reduce((sum, d) => sum + d.total_attended, 0);
    const totalNoShow = analyticsData.reduce((sum, d) => sum + d.total_no_show, 0);

    const avgWait =
      analyticsData.length > 0
        ? Math.round(
            analyticsData.reduce((sum, d) => sum + d.avg_wait_time, 0) / analyticsData.length
          )
        : 0;
    const maxWait = Math.max(...analyticsData.map((d) => d.max_wait_time), 0);
    const minWait = Math.min(...analyticsData.map((d) => d.min_wait_time), Infinity);

    const peakHours = analyticsData.reduce(
      (acc, d) => {
        Object.entries(d.priority_breakdown || {}).forEach(([priority, count]) => {
          acc[priority] = (acc[priority] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      period: timeRange,
      total_patients_queued: totalQueued,
      total_patients_attended: totalAttended,
      total_no_show: totalNoShow,
      no_show_rate_percent:
        totalQueued > 0 ? Math.round((totalNoShow / totalQueued) * 100 * 100) / 100 : 0,
      completion_rate_percent:
        totalQueued > 0 ? Math.round((totalAttended / totalQueued) * 100 * 100) / 100 : 0,
      avg_wait_time: avgWait,
      max_wait_time: maxWait === -Infinity ? 0 : maxWait,
      min_wait_time: minWait === Infinity ? 0 : minWait,
      peak_hours: peakHours,
    };
  }, [analyticsData, timeRange]);

  // Prepare time series data for charts
  const timeSeriesData = useMemo<TimeSeriesDataPoint[]>(() => {
    return analyticsData.map((point, index) => {
      const date = new Date(point.timestamp);
      const timeLabel =
        timeRange === 'today'
          ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

      return {
        time: timeLabel,
        avgWait: point.avg_wait_time,
        attended: point.total_attended,
        noShow: point.total_no_show,
        queued: point.total_queued,
      };
    });
  }, [analyticsData, timeRange]);

  // Calculate KPI trends
  const trends = useMemo(() => {
    if (analyticsData.length < 2) return null;

    const first = analyticsData[0];
    const last = analyticsData[analyticsData.length - 1];

    return {
      avgWaitTrend: last.avg_wait_time - first.avg_wait_time,
      attendedTrend: last.total_attended - first.total_attended,
      noShowTrend: last.total_no_show - first.total_no_show,
    };
  }, [analyticsData]);

  // Priority breakdown analysis
  const priorityAnalysis = useMemo(() => {
    if (!summary) return null;

    const combined = analyticsData.reduce(
      (acc, d) => {
        Object.entries(d.priority_breakdown || {}).forEach(([priority, count]) => {
          acc[priority] = (acc[priority] || 0) + (count as number);
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(combined).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      percent: summary.total_patients_queued > 0 
        ? Math.round((count / summary.total_patients_queued) * 100 * 100) / 100
        : 0,
    }));
  }, [analyticsData, summary]);

  // Wait time brackets analysis
  const waitTimeBrackets = useMemo(() => {
    if (!summary) return null;

    // Categorize by wait time
    const brackets = {
      'under_5min': 0,
      '5_10min': 0,
      '10_20min': 0,
      '20_30min': 0,
      'over_30min': 0,
    };

    analyticsData.forEach((point) => {
      if (point.avg_wait_time < 5) brackets.under_5min++;
      else if (point.avg_wait_time < 10) brackets['5_10min']++;
      else if (point.avg_wait_time < 20) brackets['10_20min']++;
      else if (point.avg_wait_time < 30) brackets['20_30min']++;
      else brackets.over_30min++;
    });

    return Object.entries(brackets).map(([bracket, count]) => ({
      range: bracket.replace(/_/g, ' '),
      count,
      percent: analyticsData.length > 0 ? Math.round((count / analyticsData.length) * 100) : 0,
    }));
  }, [analyticsData, summary]);

  // Export analytics to PDF
  const exportPDFMutation = useMutation({
    mutationFn: async (data: { title?: string; includeCharts?: boolean }) => {
      setExportStatus('loading');
      try {
        const response = await fetch('/api/v1/waiting-rooms/analytics/export-pdf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: roomId,
            time_range: timeRange,
            title: data.title || `Queue Analytics - ${timeRange}`,
            include_charts: data.includeCharts !== false,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportStatus('success');
        setTimeout(() => setExportStatus('idle'), 3000);
      } catch (error) {
        setExportStatus('error');
        throw error;
      }
    },
  });

  // Export analytics to Excel
  const exportExcelMutation = useMutation({
    mutationFn: async (data: { filename?: string; includeSummary?: boolean }) => {
      setExportStatus('loading');
      try {
        const response = await fetch('/api/v1/waiting-rooms/analytics/export-excel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: roomId,
            time_range: timeRange,
            include_summary: data.includeSummary !== false,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportStatus('success');
        setTimeout(() => setExportStatus('idle'), 3000);
      } catch (error) {
        setExportStatus('error');
        throw error;
      }
    },
  });

  return {
    // Raw data
    analyticsData,

    // Computed summaries
    summary,
    timeSeriesData,
    trends,
    priorityAnalysis,
    waitTimeBrackets,

    // Loading state
    isLoading,

    // Export functions
    exportPDF: exportPDFMutation.mutate,
    exportExcel: exportExcelMutation.mutate,
    isExporting: exportPDFMutation.isPending || exportExcelMutation.isPending,
    exportStatus,

    // UI helpers
    selectedMetric,
    setSelectedMetric,
  };
};
