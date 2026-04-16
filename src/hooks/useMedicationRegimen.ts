import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface MedicationRegimen {
  id: string
  patient_id: string
  medication_id: string
  dosage_value: number
  dosage_unit: string
  frequency: 'OD' | 'BID' | 'TID' | 'QID' | 'HS' | 'AC' | 'PC' | 'SOS'
  frequency_description: string
  route: 'oral' | 'IV' | 'IM' | 'SC' | 'topical' | 'inhalation' | 'suppository' | 'other'
  start_date: string
  end_date: string | null
  indication: string
  contraindications: string | null
  special_instructions: string | null
  is_active: boolean
  prescriber_id: string
  prescribed_date: string
  created_at: string
  updated_at: string
}

export interface MedicationRegimenInput {
  patient_id: string
  medication_id: string
  dosage_value: number
  dosage_unit: string
  frequency: 'OD' | 'BID' | 'TID' | 'QID' | 'HS' | 'AC' | 'PC' | 'SOS'
  route: 'oral' | 'IV' | 'IM' | 'SC' | 'topical' | 'inhalation' | 'suppository' | 'other'
  indication: string
  duration_days: number
  contraindications?: string
  special_instructions?: string
}

const FREQUENCY_MAP: Record<string, string> = {
  OD: 'Una vez al día',
  BID: 'Dos veces al día',
  TID: 'Tres veces al día',
  QID: 'Cuatro veces al día',
  HS: 'Al acostarse',
  AC: 'Antes de comidas',
  PC: 'Después de comidas',
  SOS: 'Según sea necesario',
}

export function useMedicationRegimen() {
  const supabase = useSupabase()
  const [regimens, setRegimens] = useState<MedicationRegimen[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active regimens for a patient
  const fetchPatientRegimens = useCallback(
    async (patientId: string, includeInactive = false) => {
      setLoading(true)
      setError(null)

      try {
        const query = supabase
          .from('medication_regimens')
          .select('*, medications(*)')
          .eq('patient_id', patientId)

        if (!includeInactive) {
          query.eq('is_active', true)
        }

        const { data, error: err } = await query.order('prescribed_date', {
          ascending: false,
        })

        if (err) throw err

        setRegimens(data || [])
        return data || []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener regímenes'
        setError(message)
        console.error('useMedicationRegimen fetch error:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Create new regimen
  const createRegimen = useCallback(
    async (input: MedicationRegimenInput): Promise<MedicationRegimen | null> => {
      setError(null)

      try {
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + input.duration_days)

        const { data, error: err } = await supabase
          .from('medication_regimens')
          .insert([
            {
              ...input,
              end_date: endDate.toISOString().split('T')[0],
              frequency_description: FREQUENCY_MAP[input.frequency],
              is_active: true,
              prescribed_date: new Date().toISOString().split('T')[0],
              prescriber_id: null, // TODO: get from auth
            },
          ])
          .select()
          .single()

        if (err) throw err

        setRegimens((prev) => [data, ...prev])

        // Log prescription
        await supabase.from('medication_audit_trail').insert({
          regimen_id: data.id,
          action: 'PRESCRIBED',
          dosage: `${input.dosage_value} ${input.dosage_unit}`,
          frequency: FREQUENCY_MAP[input.frequency],
          route: input.route,
          indication: input.indication,
        })

        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear régimen'
        setError(message)
        console.error('useMedicationRegimen create error:', err)
        return null
      }
    },
    [supabase]
  )

  // Update existing regimen
  const updateRegimen = useCallback(
    async (regimenId: string, updates: Partial<MedicationRegimenInput>): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase
          .from('medication_regimens')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', regimenId)

        if (err) throw err

        setRegimens((prev) =>
          prev.map((r) =>
            r.id === regimenId
              ? {
                  ...r,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }
              : r
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar régimen'
        setError(message)
        console.error('useMedicationRegimen update error:', err)
        return false
      }
    },
    [supabase]
  )

  // Stop (deactivate) a regimen
  const stopRegimen = useCallback(
    async (regimenId: string, reason: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase
          .from('medication_regimens')
          .update({
            is_active: false,
            end_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('id', regimenId)

        if (err) throw err

        setRegimens((prev) =>
          prev.map((r) =>
            r.id === regimenId
              ? {
                  ...r,
                  is_active: false,
                  end_date: new Date().toISOString().split('T')[0],
                }
              : r
          )
        )

        // Log discontinuation
        await supabase.from('medication_audit_trail').insert({
          regimen_id: regimenId,
          action: 'DISCONTINUED',
          reason,
        })

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al detener régimen'
        setError(message)
        console.error('useMedicationRegimen stop error:', err)
        return false
      }
    },
    [supabase]
  )

  // Get medication interactions
  const checkInteractions = useCallback(
    async (medicationIds: string[]): Promise<string[]> => {
      try {
        const { data, error: err } = await supabase
          .from('medication_interactions')
          .select('interaction_description')
          .overlaps('medication_ids', medicationIds)

        if (err) throw err

        return (data || []).map((d) => d.interaction_description)
      } catch (err) {
        console.error('useMedicationRegimen interactions error:', err)
        return []
      }
    },
    [supabase]
  )

  // Get dosage recommendations for demographics
  const getDosageRecommendation = useCallback(
    async (
      medicationId: string,
      patientAge: number,
      patientWeight: number
    ): Promise<{ min: number; max: number; recommended: number } | null> => {
      try {
        const { data, error: err } = await supabase
          .from('medication_dosage_recommendations')
          .select('min_dose, max_dose, recommended_dose')
          .eq('medication_id', medicationId)
          .lte('min_age', patientAge)
          .gte('max_age', patientAge)
          .lte('min_weight', patientWeight)
          .gte('max_weight', patientWeight)
          .single()

        if (err) throw err

        return {
          min: data?.min_dose ?? 0,
          max: data?.max_dose ?? 0,
          recommended: data?.recommended_dose ?? 0,
        }
      } catch (err) {
        console.error('useMedicationRegimen dosage error:', err)
        return null
      }
    },
    [supabase]
  )

  return {
    regimens,
    loading,
    error,
    fetchPatientRegimens,
    createRegimen,
    updateRegimen,
    stopRegimen,
    checkInteractions,
    getDosageRecommendation,
  }
}
