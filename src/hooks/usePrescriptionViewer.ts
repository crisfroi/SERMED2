// @ts-nocheck
// ============================================================================
// usePrescriptionViewer.ts - Prescription Management Hook
// ASIS 10.0 - Regímenes de Medicación - Hito 3
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Prescription {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  unit: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  prescriber: string;
  indication: string;
  refillsRemaining: number;
  refillRequests: boolean;
  notes?: string;
  lastRefillDate?: string;
}

export const usePrescriptionViewer = (patientId: string, medicationId?: string) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Fetch prescriptions
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('prescriptions')
        .select(
          `
          id,
          medication_id,
          medications(name),
          dose,
          unit,
          frequency,
          start_date,
          end_date,
          status,
          prescriber,
          indication,
          refills_remaining,
          refill_requests,
          notes,
          last_refill_date
        `
        )
        .eq('patient_id', patientId);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data, error: err } = await query.order('start_date', { ascending: false });

      if (err) throw err;

      const formatted: Prescription[] = (data || []).map((p: any) => ({
        id: p.id,
        medicationId: p.medication_id,
        medicationName: p.medications?.name || 'Unknown',
        dose: p.dose,
        unit: p.unit,
        frequency: p.frequency,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        prescriber: p.prescriber,
        indication: p.indication,
        refillsRemaining: p.refills_remaining,
        refillRequests: p.refill_requests,
        notes: p.notes,
        lastRefillDate: p.last_refill_date,
      }));

      setPrescriptions(formatted);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, medicationId, supabase]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Request refill
  const requestRefill = useCallback(
    async (prescriptionId: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase.rpc('request_prescription_refill', {
          prescription_id: prescriptionId,
        });

        if (err) throw err;

        // Update local state
        setPrescriptions((prev) =>
          prev.map((p) =>
            p.id === prescriptionId
              ? {
                  ...p,
                  lastRefillDate: new Date().toISOString(),
                  refillsRemaining: Math.max(0, p.refillsRemaining - 1),
                }
              : p
          )
        );

        return true;
      } catch (err: any) {
        setError(err.message);
        console.error('Error requesting refill:', err);
        return false;
      }
    },
    [supabase]
  );

  // Print prescription
  const printPrescription = useCallback(async (prescriptionId: string) => {
    try {
      const prescription = prescriptions.find((p) => p.id === prescriptionId);
      if (!prescription) return;

      const printContent = `
        PRESCRIPCIÓN
        ================================
        Medicamento: ${prescription.medicationName}
        Dosis: ${prescription.dose} ${prescription.unit}
        Frecuencia: ${prescription.frequency}
        Indicación: ${prescription.indication}
        Prescriptor: ${prescription.prescriber}
        Recargas disponibles: ${prescription.refillsRemaining}
        ================================
        Fecha: ${new Date().toLocaleDateString('es-ES')}
      `;

      // Create iframe for printing
      const printWindow = window.open('', '', 'width=600,height=700');
      if (printWindow) {
        printWindow.document.write('<pre>' + printContent + '</pre>');
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      console.error('Error printing prescription:', err);
    }
  }, [prescriptions]);

  // Export prescription data
  const exportPrescription = useCallback(
    async (prescriptionId: string) => {
      try {
        const prescription = prescriptions.find((p) => p.id === prescriptionId);
        if (!prescription) return;

        const data = {
          ...prescription,
          exportedAt: new Date().toISOString(),
        };

        const element = document.createElement('a');
        element.setAttribute(
          'href',
          'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
        );
        element.setAttribute('download', `prescription-${prescriptionId}.json`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } catch (err) {
        console.error('Error exporting prescription:', err);
      }
    },
    [prescriptions]
  );

  // Get prescription statistics
  const getStatistics = useCallback(() => {
    return {
      total: prescriptions.length,
      active: prescriptions.filter((p) => p.status === 'active').length,
      completed: prescriptions.filter((p) => p.status === 'completed').length,
      cancelled: prescriptions.filter((p) => p.status === 'cancelled').length,
      pending: prescriptions.filter((p) => p.status === 'pending').length,
      totalRefillsRemaining: prescriptions.reduce((sum, p) => sum + p.refillsRemaining, 0),
    };
  }, [prescriptions]);

  return {
    prescriptions,
    loading,
    error,
    requestRefill,
    printPrescription,
    exportPrescription,
    getStatistics,
    refetchPrescriptions: fetchPrescriptions,
  };
};
