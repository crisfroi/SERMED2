import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface EmergencyCall {
  call_id: string;
  caller_type: 'patient' | 'family' | 'bystander' | 'police' | 'fire';
  call_time: string;
  location_address: string;
  location_lat?: number;
  location_lon?: number;
  chief_complaint: string;
  severity_level: 'non_emergency' | 'urgent' | 'emergent' | 'critical';
  call_duration_seconds?: number;
  notes?: string;
}

export interface AmbulanceDispatch {
  dispatch_id: string;
  call_id: string;
  ambulance_id: string;
  dispatch_time: string;
  vehicle_type: 'basic_support' | 'advanced_support' | 'critical_care' | 'specialized';
  crew_size: number;
  estimated_eta_minutes?: number;
  actual_arrival_time?: string;
  transport_to_facility_id: string;
  status: 'dispatched' | 'en_route' | 'on_scene' | 'transporting' | 'arrived' | 'cancelled';
}

export interface PatientEncounter {
  encounter_id: string;
  ambulance_id: string;
  patient_name?: string;
  patient_id?: string;
  age_years?: number;
  gender?: 'M' | 'F' | 'O' | 'U';
  encounter_time: string;
  chief_complaint: string;
  vital_signs: {
    heart_rate: number;
    respiratory_rate: number;
    systolic_bp: number;
    diastolic_bp: number;
    oxygen_saturation: number;
    temperature_c: number;
  };
  gcs_score?: number;
  injury_mechanism?: string;
  trauma_type?: 'blunt' | 'penetrating' | 'burn' | 'none';
  interventions_provided: string[];
  medications_administered: Array<{
    medication: string;
    dose: string;
    route: string;
    time: string;
  }>;
  severity_index: 'non_urgent' | 'less_urgent' | 'urgent' | 'emergent' | 'immediate';
}

export interface EmergencyFacility {
  facility_id: string;
  facility_name: string;
  facility_type: 'primary' | 'secondary' | 'tertiary' | 'specialty';
  has_trauma_center: boolean;
  has_cardiac_cath_lab: boolean;
  has_stroke_center: boolean;
  bed_available_count: number;
  icu_bed_count: number;
  trauma_surgeons_available: boolean;
  average_door_to_doctor_minutes?: number;
  distance_km?: number;
}

