import { useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

export interface StockReservation {
  id: string
  variant_id: string
  patient_id: string
  quantity: number
  reason: 'prescription' | 'procedure' | 'discharge' | 'other'
  status: 'reserved' | 'used' | 'returned' | 'expired'
  expiry_date: string | null
  reserved_by: string | null
  reserved_at: string
  used_date: string | null
  return_date: string | null
  notes: string | null
}

export interface StockReservationInput {
  variant_id: string
  patient_id: string
  quantity: number
  reason: 'prescription' | 'procedure' | 'discharge' | 'other'
  notes?: string
}

export function useStockReservation() {
  const supabase = useSupabase()
  const [reservations, setReservations] = useState<StockReservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active reservations for a patient
  const fetchPatientReservations = useCallback(
    async (patientId: string) => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: err } = await supabase
          .from('stock_reservations')
          .select('*, medication_stock_variants(medications(*))')
          .eq('patient_id', patientId)
          .in('status', ['reserved', 'used'])
          .order('reserved_at', { ascending: false })

        if (err) throw err

        setReservations(data || [])
        return data || []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener reservas'
        setError(message)
        console.error('useStockReservation fetch error:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  // Create new reservation
  const createReservation = useCallback(
    async (input: StockReservationInput): Promise<StockReservation | null> => {
      setError(null)

      try {
        // Verify stock availability using the hook logic
        const { data: variant, error: variantErr } = await supabase
          .from('medication_stock_variants')
          .select('*')
          .eq('id', input.variant_id)
          .single()

        if (variantErr || !variant) throw new Error('Variante no encontrada')

        if (variant.quantity_available < input.quantity) {
          throw new Error(
            `Stock insuficiente. Disponible: ${variant.quantity_available}, Solicitud: ${input.quantity}`
          )
        }

        // Create reservation
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 90) // 90-day reservation expiry

        const { data, error: err } = await supabase
          .from('stock_reservations')
          .insert([
            {
              ...input,
              status: 'reserved',
              expiry_date: expiryDate.toISOString().split('T')[0],
              reserved_by: null, // TODO: get from auth
              reserved_at: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        if (err) throw err

        // Update stock variant (decrease available, increase reserved)
        await supabase
          .from('medication_stock_variants')
          .update({
            quantity_available: variant.quantity_available - input.quantity,
            quantity_reserved: variant.quantity_reserved + input.quantity,
          })
          .eq('id', input.variant_id)

        setReservations((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear reserva'
        setError(message)
        console.error('useStockReservation create error:', err)
        return null
      }
    },
    [supabase]
  )

  // Mark reservation as used
  const markAsUsed = useCallback(
    async (reservationId: string): Promise<boolean> => {
      setError(null)

      try {
        const reservation = reservations.find((r) => r.id === reservationId)
        if (!reservation) throw new Error('Reserva no encontrada')

        // Update reservation status
        const { error: err } = await supabase
          .from('stock_reservations')
          .update({
            status: 'used',
            used_date: new Date().toISOString(),
          })
          .eq('id', reservationId)

        if (err) throw err

        // Log usage in audit trail
        await supabase.from('stock_audit_trail').insert({
          variant_id: reservation.variant_id,
          action: 'USED',
          patient_id: reservation.patient_id,
          quantity: reservation.quantity,
          reservation_id: reservationId,
        })

        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  status: 'used',
                  used_date: new Date().toISOString(),
                }
              : r
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al marcar como usado'
        setError(message)
        console.error('useStockReservation used error:', err)
        return false
      }
    },
    [supabase, reservations]
  )

  // Return reserved stock
  const returnStock = useCallback(
    async (reservationId: string, reason: string): Promise<boolean> => {
      setError(null)

      try {
        const reservation = reservations.find((r) => r.id === reservationId)
        if (!reservation) throw new Error('Reserva no encontrada')

        if (reservation.status === 'used') {
          throw new Error('No se puede devolver stock ya utilizado')
        }

        // Get variant data
        const { data: variant, error: variantErr } = await supabase
          .from('medication_stock_variants')
          .select('*')
          .eq('id', reservation.variant_id)
          .single()

        if (variantErr) throw variantErr

        // Update reservation
        const { error: resErr } = await supabase
          .from('stock_reservations')
          .update({
            status: 'returned',
            return_date: new Date().toISOString(),
            notes: reason,
          })
          .eq('id', reservationId)

        if (resErr) throw resErr

        // Update stock variant (restore available, remove reserved)
        await supabase
          .from('medication_stock_variants')
          .update({
            quantity_available: variant.quantity_available + reservation.quantity,
            quantity_reserved: variant.quantity_reserved - reservation.quantity,
          })
          .eq('id', reservation.variant_id)

        // Log return
        await supabase.from('stock_audit_trail').insert({
          variant_id: reservation.variant_id,
          action: 'RETURNED',
          quantity: reservation.quantity,
          reservation_id: reservationId,
          reason,
        })

        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  status: 'returned',
                  return_date: new Date().toISOString(),
                }
              : r
          )
        )

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al devolver stock'
        setError(message)
        console.error('useStockReservation return error:', err)
        return false
      }
    },
    [supabase, reservations]
  )

  // Check and update expired reservations
  const checkExpiredReservations = useCallback(
    async (patientId: string): Promise<number> => {
      setError(null)

      try {
        const now = new Date().toISOString().split('T')[0]

        // Find expired reservations
        const { data: expired, error: fetchErr } = await supabase
          .from('stock_reservations')
          .select('*')
          .eq('patient_id', patientId)
          .eq('status', 'reserved')
          .lt('expiry_date', now)

        if (fetchErr) throw fetchErr

        // Mark as expired and restore stock
        for (const reservation of expired || []) {
          await returnStock(reservation.id, 'Reserva expirada')
        }

        return (expired || []).length
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al verificar reservas expiradas'
        setError(message)
        console.error('useStockReservation expire error:', err)
        return 0
      }
    },
    [supabase, returnStock]
  )

  // Get reservation summary
  const getReservationSummary = useCallback(
    (patientId: string) => {
      const patientReservations = reservations.filter((r) => r.patient_id === patientId)

      return {
        total: patientReservations.length,
        reserved: patientReservations.filter((r) => r.status === 'reserved').length,
        used: patientReservations.filter((r) => r.status === 'used').length,
        returned: patientReservations.filter((r) => r.status === 'returned').length,
        totalItems: patientReservations.reduce((sum, r) => sum + r.quantity, 0),
      }
    },
    [reservations]
  )

  return {
    reservations,
    loading,
    error,
    fetchPatientReservations,
    createReservation,
    markAsUsed,
    returnStock,
    checkExpiredReservations,
    getReservationSummary,
  }
}
