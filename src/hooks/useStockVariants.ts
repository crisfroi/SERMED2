import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface StockVariant {
  id: string
  medication_id: string
  variant_type: 'inpatient' | 'nursing' | 'surgery'
  quantity_total: number
  quantity_available: number
  quantity_reserved: number
  unit_cost: number
  expiry_date: string | null
  batch_number: string | null
  location: string
  last_inventory_date: string
  created_at: string
  updated_at: string
}

export interface StockVariantInput {
  medication_id: string
  variant_type: 'inpatient' | 'nursing' | 'surgery'
  quantity_total: number
  unit_cost: number
  location: string
  expiry_date?: string
  batch_number?: string
}

export function useStockVariants() {
  const supabase = useSupabase()
  const [variants, setVariants] = useState<StockVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all stock variants for a medication
  const fetchVariants = useCallback(
    async (medicationId: string) => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('medication_stock_variants')
          .select('*')
          .eq('medication_id', medicationId)
          .order('variant_type')

        if (err) throw err

        setVariants(data || [])
        return data || []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener variantes'
        setError(message)
        console.error('useStockVariants fetch error:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Create new stock variant
  const createVariant = useCallback(
    async (input: StockVariantInput): Promise<StockVariant | null> => {
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('medication_stock_variants')
          .insert([
            {
              ...input,
              quantity_available: input.quantity_total,
              quantity_reserved: 0,
              last_inventory_date: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        if (err) throw err

        setVariants((prev) => [...prev, data])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear variante'
        setError(message)
        console.error('useStockVariants create error:', err)
        return null
      }
    },
    [supabase]
  )

  // Update stock variant quantity
  const updateQuantity = useCallback(
    async (
      variantId: string,
      newTotal: number,
      reason: string
    ): Promise<StockVariant | null> => {
      setError(null)

      try {
        // Get current available quantity
        const current = variants.find((v) => v.id === variantId)
        if (!current) throw new Error('Variante no encontrada')

        const reserved = current.quantity_reserved
        const available = newTotal - reserved

        if (available < 0) {
          throw new Error(
            `No se puede reducir stock por debajo de cantidad reservada (${reserved})`
          )
        }

        const { data, error: err } = await supabase
          .from('medication_stock_variants')
          .update({
            quantity_total: newTotal,
            quantity_available: available,
            last_inventory_date: new Date().toISOString(),
          })
          .eq('id', variantId)
          .select()
          .single()

        if (err) throw err

        setVariants((prev) => prev.map((v) => (v.id === variantId ? data : v)))

        // Log to audit trail
        await supabase.from('stock_audit_trail').insert({
          variant_id: variantId,
          action: 'QUANTITY_UPDATE',
          reason,
          old_quantity: current.quantity_total,
          new_quantity: newTotal,
          user_id: null, // TODO: get from auth
        })

        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar cantidad'
        setError(message)
        console.error('useStockVariants update error:', err)
        return null
      }
    },
    [supabase, variants]
  )

  // Reserve stock
  const reserveStock = useCallback(
    async (variantId: string, quantity: number): Promise<boolean> => {
      setError(null)

      try {
        const variant = variants.find((v) => v.id === variantId)
        if (!variant) throw new Error('Variante no encontrada')

        if (variant.quantity_available < quantity) {
          throw new Error(
            `Stock insuficiente. Disponible: ${variant.quantity_available}, Solicitado: ${quantity}`
          )
        }

        const { error: err } = await supabase
          .from('medication_stock_variants')
          .update({
            quantity_available: variant.quantity_available - quantity,
            quantity_reserved: variant.quantity_reserved + quantity,
          })
          .eq('id', variantId)

        if (err) throw err

        setVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  quantity_available: v.quantity_available - quantity,
                  quantity_reserved: v.quantity_reserved + quantity,
                }
              : v
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al reservar stock'
        setError(message)
        console.error('useStockVariants reserve error:', err)
        return false
      }
    },
    [supabase, variants]
  )

  // Release reserved stock
  const releaseReserved = useCallback(
    async (variantId: string, quantity: number): Promise<boolean> => {
      setError(null)

      try {
        const variant = variants.find((v) => v.id === variantId)
        if (!variant) throw new Error('Variante no encontrada')

        if (variant.quantity_reserved < quantity) {
          throw new Error(
            `Cantidad reservada insuficiente. Reservado: ${variant.quantity_reserved}, Solicitud: ${quantity}`
          )
        }

        const { error: err } = await supabase
          .from('medication_stock_variants')
          .update({
            quantity_available: variant.quantity_available + quantity,
            quantity_reserved: variant.quantity_reserved - quantity,
          })
          .eq('id', variantId)

        if (err) throw err

        setVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  quantity_available: v.quantity_available + quantity,
                  quantity_reserved: v.quantity_reserved - quantity,
                }
              : v
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al liberar stock'
        setError(message)
        console.error('useStockVariants release error:', err)
        return false
      }
    },
    [supabase, variants]
  )

  // Get summary of all variants for a medication
  const getSummary = useCallback(
    (medicationId: string) => {
      const medicationVariants = variants.filter((v) => v.medication_id === medicationId)

      return {
        totalQuantity: medicationVariants.reduce((sum, v) => sum + v.quantity_total, 0),
        totalAvailable: medicationVariants.reduce((sum, v) => sum + v.quantity_available, 0),
        totalReserved: medicationVariants.reduce((sum, v) => sum + v.quantity_reserved, 0),
        variantCount: medicationVariants.length,
        byType: {
          inpatient: medicationVariants
            .filter((v) => v.variant_type === 'inpatient')
            .reduce((sum, v) => sum + v.quantity_available, 0),
          nursing: medicationVariants
            .filter((v) => v.variant_type === 'nursing')
            .reduce((sum, v) => sum + v.quantity_available, 0),
          surgery: medicationVariants
            .filter((v) => v.variant_type === 'surgery')
            .reduce((sum, v) => sum + v.quantity_available, 0),
        },
      }
    },
    [variants]
  )

  return {
    variants,
    loading,
    error,
    fetchVariants,
    createVariant,
    updateQuantity,
    reserveStock,
    releaseReserved,
    getSummary,
  }
}
