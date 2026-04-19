import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================
export interface ICUAdmission {
  id: string;
  inpatient_admission_id: string;
  icu_admission_date: string;
  icu_type: 'general' | 'surgical' | 'cardiac' | 'respiratory' | 'neonatal';
  severity_score: number; // APACHE II o SOFA
  reason_for_icu: string;
  mechanical_ventilation: boolean;
  vasopressor_support: boolean;
  status: 'active' | 'improvement' | 'deterioration' | 'discharged';
  discharge_date?: string;
}

export interface VitalSignsMonitoring {
  id: string;
  icu_admission_id: string;
  monitoring_time: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  body_temperature: number;
  glasgow_coma_scale?: number;
  notes?: string;
}

export interface MechanicalVentilationSettings {
  id: string;
  icu_admission_id: string;
  ventilation_mode: 'AC/VC' | 'SIMV' | 'CPAP' | 'BiPAP' | 'PSV';
  fio2_percentage: number;
  tidal_volume: number;
  respiratory_rate: number;
  peep: number;
  set_date: string;
  provider_id: string;
}

export const useICUManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admit to ICU
  const admitToICU = useCallback(
    async (icuData: Partial<ICUAdmission>): Promise<ICUAdmission | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('icu_admissions')
          .insert({
            ...icuData,
            icu_admission_date: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (err) throw err;

        // Log audit trail
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'icu_admission',
          entity_id: data.id,
          action: 'create',
          changed_by: 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Patient admitted to ICU. Type: ${icuData.icu_type}. Severity: ${icuData.severity_score}`,
          severity: 'high',
        });

        return data as ICUAdmission;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to admit to ICU';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Record vital signs
  const recordVitalSigns = useCallback(
    async (vitalData: Partial<VitalSignsMonitoring>): Promise<VitalSignsMonitoring | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: err } = await supabase
          .from('icu_vital_signs')
          .insert({
            ...vitalData,
            monitoring_time: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        // Check for abnormal values and log alerts
        const alerts = [];
        if (vitalData.heart_rate && (vitalData.heart_rate < 60 || vitalData.heart_rate > 100)) {
          alerts.push(`Abnormal HR: ${vitalData.heart_rate}`);
        }
        if (vitalData.oxygen_saturation && vitalData.oxygen_saturation < 95) {
          alerts.push(`Low O2 saturation: ${vitalData.oxygen_saturation}%`);
        }
        if (alerts.length > 0) {
          await supabase.from('ehr_audit_trail').insert({
            entity_type: 'icu_vital_signs',
            entity_id: data.id,
            action: 'alert',
            changed_by: 'system',
            changed_at: new Date().toISOString(),
            ip_address: '0.0.0.0',
            description: alerts.join('; '),
            severity: 'high',
          });
        }

        return data as VitalSignsMonitoring;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record vital signs';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update ventilation settings
  const updateVentilationSettings = useCallback(
    async (ventData: Partial<MechanicalVentilationSettings>): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: err } = await supabase
          .from('icu_ventilation_settings')
          .insert({
            ...ventData,
            set_date: new Date().toISOString(),
          });

        if (err) throw err;

        // Log change
        await supabase.from('ehr_audit_trail').insert({
          entity_type: 'icu_ventilation',
          entity_id: ventData.icu_admission_id || 'unknown',
          action: 'update',
          changed_by: ventData.provider_id || 'system',
          changed_at: new Date().toISOString(),
          ip_address: '0.0.0.0',
          description: `Ventilation settings updated. Mode: ${ventData.ventilation_mode}, FiO2: ${ventData.fio2_percentage}%, PEEP: ${ventData.peep}`,
          severity: 'medium',
        });

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update ventilation';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get ICU patient vital trends
  const getVitalTrends = useCallback(
    async (icuAdmissionId: string, hoursBack = 24): Promise<VitalSignsMonitoring[]> => {
      try {
        setLoading(true);
        setError(null);

        const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

        const { data, error: err } = await supabase
          .from('icu_vital_signs')
          .select('*')
          .eq('icu_admission_id', icuAdmissionId)
          .gte('monitoring_time', startTime)
          .order('monitoring_time', { ascending: true });

        if (err) throw err;

        return (data || []) as VitalSignsMonitoring[];
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get vital trends';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Calculate severity score (simplified SOFA)
  const calculateSeverityScore = useCallback(
    (vitalSigns: Partial<VitalSignsMonitoring>): number => {
      let score = 0;

      // Respiratory component (O2 sat)
      if (vitalSigns.oxygen_saturation && vitalSigns.oxygen_saturation < 90) score += 4;
      else if (vitalSigns.oxygen_saturation && vitalSigns.oxygen_saturation < 95) score += 2;

      // Cardiovascular (MAP)
      if (vitalSigns.systolic_bp && vitalSigns.systolic_bp < 70) score += 4;
      else if (vitalSigns.systolic_bp && vitalSigns.systolic_bp < 100) score += 2;

      // CNS (GCS)
      if (vitalSigns.glasgow_coma_scale) {
        if (vitalSigns.glasgow_coma_scale < 6) score += 4;
        else if (vitalSigns.glasgow_coma_scale < 10) score += 2;
      }

      return score;
    },
    []
  );

  return {
    loading,
    error,
    admitToICU,
    recordVitalSigns,
    updateVentilationSettings,
    getVitalTrends,
    calculateSeverityScore,
  };
};

