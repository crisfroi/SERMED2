import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

interface Specialist {
  id: string;
  medical_specialty: string;
  availability_status: string;
  response_time_avg_hours: number;
}

export const useReferralSpecialist = (specialty?: string) => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        let query = supabase
          .from('specialists')
          .select('id, specialty, availability_status, avg_response_time');

        if (specialty) {
          query = query.eq('specialty', specialty);
        }

        const { data, error: queryErr } = await query;
        if (queryErr) throw queryErr;
        setSpecialists(data as any || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
  }, [specialty]);

  const sendReferral = useCallback(async (patientId: string, specialistId: string, reason: string) => {
    try {
      const { error: insertErr } = await supabase
        .from('referrals')
        .insert([{ patient_id: patientId, specialist_id: specialistId, reason, status: 'pending' }]);

      if (insertErr) throw insertErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending referral');
    }
  }, []);

  return { specialists, loading, error, sendReferral };
};

