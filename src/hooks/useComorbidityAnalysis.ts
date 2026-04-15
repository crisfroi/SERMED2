import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useComorbidityAnalysis = (patientId: string) => {
  const [comorbidities, setComorbidities] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeComorbidities = async () => {
      try {
        const { data: diagnoses, error: diagErr } = await supabase
          .from('diagnoses')
          .select('icd10_code')
          .eq('patient_id', patientId)
          .eq('status', 'active');

        if (diagErr) throw diagErr;

        // Calculate risk score based on active diagnoses
        let score = 0;
        const comorbList = diagnoses || [];
        
        if (comorbList.length > 2) score += 10;
        if (comorbList.length > 5) score += 20;

        setComorbidities(comorbList);
        setRiskScore(Math.min(score, 100));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) analyzeComorbidities();
  }, [patientId]);

  return { comorbidities, riskScore, loading, error };
};
