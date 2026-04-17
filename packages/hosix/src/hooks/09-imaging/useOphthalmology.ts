import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface EyeExamination {
  patient_id: string;
  exam_date: string;
  eye_side: 'OD' | 'OS' | 'OU'; // Right, Left, Both
  visual_acuity: string; // e.g., "20/20", "6/6"
  intraocular_pressure_mmhg?: number;
  sphere_diopters?: number;
  cylinder_diopters?: number;
  axis_degrees?: number;
  visual_field_status: 'normal' | 'restricted' | 'defect' | 'glaucoma_suspect';
  ocular_media: 'clear' | 'moderate_cataract' | 'dense_cataract' | 'other';
  retinal_findings: string[];
  optic_disc_status: 'normal' | 'pale' | 'cupped' | 'atrophic' | 'edematous';
  diagnosis: string[];
  referral_needed: boolean;
  referral_reason?: string;
}

export interface Eyeglass Prescription {
  patient_id: string;
  prescription_date: string;
  valid_until: string;
  visual_acuity_target: string;
  od_sphere: number;
  od_cylinder: number;
  od_axis: number;
  od_prism?: number;
  od_base?: string;
  os_sphere: number;
  os_cylinder: number;
  os_axis: number;
  os_prism?: number;
  os_base?: string;
  add_power?: number; // For bifocals
  pupillary_distance_mm?: number;
  frame_type: 'single_vision' | 'bifocal' | 'progressive' | 'contact_lens';
  notes?: string;
}

export interface OcularDisease {
  patient_id: string;
  disease_type:
    | 'refractive_error'
    | 'cataract'
    | 'glaucoma'
    | 'diabetic_retinopathy'
    | 'age_macular_degeneration'
    | 'retinal_detachment'
    | 'keratoconus'
    | 'other';
  diagnosis_date: string;
  severity: 'mild' | 'moderate' | 'severe' | 'legally_blind';
  treatment_plan: string;
  follow_up_interval_months: number;
  last_follow_up?: string;
}

