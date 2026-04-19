import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

interface QueueItem {
  id: string;
  patient_id: string;
  status: 'waiting' | 'called' | 'served' | 'cancelled';
  admission_time: string;
  estimated_wait_time: number;
}

export const useQueueManagement = (roomId?: string) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        let query = supabase
          .from('waiting_queue')
          .select('id, patient_id, status, admission_time, estimated_wait_time')
          .eq('status', 'waiting');

        if (roomId) {
          query = query.eq('room_id', roomId);
        }

        const { data, error: queryErr } = await query;
        if (queryErr) throw queryErr;
        setQueue(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [roomId]);

  const callPatient = useCallback(async (patientId: string) => {
    try {
      const { error: updateErr } = await supabase
        .from('waiting_queue')
        .update({ status: 'called' })
        .eq('patient_id', patientId);

      if (updateErr) throw updateErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calling patient');
    }
  }, []);

  return { queue, loading, error, callPatient };
};

