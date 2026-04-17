// ============================================================================
// useExpirationTracking Hook - Pharmacy Medication Expiration Management
// Monitor medication expiration dates and generate alerts
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ExpiringMedication {
  id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string;
  quantity: number;
  expiration_date: string;
  days_until_expiration: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  storage_location: string;
}

interface ExpirationSummary {
  expired_count: number;
  expiring_30_days: number;
  expiring_60_days: number;
  expiring_90_days: number;
  total_affected_units: number;
  critical_meds: ExpiringMedication[];
}

export const useExpirationTracking = () => {
  const [expiringMeds, setExpiringMeds] = useState<ExpiringMedication[]>([]);
  const [summary, setSummary] = useState<ExpirationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDaysUntilExpiration = (expirationDate: string): number => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyLevel = (daysUntilExpiration: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (daysUntilExpiration <= 0) return 'critical';
    if (daysUntilExpiration <= 30) return 'high';
    if (daysUntilExpiration <= 60) return 'medium';
    return 'low';
  };

  const fetchExpiringMedications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('medication_batches')
        .select(`
          *,
          medicine:medicine_id(name, unit_of_measure),
          inventory:id(storage_location)
        `)
        .lte('expiration_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('expiration_date', { ascending: true });

      if (queryError) throw queryError;

      const expiringList: ExpiringMedication[] = (data || []).map((batch) => {
        const daysUntilExp = calculateDaysUntilExpiration(batch.expiration_date);

        return {
          id: batch.id,
          medicine_id: batch.medicine_id,
          medicine_name: batch.medicine?.name || batch.medicine_id,
          batch_number: batch.batch_number,
          quantity: batch.quantity_in_stock,
          expiration_date: batch.expiration_date,
          days_until_expiration: daysUntilExp,
          urgency: getUrgencyLevel(daysUntilExp),
          storage_location: batch.inventory?.storage_location || 'Unknown',
        };
      });

      setExpiringMeds(expiringList);

      // Calculate summary
      const summaryData: ExpirationSummary = {
        expired_count: expiringList.filter(m => m.days_until_expiration <= 0).length,
        expiring_30_days: expiringList.filter(m => m.days_until_expiration > 0 && m.days_until_expiration <= 30).length,
        expiring_60_days: expiringList.filter(m => m.days_until_expiration > 30 && m.days_until_expiration <= 60).length,
        expiring_90_days: expiringList.filter(m => m.days_until_expiration > 60 && m.days_until_expiration <= 90).length,
        total_affected_units: expiringList.reduce((sum, m) => sum + m.quantity, 0),
        critical_meds: expiringList.filter(m => m.urgency === 'critical' || m.urgency === 'high'),
      };

      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching expiring medications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsDiscarded = useCallback(async (
    batchId: string,
    quantityDiscarded: number,
    discardReason: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('medication_batches')
        .update({
          quantity_in_stock: supabase.raw(`quantity_in_stock - ${quantityDiscarded}`),
          discarded_quantity: supabase.raw(`COALESCE(discarded_quantity, 0) + ${quantityDiscarded}`),
          discard_reason: discardReason,
          discard_date: new Date().toISOString(),
        })
        .eq('id', batchId);

      if (updateError) throw updateError;

      await fetchExpiringMedications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error marking medication as discarded');
    } finally {
      setLoading(false);
    }
  }, [fetchExpiringMedications]);

  return {
    expiringMeds,
    summary,
    loading,
    error,
    fetchExpiringMedications,
    markAsDiscarded,
  };
};
