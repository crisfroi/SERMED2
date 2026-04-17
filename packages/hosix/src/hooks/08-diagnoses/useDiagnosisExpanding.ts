import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface DiagnosisExpansion {
  base_icd_code: string
  expanded_codes: string[]
  expansion_reasoning: string
  clinical_context: string
}

export interface DiagnosisRecord {
  id: string
  icd_code: string
  diagnosis_description: string
  is_primary: boolean
  severity: string
  status: 'active' | 'resolved' | 'ruled-out'
}

export function useDiagnosisExpanding() {
  const supabase = useSupabase()
  const [expansions, setExpansions] = useState<Map<string, DiagnosisExpansion>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get automatic expansions for a diagnosis
  const getExpansionForDiagnosis = useCallback(
    async (icdCode: string, clinicalContext: string = ''): Promise<DiagnosisExpansion | null> => {
      setLoading(true)
      setError(null)

      try {
        // Query expansion rules
        const { data: rules, error: rulesErr } = await supabase
          .from('diagnosis_expansion_rules')
          .select('*')
          .ilike('icd_code', `${icdCode}%`)
          .limit(1)

        if (rulesErr) throw rulesErr

        if (!rules || rules.length === 0) {
          return null
        }

        const rule = rules[0]
        const expandedList = rule.expansion_diagnosis_list?.split(',').map((s) => s.trim()) || []

        const expansion: DiagnosisExpansion = {
          base_icd_code: icdCode,
          expanded_codes: expandedList,
          expansion_reasoning: rule.rule_type || 'Hierarchical expansion',
          clinical_context: clinicalContext,
        }

        setExpansions((prev) => new Map(prev).set(icdCode, expansion))
        return expansion
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error getting expansion'
        setError(message)
        console.error('useDiagnosisExpanding error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Expand all diagnoses for a patient automatically
  const expandPatientDiagnoses = useCallback(
    async (patientId: string): Promise<number> => {
      setError(null)

      try {
        // Get all primary diagnoses
        const { data: diagnoses, error: fetchErr } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .eq('is_primary', true)
          .eq('status', 'active')

        if (fetchErr) throw fetchErr

        let expandedCount = 0
        const secundaryDiagnoses: Array<{
          patient_id: string
          icd_code: string
          icd_system: string
          diagnosis_description: string
          is_primary: boolean
          status: string
        }> = []

        for (const diagnosis of diagnoses || []) {
          const expansion = await getExpansionForDiagnosis(
            diagnosis.icd_code,
            diagnosis.diagnosis_description
          )

          if (expansion && expansion.expanded_codes.length > 0) {
            secundaryDiagnoses.push(
              ...expansion.expanded_codes.map((code) => ({
                patient_id: patientId,
                icd_code: code,
                icd_system: diagnosis.icd_system,
                diagnosis_description: `Secondary/Expanded from ${diagnosis.icd_code}`,
                is_primary: false,
                status: 'active',
              }))
            )
          }
        }

        // Batch insert secondary diagnoses
        if (secundaryDiagnoses.length > 0) {
          const { error: insertErr } = await supabase
            .from('diagnoses')
            .insert(secundaryDiagnoses)

          if (insertErr) throw insertErr

          expandedCount = secundaryDiagnoses.length
        }

        return expandedCount
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error expanding diagnoses'
        setError(message)
        console.error('useDiagnosisExpanding expand error:', err)
        return 0
      }
    },
    [supabase, getExpansionForDiagnosis]
  )

  // Suggest related conditions (context-aware expansion)
  const suggestRelatedConditions = useCallback(
    async (icdCode: string, patientAge: number, patientGender: string): Promise<string[]> => {
      try {
        // Call edge function for AI-based suggestions
        const { data, error: err } = await supabase.functions.invoke(
          'suggest_related_conditions',
          {
            body: {
              icd_code: icdCode,
              patient_age: patientAge,
              patient_gender: patientGender,
            },
          }
        )

        if (err) throw err

        return data?.suggested_conditions || []
      } catch (err) {
        console.error('Error suggesting related conditions:', err)
        return []
      }
    },
    [supabase]
  )

  // Get differential diagnosis list
  const getDifferentialDiagnosis = useCallback(
    async (symptoms: string[]): Promise<DiagnosisRecord[]> => {
      try {
        const { data, error: err } = await supabase.functions.invoke(
          'differential_diagnosis',
          {
            body: { symptoms },
          }
        )

        if (err) throw err

        return data?.diagnoses || []
      } catch (err) {
        console.error('Error getting differential diagnosis:', err)
        return []
      }
    },
    [supabase]
  )

  // Collapse expanded diagnoses (reverse operation)
  const collapseExpansion = useCallback(
    async (patientId: string, primaryIcdCode: string): Promise<number> => {
      setError(null)

      try {
        // Find all secondary diagnoses that were expanded from this primary
        const { data: secondaryDiags, error: fetchErr } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .eq('is_primary', false)
          .ilike('diagnosis_description', `%${primaryIcdCode}%`)

        if (fetchErr) throw fetchErr

        // Delete secondary diagnoses
        const { error: deleteErr } = await supabase
          .from('diagnoses')
          .delete()
          .eq('patient_id', patientId)
          .eq('is_primary', false)
          .ilike('diagnosis_description', `%${primaryIcdCode}%`)

        if (deleteErr) throw deleteErr

        return (secondaryDiags || []).length
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error collapsing expansion'
        setError(message)
        console.error('useDiagnosisExpanding collapse error:', err)
        return 0
      }
    },
    [supabase]
  )

  // Get expansion cache
  const getCachedExpansion = useCallback(
    (icdCode: string): DiagnosisExpansion | undefined => {
      return expansions.get(icdCode)
    },
    [expansions]
  )

  // Clear expansion cache
  const clearCache = useCallback(() => {
    setExpansions(new Map())
  }, [])

  return {
    expansions: Array.from(expansions.values()),
    loading,
    error,
    getExpansionForDiagnosis,
    expandPatientDiagnoses,
    suggestRelatedConditions,
    getDifferentialDiagnosis,
    collapseExpansion,
    getCachedExpansion,
    clearCache,
  }
}
