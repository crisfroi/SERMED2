import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

interface RiskFactors {
  maternal: string[];
  fetal: string[];
  obstetric: string[];
  complications: string[];
}

interface ObstetricRiskData {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskFactors: RiskFactors | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for calculating obstetric risk score
 * Calls Edge Function obstetric_risk_calculator
 */
export const useObstetricRisk = (pregnancyId: string): ObstetricRiskData => {
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'moderate' | 'high' | 'critical'>('low');
  const [riskFactors, setRiskFactors] = useState<RiskFactors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateRisk();
  }, [pregnancyId]);

  const calculateRisk = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Edge Function for risk calculation
      const { data, error: fnError } = await supabase.functions.invoke(
        'obstetric_risk_calculator',
        {
          body: { pregnancy_id: pregnancyId },
        }
      );

      if (fnError) throw fnError;

      setRiskScore(data.riskScore || 0);
      
      // Determine risk level
      if (data.riskScore < 20) {
        setRiskLevel('low');
      } else if (data.riskScore < 50) {
        setRiskLevel('moderate');
      } else if (data.riskScore < 80) {
        setRiskLevel('high');
      } else {
        setRiskLevel('critical');
      }

      setRiskFactors(data.riskFactors || {
        maternal: [],
        fetal: [],
        obstetric: [],
        complications: [],
      });
    } catch (err) {
      // Fallback: Minimal risk calculation if Edge Function fails
      console.warn('Edge Function failed, using fallback calculation:', err);
      
      try {
        // Fetch pregnancy data directly for basic calculation
        const { data: pregnancyData, error: fetchError } = await supabase
          .from('pregnancy')
          .select('*, patient(*)')
          .eq('id', pregnancyId)
          .single();

        if (fetchError) throw fetchError;

        // Basic risk calculation
        let score = 0;
        const factors: RiskFactors = {
          maternal: [],
          fetal: [],
          obstetric: [],
          complications: pregnancyData.complications || [],
        };

        // Age analysis
        if (pregnancyData.patient) {
          const birthDate = new Date(pregnancyData.patient.date_of_birth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          if (age < 18) {
            score += 10;
            factors.maternal.push('Edad materna <18 años');
          } else if (age > 35) {
            score += 15;
            factors.maternal.push('Edad materna avanzada (>35)');
          }
        }

        // Gestational age
        const gestAge = pregnancyData.gestational_age_weeks || 0;
        if (gestAge > 42 || gestAge < 8) {
          score += 10;
          factors.obstetric.push('Edad gestacional anormal');
        }

        // Risk level
        if (pregnancyData.risk_level > 0) {
          score += pregnancyData.risk_level / 2;
        }

        setRiskScore(score);
        
        if (score < 20) {
          setRiskLevel('low');
        } else if (score < 50) {
          setRiskLevel('moderate');
        } else if (score < 80) {
          setRiskLevel('high');
        } else {
          setRiskLevel('critical');
        }

        setRiskFactors(factors);
      } catch (fallbackErr) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Error calculating risk');
      }
    } finally {
      setLoading(false);
    }
  }, [pregnancyId]);

  return {
    riskScore,
    riskLevel,
    riskFactors,
    loading,
    error,
  };
};

export default useObstetricRisk;
