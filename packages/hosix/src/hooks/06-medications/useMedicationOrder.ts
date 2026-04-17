// ============================================================================
// useMedicationOrder.ts - Medication Order Management Hook
// ASIS 10.0 - Regímenes de Medicación - Hito 3
// ============================================================================

import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface MedicationOrderData {
  patient_id: string;
  medications: string[];
  dose: string;
  unit: string;
  frequency: string;
  duration: number;
  indication: string;
  special_instructions?: string;
  refills: number;
}

interface MedicationOrderResult {
  id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  medications: any[];
  interactions: any[];
}

export const useMedicationOrder = (patientId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Get available medications
  const selectMedications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('medications')
        .select('*')
        .eq('active', true)
        .order('name');

      if (err) throw err;
      setMedications(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check for drug interactions
  const validateInteractions = useCallback(
    async (medicationIds: string[]) => {
      try {
        setLoading(true);
        setError(null);

        // Call Supabase function to check interactions
        const { data, error: err } = await supabase.rpc(
          'check_medication_interactions',
          {
            medication_ids: medicationIds,
          }
        );

        if (err) throw err;
        setInteractions(data || []);
        return data || [];
      } catch (err: any) {
        setError(err.message);
        console.error('Error checking interactions:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Create medication order
  const createOrder = useCallback(
    async (orderData: MedicationOrderData): Promise<MedicationOrderResult | null> => {
      try {
        setLoading(true);
        setError(null);

        // Validate order
        if (!orderData.medications || orderData.medications.length === 0) {
          throw new Error('At least one medication must be selected');
        }

        // Check interactions
        const foundInteractions = await validateInteractions(orderData.medications);
        const criticalCount = foundInteractions.filter((i: any) => i.severity === 'critical')
          .length;

        if (criticalCount > 0) {
          throw new Error(
            `${criticalCount} critical interaction(s) detected. Please review with prescriber.`
          );
        }

        // Insert order
        const { data, error: err } = await supabase
          .from('medication_orders')
          .insert({
            patient_id: patientId,
            medications: orderData.medications,
            dose: orderData.dose,
            unit: orderData.unit,
            frequency: orderData.frequency,
            duration_days: orderData.duration,
            indication: orderData.indication,
            special_instructions: orderData.special_instructions,
            refills: orderData.refills,
            status: 'pending',
          })
          .select()
          .single();

        if (err) throw err;

        return {
          id: data.id,
          created_at: data.created_at,
          status: data.status,
          medications: orderData.medications,
          interactions: foundInteractions,
        };
      } catch (err: any) {
        setError(err.message);
        console.error('Error creating order:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [patientId, validateInteractions, supabase]
  );

  // Get allergy history
  const checkAllergies = useCallback(async (): Promise<any[]> => {
    try {
      const { data, error: err } = await supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', patientId)
        .eq('active', true);

      if (err) throw err;
      return data || [];
    } catch (err) {
      console.error('Error fetching allergies:', err);
      return [];
    }
  }, [patientId, supabase]);

  return {
    selectMedications,
    validateInteractions,
    createOrder,
    checkAllergies,
    medications,
    interactions,
    loading,
    error,
  };
};
