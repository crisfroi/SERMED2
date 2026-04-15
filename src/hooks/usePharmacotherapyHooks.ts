// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

// Hook for managing prescriptions
export const usePrescriptionManagement = (patientId: string) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('patient_prescriptions')
        .select('*, medication_master(*)')
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false });

      if (err) throw err;
      setPrescriptions(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching prescriptions');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPrescription = useCallback(async (prescriptionData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('patient_prescriptions')
        .insert([{
          ...prescriptionData,
          patient_id: patientId,
          status: 'active',
          prescription_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (err) throw err;
      setPrescriptions(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error creating prescription');
      throw err;
    }
  }, [patientId]);

  const updatePrescriptionStatus = useCallback(async (prescriptionId: string, status: string, reason?: string) => {
    try {
      const { data, error: err } = await supabase
        .from('patient_prescriptions')
        .update({
          status,
          discontinuation_reason: reason || null,
          discontinuation_date: status === 'discontinued' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescriptionId)
        .select()
        .single();

      if (err) throw err;
      setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? data : p));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error updating prescription status');
      throw err;
    }
  }, []);

  const getActivePrescriptions = useCallback(() => {
    return prescriptions.filter(p => p.status === 'active');
  }, [prescriptions]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  return {
    prescriptions,
    loading,
    error,
    createPrescription,
    updatePrescriptionStatus,
    getActivePrescriptions,
    refetch: fetchPrescriptions
  };
};

// Hook for checking drug interactions
export const useDrugInteractionCheck = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInteractions = useCallback(async (medicationIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('medication_interactions')
        .select('*')
        .or(
          medicationIds
            .map((id, idx) => {
              const otherIds = medicationIds.filter((_, i) => i !== idx);
              return `medication_1_id.eq.${id},medication_2_id.in.(${otherIds.join(',')})`;
            })
            .join(';')
        );

      if (err) throw err;
      setInteractions(data || []);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error checking interactions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getMajorInteractions = useCallback(() => {
    return interactions.filter(i => i.interaction_severity === 'major');
  }, [interactions]);

  const getContraindicatedInteractions = useCallback(() => {
    return interactions.filter(i => i.interaction_severity === 'contraindicated');
  }, [interactions]);

  return {
    interactions,
    loading,
    error,
    checkInteractions,
    getMajorInteractions,
    getContraindicatedInteractions
  };
};

// Hook for tracking medication adherence
export const useMedicationAdherence = (patientId: string) => {
  const [adherenceRecords, setAdherenceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdherence = useCallback(async (prescriptionId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('medication_adherence')
        .select('*');

      if (prescriptionId) {
        query = query.eq('prescription_id', prescriptionId);
      } else {
        query = query
          .select(`
            *,
            prescription_id(patient_id)
          `)
          .eq('prescription_id.patient_id', patientId);
      }

      const { data, error: err } = await query
        .order('assessment_date', { ascending: false });

      if (err) throw err;
      setAdherenceRecords(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching adherence records');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const recordAdherence = useCallback(async (prescriptionId: string, adherenceData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('medication_adherence')
        .insert([{
          ...adherenceData,
          prescription_id: prescriptionId,
          assessment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (err) throw err;
      setAdherenceRecords(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error recording adherence');
      throw err;
    }
  }, []);

  const getAverageAdherence = useCallback((prescriptionId: string) => {
    const records = adherenceRecords.filter(r => r.prescription_id === prescriptionId);
    if (records.length === 0) return 0;
    const total = records.reduce((sum, r) => sum + r.adherence_percentage, 0);
    return Math.round(total / records.length);
  }, [adherenceRecords]);

  const getAdherenceTrend = useCallback((prescriptionId: string) => {
    const records = adherenceRecords
      .filter(r => r.prescription_id === prescriptionId)
      .sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime());

    if (records.length < 2) return 'stable';

    const first = records[0].adherence_percentage;
    const last = records[records.length - 1].adherence_percentage;
    const change = last - first;

    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }, [adherenceRecords]);

  useEffect(() => {
    fetchAdherence();
  }, [fetchAdherence]);

  return {
    adherenceRecords,
    loading,
    error,
    recordAdherence,
    getAverageAdherence,
    getAdherenceTrend,
    refetch: fetchAdherence
  };
};

// Hook for managing adverse medication events
export const useAdverseMedicationEvents = (patientId: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('adverse_medication_events')
        .select('*, medication_master(*)')
        .eq('patient_id', patientId)
        .order('event_date', { ascending: false });

      if (err) throw err;
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching adverse events');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const reportEvent = useCallback(async (eventData: any) => {
    try {
      const { data, error: err } = await supabase
        .from('adverse_medication_events')
        .insert([{
          ...eventData,
          patient_id: patientId,
          event_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (err) throw err;
      setEvents(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error reporting adverse event');
      throw err;
    }
  }, [patientId]);

  const updateEventOutcome = useCallback(async (eventId: string, outcome: string) => {
    try {
      const { data, error: err } = await supabase
        .from('adverse_medication_events')
        .update({
          outcome,
          outcome_date: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (err) throw err;
      setEvents(prev => prev.map(e => e.id === eventId ? data : e));
      return data;
    } catch (err: any) {
      setError(err.message || 'Error updating event outcome');
      throw err;
    }
  }, []);

  const getSevereEvents = useCallback(() => {
    return events.filter(e => ['severe', 'life_threatening'].includes(e.severity));
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    reportEvent,
    updateEventOutcome,
    getSevereEvents,
    refetch: fetchEvents
  };
};
