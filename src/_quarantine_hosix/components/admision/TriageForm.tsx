import React, { useState } from 'react'

interface Props {
  ticketId: string
  pacienteId?: string
  servicioId?: string
  onSaved?: (record: any) => void
}

const TriageForm: React.FC<Props> = ({ ticketId, pacienteId, servicioId, onSaved }) => {
  const [nivel, setNivel] = useState<string>('3')
  const [puntaje, setPuntaje] = useState<number>(0)
  const [observaciones, setObservaciones] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<any | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Minimal local behavior: emit the record via callback so the parent can decide how to persist.
      const record = {
        id: `local-${Date.now()}`,
        ticket_id: ticketId,
        paciente_id: pacienteId || null,
        servicio_id: servicioId || null,
        nivel_triage: nivel,
        puntaje: puntaje,
        observaciones: observaciones,
        created_at: new Date().toISOString()
      }
      setSaved(record)
      onSaved?.(record)
    } catch (e) {
      console.error('Triage save error', e)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="p-3 border rounded bg-gray-50">
        <div className="mb-2">Triage registrado ✅</div>
        <div className="text-sm">Nivel: <strong>{saved.nivel_triage}</strong></div>
        <div className="text-sm">Puntaje: <strong>{saved.puntaje}</strong></div>
        <div className="mt-2 text-xs text-muted-foreground">Guardado localmente. Integra con RPC/migraciones para persistencia.</div>
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm">Nivel de triage</label>
        <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="border p-2 rounded">
          <option value="1">1 - Resucitación</option>
          <option value="2">2 - Emergencia</option>
          <option value="3">3 - Urgencia</option>
          <option value="4">4 - No urgente</option>
          <option value="5">5 - Consulta menor</option>
        </select>

        <label className="text-sm">Puntaje</label>
        <input type="number" value={puntaje} onChange={(e) => setPuntaje(Number(e.target.value))} className="border p-2 rounded" />

        <label className="text-sm">Observaciones</label>
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="border p-2 rounded h-24" />

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded bg-blue-600 text-white">
            {saving ? 'Guardando...' : 'Guardar Triage'}
          </button>
          <button onClick={() => {
            setNivel('3'); setPuntaje(0); setObservaciones('')
          }} className="px-3 py-1 rounded border">Limpiar</button>
        </div>
      </div>
    </div>
  )
}

export default TriageForm
