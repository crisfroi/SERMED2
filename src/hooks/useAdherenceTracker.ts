// ============================================================================
// useAdherenceTracker.ts - Medication Adherence Monitoring Hook
// ASIS 10.0 - Regímenes de Medicación - Hito 3
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AdherenceMetrics {
  totalDoses: number;
  dosesTaken: number;
  adherencePercentage: number;
  missedDoses: number;
  refillsPending: number;
  lastTaken?: Date;
  nextDue?: Date;
  trend: 'improving' | 'stable' | 'declining';
}

interface DoseRecord {
  date: string;
  taken: boolean;
  notes?: string;
  timestamp?: string;
}

export const useAdherenceTracker = (
  patientId: string,
  medicationId?: string,
  period: 'week' | 'month' | 'quarter' = 'month'
) => {
  const [adherenceData, setAdherenceData] = useState<DoseRecord[]>([]);
  const [metrics, setMetrics] = useState<AdherenceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Calculate date range based on period
  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  }, [period]);

  // Fetch adherence data
  const fetchAdherenceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange();

      let query = supabase
        .from('adherence_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data, error: err } = await query.order('date', { ascending: true });

      if (err) throw err;

      const records: DoseRecord[] = (data || []).map((r: any) => ({
        date: r.date,
        taken: r.taken,
        notes: r.notes,
        timestamp: r.created_at,
      }));

      setAdherenceData(records);

      // Calculate metrics
      calculateMetrics(records);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching adherence data:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, medicationId, getDateRange, supabase]);

  // Calculate adherence metrics
  const calculateMetrics = useCallback((records: DoseRecord[]) => {
    const totalDoses = records.length;
    const dosesTaken = records.filter((r) => r.taken).length;
    const missedDoses = records.filter((r) => !r.taken).length;
    const adherencePercentage = totalDoses > 0 ? (dosesTaken / totalDoses) * 100 : 0;

    // Determine trend
    const recentRecords = records.slice(-7);
    const olderRecords = records.slice(0, Math.max(1, records.length - 7));

    const recentAdherence = recentRecords.length > 0
      ? (recentRecords.filter((r) => r.taken).length / recentRecords.length) * 100
      : 0;
    const olderAdherence = olderRecords.length > 0
      ? (olderRecords.filter((r) => r.taken).length / olderRecords.length) * 100
      : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAdherence > olderAdherence + 5) {
      trend = 'improving';
    } else if (recentAdherence < olderAdherence - 5) {
      trend = 'declining';
    }

    const lastTakenRecord = [...records].reverse().find((r) => r.taken);
    const lastTaken = lastTakenRecord ? new Date(lastTakenRecord.date) : undefined;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);

    setMetrics({
      totalDoses,
      dosesTaken,
      adherencePercentage,
      missedDoses,
      refillsPending: 0, // Will be updated separately
      lastTaken,
      nextDue: nextDueDate,
      trend,
    });
  }, []);

  useEffect(() => {
    fetchAdherenceData();
  }, [fetchAdherenceData]);

  // Record dose taken/missed
  const recordDose = useCallback(
    async (date: string, taken: boolean, notes?: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase.from('adherence_records').insert({
          patient_id: patientId,
          medication_id: medicationId,
          date,
          taken,
          notes,
        });

        if (err) throw err;

        // Refresh data
        await fetchAdherenceData();
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error('Error recording dose:', err);
        return false;
      }
    },
    [patientId, medicationId, supabase, fetchAdherenceData]
  );

  // Get adherence warnings
  const getWarnings = useCallback(async (): Promise<string[]> => {
    const warnings: string[] = [];

    if (!metrics) return warnings;

    if (metrics.adherencePercentage < 80) {
      warnings.push(
        'Adherence below 80% target. Consider discussing barriers to medication adherence.'
      );
    }

    if (metrics.trend === 'declining') {
      warnings.push('Adherence trend is declining. Increased monitoring recommended.');
    }

    if (metrics.missedDoses >= 3) {
      warnings.push(`${metrics.missedDoses} doses missed in this period. Clinical review needed.`);
    }

    return warnings;
  }, [metrics]);

  // Export adherence data
  const exportData = useCallback(() => {
    return {
      patientId,
      medicationId,
      period,
      recordCount: adherenceData.length,
      metrics,
      data: adherenceData,
      exportedAt: new Date().toISOString(),
    };
  }, [adherenceData, metrics, patientId, medicationId, period]);

  // Get adherence statistics by day of week
  const getWeekdayStats = useCallback(async () => {
    const stats = {
      Monday: { total: 0, taken: 0 },
      Tuesday: { total: 0, taken: 0 },
      Wednesday: { total: 0, taken: 0 },
      Thursday: { total: 0, taken: 0 },
      Friday: { total: 0, taken: 0 },
      Saturday: { total: 0, taken: 0 },
      Sunday: { total: 0, taken: 0 },
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    adherenceData.forEach((record) => {
      const dayName = dayNames[new Date(record.date).getDay()];
      stats[dayName as keyof typeof stats].total++;
      if (record.taken) {
        stats[dayName as keyof typeof stats].taken++;
      }
    });

    return Object.entries(stats).map(([day, count]) => ({
      day,
      percentage: count.total > 0 ? (count.taken / count.total) * 100 : 0,
      total: count.total,
      taken: count.taken,
    }));
  }, [adherenceData]);

  return {
    adherenceData,
    metrics,
    loading,
    error,
    recordDose,
    getWarnings,
    exportData,
    getWeekdayStats,
    refetchAdherence: fetchAdherenceData,
  };
};
