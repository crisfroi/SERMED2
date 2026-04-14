import { useState } from 'react'

type CreateTicketPayload = {
  paciente_id: string
  servicio_id?: string
  centro_salud_id?: string | null
  prioridad?: 'normal'|'prioritario'|'urgente'
  origen_registro?: string
  numero_turno?: string
}

export default function useHosixTickets() {
  const [isCreating, setIsCreating] = useState(false)

  const createTicket = async (payload: CreateTicketPayload) => {
    setIsCreating(true)
    try {
      // Temporary local implementation for UI/dev: create a local ticket object.
      // Replace with real Supabase insert or RPC when integrating with backend.
      const now = Date.now()
      const ticket = {
        id: `local-${now}`,
        paciente_id: payload.paciente_id,
        servicio_id: payload.servicio_id || null,
        centro_salud_id: payload.centro_salud_id || null,
        prioridad: payload.prioridad || 'normal',
        origen_registro: payload.origen_registro || 'manual',
        numero_turno: payload.numero_turno || `T-${String(now).slice(-6)}`,
        estado: 'pendiente',
        created_at: new Date(now).toISOString()
      }

      // Simulate network delay
      await new Promise((res) => setTimeout(res, 120))
      return ticket
    } finally {
      setIsCreating(false)
    }
  }

  return { createTicket, isCreating }
}
