// @ts-nocheck
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import useHosixTickets from '@/hooks/useHosixTickets'
import TriageForm from './TriageForm'

interface Props {
  pacienteId: string
  servicioId?: string
  centroSaludId?: string | null
  onCreated?: (ticket: any) => void
}

const TicketGenerator: React.FC<Props> = ({ pacienteId, servicioId, centroSaludId, onCreated }) => {
  const { toast } = useToast()
  const { createTicket, isCreating } = useHosixTickets()
  const [prioridad, setPrioridad] = useState<'normal'|'prioritario'|'urgente'>('normal')
  const [lastTicket, setLastTicket] = useState<any | null>(null)

  const handleCreate = async () => {
    if (!pacienteId) return
    try {
      const created = await createTicket({
        paciente_id: pacienteId,
        servicio_id: servicioId,
        centro_salud_id: centroSaludId || null,
        prioridad: prioridad,
        origen_registro: 'manual'
      })

      setLastTicket(created)
      toast({ title: 'Ticket creado', description: `Número: ${created?.numero_turno || 'n/a'}` })
      onCreated?.(created)
    } catch (e: any) {
      console.error('Error creando ticket:', e)
      toast({ title: 'Error', description: e?.message || 'No se pudo crear ticket', variant: 'destructive' })
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <Select value={prioridad} onValueChange={(v) => setPrioridad(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="prioritario">Prioritario</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleCreate} disabled={isCreating} variant="secondary">
          {isCreating ? '⏳ Generando...' : '🎟️ Generar Ticket'}
        </Button>
      </div>

      {lastTicket && (
        <div className="mt-4 p-3 border rounded bg-white">
          <div className="mb-2">Ticket creado: <strong>{lastTicket.numero_turno}</strong></div>
          <TriageForm ticketId={lastTicket.id} pacienteId={pacienteId} servicioId={servicioId} onSaved={(r) => {
            toast({ title: 'Triage registrado', description: `Nivel: ${r?.nivel_triage || 'n/a'}` })
          }} />
        </div>
      )}
    </div>
  )
}

export default TicketGenerator
