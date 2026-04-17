// ============================================================================
// useImagingOrder Hook - Imaging Order Management
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@hosix/hooks/shared/useAuth';

interface Modality {
  id: string;
  name: string;
  code: string;
  radiation_dose: number | null;
}

interface StudyType {
  id: string;
  name: string;
  modality_id: string;
  body_part: string;
  clinical_indication_examples: string;
}

export const useImagingOrder = () => {
  const { user } = useAuth();
  const [availableModalities, setAvailableModalities] = useState<Modality[]>([]);
  const [availableStudyTypes, setAvailableStudyTypes] = useState<StudyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModalities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('imaging_modalities')
        .select('id, modality_name, modality_code, radiation_dose')
        .eq('enabled', true)
        .order('modality_name', { ascending: true });

      if (queryError) throw queryError;

      setAvailableModalities(
        (data || []).map((mod) => ({
          id: mod.id,
          name: mod.modality_name,
          code: mod.modality_code,
          radiation_dose: mod.radiation_dose,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching modalities');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudyTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('imaging_study_types')
        .select(
          'id, study_name, modality_id, body_part, clinical_indication_examples'
        )
        .eq('enabled', true)
        .order('study_name', { ascending: true });

      if (queryError) throw queryError;

      setAvailableStudyTypes(
        (data || []).map((st) => ({
          id: st.id,
          name: st.study_name,
          modality_id: st.modality_id,
          body_part: st.body_part,
          clinical_indication_examples: st.clinical_indication_examples,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching study types');
    } finally {
      setLoading(false);
    }
  }, []);

  const getStudyTypesForModality = useCallback(
    (modalityId: string) => {
      return availableStudyTypes.filter((st) => st.modality_id === modalityId);
    },
    [availableStudyTypes]
  );

  const createOrder = useCallback(
    async (
      patientId: string,
      studyTypeId: string,
      clinicalIndication: string,
      options?: {
        priority?: 'normal' | 'urgent' | 'stat';
        contrastAllergy?: 'unknown' | 'no_allergy' | 'allergy' | 'severe_allergy';
        contrastAllergyNotes?: string;
        needsContrast?: boolean;
        insuranceAuthNumber?: string;
        requestedForDate?: Date;
      }
    ) => {
      if (!user) throw new Error('User not authenticated');

      setLoading(true);
      setError(null);

      try {
        // Get modality ID from study type
        const studyType = availableStudyTypes.find((st) => st.id === studyTypeId);
        if (!studyType) throw new Error('Study type not found');

        const { data, error: orderError } = await supabase
          .from('imaging_orders')
          .insert([
            {
              patient_id: patientId,
              ordered_by_provider_id: user.id,
              study_type_id: studyTypeId,
              modality_id: studyType.modality_id,
              clinical_indication: clinicalIndication,
              priority: options?.priority || 'normal',
              status: 'pending',
              contrast_allergy_status: options?.contrastAllergy || 'unknown',
              contrast_allergy_notes: options?.contrastAllergyNotes,
              insurance_authorization_number: options?.insuranceAuthNumber,
              requested_for_date: options?.requestedForDate
                ?.toISOString()
                .split('T')[0],
            },
          ])
          .select('id')
          .single();

        if (orderError) throw orderError;

        return data.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating order';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, availableStudyTypes]
  );

  return {
    availableModalities,
    availableStudyTypes,
    loading,
    error,
    fetchModalities,
    fetchStudyTypes,
    getStudyTypesForModality,
    createOrder,
  };
};

export default useImagingOrder;