export const useEMS = () => {
  const logEmergencyCall = async (
    callData: Omit<EmergencyCall, 'call_id'>
  ): Promise<EmergencyCall | null> => {
    try {
      const call: EmergencyCall = {
        call_id: `CALL-${Date.now()}`,
        ...callData,
      };

      const { data, error } = await supabase.from('ems_emergency_calls').insert([call]).select();

      if (error) throw error;

      // Log to audit trail
      const severityMap = {
        non_emergency: 'low',
        urgent: 'medium',
        emergent: 'high',
        critical: 'high',
      };

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'emergency_call_logged',
          table_name: 'ems_emergency_calls',
          record_id: data?.[0]?.call_id,
          patient_id: null,
          details: `Emergency call: ${callData.chief_complaint} - Severity: ${callData.severity_level}`,
          severity: severityMap[callData.severity_level] || 'medium',
        },
      ]);

      return data?.[0] || call;
    } catch (error) {
      console.error('Error logging emergency call:', error);
      return null;
    }
  };

  const dispatchAmbulance = async (
    dispatchData: Omit<AmbulanceDispatch, 'dispatch_id' | 'dispatch_time'>
  ): Promise<AmbulanceDispatch | null> => {
    try {
      const dispatch: AmbulanceDispatch = {
        dispatch_id: `DISP-${Date.now()}`,
        dispatch_time: new Date().toISOString(),
        ...dispatchData,
      };

      const { data, error } = await supabase.from('ems_ambulance_dispatch').insert([dispatch]).select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'ambulance_dispatched',
          table_name: 'ems_ambulance_dispatch',
          record_id: data?.[0]?.dispatch_id,
          patient_id: null,
          details: `Ambulance dispatched: ${dispatchData.vehicle_type} (${dispatchData.ambulance_id})`,
          severity: 'high',
        },
      ]);

      return data?.[0] || dispatch;
    } catch (error) {
      console.error('Error dispatching ambulance:', error);
      return null;
    }
  };

  const recordPatientEncounter = async (
    encounterData: Omit<PatientEncounter, 'encounter_id'>
  ): Promise<PatientEncounter | null> => {
    try {
      const encounter: PatientEncounter = {
        encounter_id: `ENC-${Date.now()}`,
        ...encounterData,
      };

      const { data, error } = await supabase.from('ems_patient_encounters').insert([encounter]).select();

      if (error) throw error;

      // Determine severity level for audit trail
      const gcsIndicator = encounterData.gcs_score ? encounterData.gcs_score < 15 : false;
      const hemodynamicIssue =
        encounterData.vital_signs.systolic_bp < 90 || encounterData.vital_signs.heart_rate > 120;
      const hypoxia = encounterData.vital_signs.oxygen_saturation < 90;

      const isHighRisk = gcsIndicator || hemodynamicIssue || hypoxia;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'build_encounter_recorded',
          table_name: 'ems_patient_encounters',
          record_id: data?.[0]?.encounter_id,
          patient_id: encounterData.patient_id || null,
          details: `EMS encounter: ${encounterData.chief_complaint} - Severity: ${encounterData.severity_index}`,
          severity: isHighRisk ? 'high' : 'medium',
        },
      ]);

      return data?.[0] || encounter;
    } catch (error) {
      console.error('Error recording patient encounter:', error);
      return null;
    }
  };

  const findOptimalFacility = async (patientEncounter: PatientEncounter) => {
    try {
      // Determine facility needs based on encounter severity
      const needsTraumaCenter =
        patientEncounter.trauma_type && patientEncounter.trauma_type !== 'none';
      const needsCardiacCath =
        patientEncounter.chief_complaint.toLowerCase().includes('chest') ||
        patientEncounter.chief_complaint.toLowerCase().includes('cardiac');
      const needsStrokeCenter =
        patientEncounter.chief_complaint.toLowerCase().includes('stroke') ||
        patientEncounter.chief_complaint.toLowerCase().includes('neuro');

      // Fetch available facilities
      const { data: facilities, error } = await supabase
        .from('ems_emergency_facilities')
        .select('*')
        .eq('bed_available_count', '>', 0);

      if (error) throw error;

      // Score and rank facilities
      const rankedFacilities = (facilities || [])
        .map((facility: EmergencyFacility) => {
          let score = 0;

          if (needsTraumaCenter && facility.has_trauma_center) score += 10;
          if (needsCardiacCath && facility.has_cardiac_cath_lab) score += 10;
          if (needsStrokeCenter && facility.has_stroke_center) score += 10;

          // Prefer closer facilities
          if (facility.distance_km) {
            score += Math.max(0, 10 - facility.distance_km / 5);
          }

          // Prefer higher level trauma centers for severe trauma
          if (needsTraumaCenter && facility.facility_type === 'tertiary') {
            score += 5;
          }

          return {
            ...facility,
            matchScore: score,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return {
        optimalFacility: rankedFacilities[0],
        alternativeFacilities: rankedFacilities.slice(1, 3),
        eta_minutes: rankedFacilities[0]?.average_door_to_doctor_minutes || 15,
      };
    } catch (error) {
      console.error('Error finding optimal facility:', error);
      return null;
    }
  };

  const getEMSResponseMetrics = async (timeRangeHours: number = 24) => {
    try {
      const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

      const { data: calls, error: callError } = await supabase
        .from('ems_emergency_calls')
        .select('*')
        .gte('call_time', startTime);

      const { data: dispatches, error: dispatchError } = await supabase
        .from('ems_ambulance_dispatch')
        .select('*')
        .gte('dispatch_time', startTime);

      if (callError || dispatchError) throw callError || dispatchError;

      const totalCalls = calls?.length || 0;
      const criticalCount = calls?.filter((c) => c.severity_level === 'critical').length || 0;
      const emergentCount = calls?.filter((c) => c.severity_level === 'emergent').length || 0;

      // Calculate response times
      const responseTimes: number[] = [];
      dispatches?.forEach((dispatch: AmbulanceDispatch) => {
        if (dispatch.actual_arrival_time) {
          const dispatchTime = new Date(dispatch.dispatch_time).getTime();
          const arrivalTime = new Date(dispatch.actual_arrival_time).getTime();
          responseTimes.push((arrivalTime - dispatchTime) / (1000 * 60)); // minutes
        }
      });

      const avgResponseTime =
        responseTimes.length > 0
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) /
            10
          : 0;

      return {
        reportPeriodHours: timeRangeHours,
        totalCalls,
        criticalCalls: criticalCount,
        emergentCalls: emergentCount,
        dispatchedAmbulances: dispatches?.length || 0,
        averageResponseTimeMinutes: avgResponseTime,
        callsPerHour: Math.round((totalCalls / timeRangeHours) * 10) / 10,
        coverage: {
          criticalPercentage: ((criticalCount / totalCalls) * 100).toFixed(1),
          emergentPercentage: ((emergentCount / totalCalls) * 100).toFixed(1),
        },
      };
    } catch (error) {
      console.error('Error getting EMS metrics:', error);
      return null;
    }
  };

  return {
    logEmergencyCall,
    dispatchAmbulance,
    recordPatientEncounter,
    findOptimalFacility,
    getEMSResponseMetrics,
  };
};
