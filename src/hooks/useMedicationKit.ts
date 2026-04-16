import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface MedicationKit {
  id: string
  name: string
  description: string
  kit_type: 'emergency' | 'routine' | 'surgery' | 'specialty' | 'custom'
  medications: KitMedication[]
  total_items_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KitMedication {
  id: string
  kit_id: string
  medication_id: string
  quantity_per_kit: number
  unit: string
  is_critical: boolean
  medication: {
    id: string
    name: string
    generic_name: string
    strength: string
  }
}

export interface MedicationKitInput {
  name: string
  description: string
  kit_type: 'emergency' | 'routine' | 'surgery' | 'specialty' | 'custom'
  medications: Array<{
    medication_id: string
    quantity: number
    unit: string
    is_critical: boolean
  }>
}

export function useMedicationKit() {
  const supabase = useSupabase()
  const [kits, setKits] = useState<MedicationKit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all kits
  const fetchKits = useCallback(
    async (kitType?: string) => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('medication_kits')
          .select('*, kit_medications(*, medications(*))')
          .eq('is_active', true)

        if (kitType) {
          query = query.eq('kit_type', kitType)
        }

        const { data, error: err } = await query.order('kit_type')

        if (err) throw err

        // Transform data
        const transformedData = (data || []).map((kit: any) => ({
          ...kit,
          medications: kit.kit_medications || [],
          total_items_count: (kit.kit_medications || []).reduce(
            (sum: number, m: any) => sum + m.quantity_per_kit,
            0
          ),
        }))

        setKits(transformedData)
        return transformedData
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener kits'
        setError(message)
        console.error('useMedicationKit fetch error:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Create new kit
  const createKit = useCallback(
    async (input: MedicationKitInput): Promise<MedicationKit | null> => {
      setError(null)

      try {
        // Create kit
        const { data: kitData, error: kitErr } = await supabase
          .from('medication_kits')
          .insert([
            {
              name: input.name,
              description: input.description,
              kit_type: input.kit_type,
              is_active: true,
            },
          ])
          .select()
          .single()

        if (kitErr) throw kitErr

        // Add medications to kit
        const medicationEntries = input.medications.map((m) => ({
          kit_id: kitData.id,
          medication_id: m.medication_id,
          quantity_per_kit: m.quantity,
          unit: m.unit,
          is_critical: m.is_critical,
        }))

        const { error: medErr } = await supabase
          .from('kit_medications')
          .insert(medicationEntries)

        if (medErr) throw medErr

        // Fetch complete kit with medications
        const { data: fullKit, error: fetchErr } = await supabase
          .from('medication_kits')
          .select('*, kit_medications(*, medications(*))')
          .eq('id', kitData.id)
          .single()

        if (fetchErr) throw fetchErr

        const newKit: MedicationKit = {
          ...fullKit,
          medications: fullKit.kit_medications || [],
          total_items_count: (fullKit.kit_medications || []).reduce(
            (sum, m) => sum + m.quantity_per_kit,
            0
          ),
        }

        setKits((prev) => [...prev, newKit])
        return newKit
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear kit'
        setError(message)
        console.error('useMedicationKit create error:', err)
        return null
      }
    },
    [supabase]
  )

  // Add medication to kit
  const addMedicationToKit = useCallback(
    async (
      kitId: string,
      medicationId: string,
      quantity: number,
      unit: string,
      isCritical: boolean
    ): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase.from('kit_medications').insert([
          {
            kit_id: kitId,
            medication_id: medicationId,
            quantity_per_kit: quantity,
            unit,
            is_critical: isCritical,
          },
        ])

        if (err) throw err

        // Refresh kits
        await fetchKits()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al agregar medicamento'
        setError(message)
        console.error('useMedicationKit add error:', err)
        return false
      }
    },
    [supabase, fetchKits]
  )

  // Remove medication from kit
  const removeMedicationFromKit = useCallback(
    async (kitId: string, medicationId: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase
          .from('kit_medications')
          .delete()
          .eq('kit_id', kitId)
          .eq('medication_id', medicationId)

        if (err) throw err

        setKits((prev) =>
          prev.map((kit) =>
            kit.id === kitId
              ? {
                  ...kit,
                  medications: kit.medications.filter((m) => m.medication_id !== medicationId),
                }
              : kit
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al remover medicamento'
        setError(message)
        console.error('useMedicationKit remove error:', err)
        return false
      }
    },
    [supabase]
  )

  // Deactivate kit
  const deactivateKit = useCallback(
    async (kitId: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: err } = await supabase
          .from('medication_kits')
          .update({ is_active: false })
          .eq('id', kitId)

        if (err) throw err

        setKits((prev) => prev.filter((k) => k.id !== kitId))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al deactivar kit'
        setError(message)
        console.error('useMedicationKit deactivate error:', err)
        return false
      }
    },
    [supabase]
  )

  // Validate kit has required critical items
  const validateKitCompleteness = useCallback(
    (kit: MedicationKit): { complete: boolean; missing: KitMedication[] } => {
      const critical = kit.medications.filter((m) => m.is_critical)
      const missing = critical.filter((m) => m.quantity_per_kit === 0)

      return {
        complete: missing.length === 0,
        missing,
      }
    },
    []
  )

  // Clone existing kit
  const cloneKit = useCallback(
    async (sourceKitId: string, newName: string): Promise<MedicationKit | null> => {
      setError(null)

      try {
        const sourceKit = kits.find((k) => k.id === sourceKitId)
        if (!sourceKit) throw new Error('Kit de origen no encontrado')

        const { data: newKitData, error: createErr } = await supabase
          .from('medication_kits')
          .insert([
            {
              name: newName,
              description: sourceKit.description,
              kit_type: sourceKit.kit_type,
              is_active: true,
            },
          ])
          .select()
          .single()

        if (createErr) throw createErr

        // Copy medications
        const medicationEntries = sourceKit.medications.map((m) => ({
          kit_id: newKitData.id,
          medication_id: m.medication_id,
          quantity_per_kit: m.quantity_per_kit,
          unit: m.unit,
          is_critical: m.is_critical,
        }))

        const { error: copyErr } = await supabase
          .from('kit_medications')
          .insert(medicationEntries)

        if (copyErr) throw copyErr

        const clonedKit: MedicationKit = {
          ...newKitData,
          medications: sourceKit.medications,
          total_items_count: sourceKit.total_items_count,
        }

        setKits((prev) => [...prev, clonedKit])
        return clonedKit
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al clonar kit'
        setError(message)
        console.error('useMedicationKit clone error:', err)
        return null
      }
    },
    [supabase, kits]
  )

  return {
    kits,
    loading,
    error,
    fetchKits,
    createKit,
    addMedicationToKit,
    removeMedicationFromKit,
    deactivateKit,
    validateKitCompleteness,
    cloneKit,
  }
}
