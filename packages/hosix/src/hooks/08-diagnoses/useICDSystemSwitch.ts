import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export type ICDSystem = 'ICD-9' | 'ICD-10' | 'ICD-11'

export interface ICDCode {
  code: string
  description: string
  system: ICDSystem
  category: string
  available_in_systems: ICDSystem[]
}

export interface DiagnosisRecord {
  id: string
  patient_id: string
  icd_code: string
  icd_system: ICDSystem
  diagnosis_description: string
  is_primary: boolean
  status: 'active' | 'resolved' | 'ruled-out'
  severity: string
  onset_date: string | null
}

export function useICDSystemSwitch() {
  const supabase = useSupabase()
  const [currentSystem, setCurrentSystem] = useState<ICDSystem>('ICD-11')
  const [icdCodes, setICDCodes] = useState<ICDCode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Switch ICD System
  const switchSystem = useCallback((newSystem: ICDSystem): void => {
    setCurrentSystem(newSystem)
  }, [])

  // Search ICD codes
  const searchICDCodes = useCallback(
    async (searchTerm: string, system: ICDSystem = currentSystem): Promise<ICDCode[]> => {
      setLoading(true)
      setError(null)

      try {
        // Call edge function to search ICD codes
        const { data, error: err } = await supabase.functions.invoke(
          'expand_icd_codes',
          {
            body: {
              search_term: searchTerm,
              icd_system: system,
            },
          }
        )

        if (err) throw err

        setICDCodes(data?.results || [])
        return data?.results || []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error searching ICD codes'
        setError(message)
        console.error('useICDSystemSwitch search error:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase, currentSystem]
  )

  // Get ICD code mapping between systems
  const mapICDCode = useCallback(
    async (
      icdCode: string,
      fromSystem: ICDSystem,
      toSystem: ICDSystem
    ): Promise<{ code: string; description: string } | null> => {
      if (fromSystem === toSystem) {
        return { code: icdCode, description: '' }
      }

      try {
        // Query ICD mapping table
        const { data, error: err } = await supabase
          .from('icd_code_mappings')
          .select('*')
          .eq('source_code', icdCode)
          .eq('source_system', fromSystem)
          .eq('target_system', toSystem)
          .single()

        if (err) return null

        return {
          code: data?.target_code,
          description: data?.target_description,
        }
      } catch (err) {
        console.error('Error mapping ICD code:', err)
        return null
      }
    },
    [supabase]
  )

  // Convert all diagnoses from one system to another
  const convertPatientDiagnoses = useCallback(
    async (
      patientId: string,
      fromSystem: ICDSystem,
      toSystem: ICDSystem
    ): Promise<number> => {
      setError(null)

      try {
        // Get all diagnoses in source system
        const { data: diagnoses, error: fetchErr } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .eq('icd_system', fromSystem)

        if (fetchErr) throw fetchErr

        let convertedCount = 0

        for (const diagnosis of diagnoses || []) {
          const mapping = await mapICDCode(
            diagnosis.icd_code,
            fromSystem,
            toSystem
          )

          if (mapping) {
            const { error: updateErr } = await supabase
              .from('diagnoses')
              .update({
                icd_code: mapping.code,
                icd_system: toSystem,
              })
              .eq('id', diagnosis.id)

            if (!updateErr) convertedCount++
          }
        }

        return convertedCount
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error converting diagnoses'
        setError(message)
        console.error('useICDSystemSwitch convert error:', err)
        return 0
      }
    },
    [supabase, mapICDCode]
  )

  // Get available ICD systems
  const getAvailableSystems = useCallback((): ICDSystem[] => {
    return ['ICD-9', 'ICD-10', 'ICD-11']
  }, [])

  // Validate ICD code format
  const validateICDCodeFormat = useCallback(
    (icdCode: string, system: ICDSystem): boolean => {
      const patterns: Record<ICDSystem, RegExp> = {
        'ICD-9': /^[A-V]\d{2}(\.\d{1,2})?$/,
        'ICD-10': /^[A-Z]\d{2}(\.\d{1,2})?$/,
        'ICD-11': /^[A-Z]{2}[0-9A-Z]{2}(\.\d{1,2})?$/,
      }

      return patterns[system].test(icdCode)
    },
    []
  )

  return {
    currentSystem,
    icdCodes,
    loading,
    error,
    switchSystem,
    searchICDCodes,
    mapICDCode,
    convertPatientDiagnoses,
    getAvailableSystems,
    validateICDCodeFormat,
  }
}
