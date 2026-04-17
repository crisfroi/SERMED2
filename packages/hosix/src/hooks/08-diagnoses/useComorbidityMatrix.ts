import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface ComorbidityData {
  id: string
  patient_id: string
  primary_diagnosis_id: string
  comorbidity_count: number
  comorbidity_list: string[]
  risk_score: number
  clinical_notes: string | null
}

export interface DiagnosisRecord {
  id: string
  icd_code: string
  icd_system: 'ICD-9' | 'ICD-10' | 'ICD-11'
  diagnosis_description: string
  severity: string
  status: 'active' | 'resolved' | 'ruled-out'
}

export function useComorbidityMatrix() {
  const supabase = useSupabase()
  const [matrix, setMatrix] = useState<ComorbidityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch comorbidity matrix for patient
  const fetchPatientComorbidities = useCallback(
    async (patientId: string): Promise<ComorbidityData | null> => {
      setLoading(true)
      setError(null)

      try {
        // Get all diagnoses for patient
        const { data: diagnoses, error: diagErr } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .eq('status', 'active')

        if (diagErr) throw diagErr

        if (!diagnoses || diagnoses.length === 0) {
          setMatrix(null)
          return null
        }

        // Calculate comorbidity matrix
        const comorbiditiesList = diagnoses.map((d) => d.icd_code).filter(Boolean)
        const riskScore = calculateComorbidityRisk(diagnoses)

        // Check if matrix exists
        const { data: existingMatrix, error: matrixErr } = await supabase
          .from('comorbidity_matrix')
          .select('*')
          .eq('patient_id', patientId)
          .single()

        let matrixData: ComorbidityData

        if (existingMatrix) {
          // Update existing matrix
          const { data: updated, error: updateErr } = await supabase
            .from('comorbidity_matrix')
            .update({
              comorbidity_count: diagnoses.length,
              comorbidity_list: comorbiditiesList,
              risk_score: riskScore,
            })
            .eq('patient_id', patientId)
            .select()
            .single()

          if (updateErr) throw updateErr
          matrixData = updated
        } else {
          // Create new matrix
          const primaryDiag = diagnoses.find((d) => d.is_primary)
          const { data: newMatrix, error: createErr } = await supabase
            .from('comorbidity_matrix')
            .insert([
              {
                patient_id: patientId,
                primary_diagnosis_id: primaryDiag?.id || diagnoses[0].id,
                comorbidity_count: diagnoses.length,
                comorbidity_list: comorbiditiesList,
                risk_score: riskScore,
              },
            ])
            .select()
            .single()

          if (createErr) throw createErr
          matrixData = newMatrix
        }

        setMatrix(matrixData)
        return matrixData
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching comorbidities'
        setError(message)
        console.error('useComorbidityMatrix fetch error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Calculate comorbidity risk score
  const calculateComorbidityRisk = (diagnoses: DiagnosisRecord[]): number => {
    let riskScore = 0

    diagnoses.forEach((diag) => {
      // Base score by severity
      const severityScores: Record<string, number> = {
        mild: 1,
        moderate: 3,
        severe: 5,
        critical: 10,
      }

      riskScore += severityScores[diag.severity?.toLowerCase() || 'mild'] || 1

      // Additional risk for chronic conditions
      if (
        [
          'E11', // Diabetes Type 2
          'I10', // Hypertension
          'J44', // COPD
          'I50', // Heart Failure
        ].includes(diag.icd_code?.substring(0, 3) || '')
      ) {
        riskScore += 2
      }
    })

    // Normalize to 0-100 scale
    return Math.min(riskScore * 10, 100)
  }

  // Get interaction between two diagnoses
  const checkDiagnosisInteractions = useCallback(
    async (icdCode1: string, icdCode2: string): Promise<string | null> => {
      try {
        const { data, error: err } = await supabase
          .from('diagnosis_interactions') // hypothetical table
          .select('interaction_description')
          .or(
            `and(icd_codes.cs.{${icdCode1}},icd_codes.cs.{${icdCode2}}),and(icd_codes.cs.{${icdCode2}},icd_codes.cs.{${icdCode1}})`
          )
          .single()

        if (err) return null
        return data?.interaction_description || null
      } catch (err) {
        console.error('Error checking diagnosis interactions:', err)
        return null
      }
    },
    [supabase]
  )

  // Update comorbidity clinical notes
  const updateClinicalNotes = useCallback(
    async (patientId: string, notes: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase
          .from('comorbidity_matrix')
          .update({ clinical_notes: notes })
          .eq('patient_id', patientId)

        if (err) throw err

        if (matrix) {
          setMatrix({ ...matrix, clinical_notes: notes })
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error updating notes'
        setError(message)
        console.error('Error updating clinical notes:', err)
        return false
      }
    },
    [supabase, matrix]
  )

  // Get risk stratification
  const getRiskStratification = useCallback((riskScore: number): string => {
    if (riskScore < 20) return 'Low Risk'
    if (riskScore < 50) return 'Moderate Risk'
    if (riskScore < 75) return 'High Risk'
    return 'Critical Risk'
  }, [])

  return {
    matrix,
    loading,
    error,
    fetchPatientComorbidities,
    calculateComorbidityRisk,
    checkDiagnosisInteractions,
    updateClinicalNotes,
    getRiskStratification,
  }
}