export const useOphthalmology = () => {
  const recordEyeExamination = async (
    exam: Omit<EyeExamination, 'id'>
  ): Promise<EyeExamination | null> => {
    try {
      // Determine if referral is needed based on findings
      const needsReferral =
        exam.visual_acuity !== '20/20' ||
        (exam.intraocular_pressure_mmhg && exam.intraocular_pressure_mmhg > 21) ||
        exam.visual_field_status !== 'normal' ||
        exam.optic_disc_status !== 'normal' ||
        exam.referral_needed;

      const examination: EyeExamination = {
        ...exam,
        referral_needed: needsReferral,
      };

      const { data, error } = await supabase
        .from('ophthalmology_eye_examinations')
        .insert([examination])
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'record_eye_examination',
          table_name: 'ophthalmology_eye_examinations',
          record_id: data?.[0]?.id,
          patient_id: exam.patient_id,
          details: `Eye exam: ${exam.eye_side} - VA ${exam.visual_acuity}${needsReferral ? ' - REFERRAL NEEDED' : ''}`,
          severity: needsReferral ? 'high' : 'low',
        },
      ]);

      return data?.[0] || examination;
    } catch (error) {
      console.error('Error recording eye examination:', error);
      return null;
    }
  };

  const prescribeEyeglasses = async (
    prescription: Omit<Eyeglass Prescription, 'id'>
  ): Promise<Eyeglass Prescription | null> => {
    try {
      // Validate refraction values
      const isValidRefraction =
        prescription.od_sphere !== undefined &&
        prescription.os_sphere !== undefined &&
        prescription.od_cylinder !== undefined &&
        prescription.os_cylinder !== undefined;

      if (!isValidRefraction) {
        throw new Error('Invalid refraction values');
      }

      const { data, error } = await supabase
        .from('ophthalmology_eyeglass_prescriptions')
        .insert([prescription])
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'create_eyeglass_prescription',
          table_name: 'ophthalmology_eyeglass_prescriptions',
          record_id: data?.[0]?.id,
          patient_id: prescription.patient_id,
          details: `Eyeglass prescription: OD ${prescription.od_sphere}/${prescription.od_cylinder}x${prescription.od_axis}`,
          severity: 'low',
        },
      ]);

      return data?.[0] || null;
    } catch (error) {
      console.error('Error creating eyeglass prescription:', error);
      return null;
    }
  };

  const recordOcularDisease = async (
    disease: Omit<OcularDisease, 'id'>
  ): Promise<OcularDisease | null> => {
    try {
      const { data, error } = await supabase
        .from('ophthalmology_ocular_diseases')
        .insert([disease])
        .select();

      if (error) throw error;

      // Calculate severity multiplier for audit logging
      const severityMap = { mild: 'low', moderate: 'medium', severe: 'high', legally_blind: 'high' };

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'record_ocular_disease',
          table_name: 'ophthalmology_ocular_diseases',
          record_id: data?.[0]?.id,
          patient_id: disease.patient_id,
          details: `Ocular disease diagnosis: ${disease.disease_type} (${disease.severity})`,
          severity: severityMap[disease.severity] || 'medium',
        },
      ]);

      return data?.[0] || null;
    } catch (error) {
      console.error('Error recording ocular disease:', error);
      return null;
    }
  };

  const getOphthalmologyHistory = async (patientId: string) => {
    try {
      const { data: exams, error: examError } = await supabase
        .from('ophthalmology_eye_examinations')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false });

      const { data: prescriptions, error: prescError } = await supabase
        .from('ophthalmology_eyeglass_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false });

      const { data: diseases, error: diseaseError } = await supabase
        .from('ophthalmology_ocular_diseases')
        .select('*')
        .eq('patient_id', patientId)
        .order('diagnosis_date', { ascending: false });

      if (examError || prescError || diseaseError) {
        throw examError || prescError || diseaseError;
      }

      const lastExam = exams?.[0];
      const activePrescription = prescriptions?.find((p) => new Date(p.valid_until) > new Date());
      const activeDiseases = diseases?.filter(
        (d) => new Date(d.last_follow_up || d.diagnosis_date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );

      return {
        lastExamination: lastExam,
        currentPrescription: activePrescription,
        diagnoses: activeDiseases,
        needsFollowUp: activeDiseases?.some(
          (d) =>
            new Date(d.last_follow_up || d.diagnosis_date) <
            new Date(Date.now() - d.follow_up_interval_months * 30 * 24 * 60 * 60 * 1000)
        ),
        allExaminations: exams,
        allPrescriptions: prescriptions,
      };
    } catch (error) {
      console.error('Error getting ophthalmology history:', error);
      return null;
    }
  };

  const checkVisionRisk = async (patientId: string) => {
    try {
      const { data: diseases, error: diseaseError } = await supabase
        .from('ophthalmology_ocular_diseases')
        .select('*')
        .eq('patient_id', patientId);

      const { data: exams, error: examError } = await supabase
        .from('ophthalmology_eye_examinations')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false })
        .limit(1);

      if (diseaseError || examError) throw diseaseError || examError;

      const activeDisorders = diseases?.filter((d) => d.severity !== 'mild') || [];
      const lastExam = exams?.[0];

      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      const concerns: string[] = [];

      // Check for high-risk conditions
      activeDisorders.forEach((disorder) => {
        if (disorder.disease_type === 'glaucoma') {
          riskLevel = 'high';
          concerns.push(`🔴 Glaucoma: ${disorder.severity} - Requires urgent monitoring`);
        } else if (disorder.disease_type === 'diabetic_retinopathy') {
          riskLevel = 'high';
          concerns.push(
            `🔴 Diabetic retinopathy: ${disorder.severity} - High risk of vision loss`
          );
        } else if (disorder.disease_type === 'age_macular_degeneration') {
          riskLevel = 'high';
          concerns.push(
            `🟡 Age-related macular degeneration: ${disorder.severity} - Monitor closely`
          );
        }
      });

      // Check IOP if available
      if (lastExam?.intraocular_pressure_mmhg && lastExam.intraocular_pressure_mmhg > 21) {
        riskLevel = riskLevel === 'low' ? 'moderate' : riskLevel;
        concerns.push(`⚠️ Elevated IOP: ${lastExam.intraocular_pressure_mmhg} mmHg`);
      }

      return {
        riskLevel,
        activeDisorders: activeDisorders.length,
        concerns,
        recommendedAction:
          riskLevel === 'high' ? 'Urgent ophthalmology referral' : 'Regular monitoring',
      };
    } catch (error) {
      console.error('Error checking vision risk:', error);
      return null;
    }
  };

  return {
    recordEyeExamination,
    prescribeEyeglasses,
    recordOcularDisease,
    getOphthalmologyHistory,
    checkVisionRisk,
  };
};
