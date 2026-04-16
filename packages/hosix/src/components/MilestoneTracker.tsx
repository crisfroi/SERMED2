/**
 * Component: MilestoneTracker
 * Visualiza hitos de desarrollo infantil con estándares WHO
 * 
 * Props:
 * - patientId: UUID del paciente
 * - currentAgeMonths: edad actual en meses
 * - onUpdate: callback cuando se actualiza un hito
 */

import React, { useState } from 'react'
import { useMilestoneTracking, WHO_MILESTONES, evaluateMilestoneStatus } from '@/hooks/useMilestoneTracking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'

interface MilestoneTrackerProps {
  patientId: string
  currentAgeMonths: number
  onUpdate?: () => void
}

export function MilestoneTracker({ patientId, currentAgeMonths, onUpdate }: MilestoneTrackerProps) {
  const { milestones, loading, error, addMilestone, updateMilestone } = useMilestoneTracking(patientId)
  const [newMilestoneType, setNewMilestoneType] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('')

  const handleAddMilestone = async () => {
    if (!newMilestoneType || !newMilestoneDate) return

    const milestone = WHO_MILESTONES.find(m => m.type === newMilestoneType)
    if (!milestone) return

    try {
      await addMilestone({
        patient_id: patientId,
        milestone_type: newMilestoneType as any,
        expected_age_months: milestone.expected_months,
        achieved_date: newMilestoneDate,
        notes: null,
        status: 'achieved'
      })

      setNewMilestoneType('')
      setNewMilestoneDate('')
      onUpdate?.()
    } catch (err) {
      console.error('Error adding milestone:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-50 border-green-200'
      case 'delayed':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hitos del Desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Cargando hitos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguimiento de Hitos del Desarrollo</CardTitle>
        <CardDescription>
          Estándares WHO - Edad actual: {currentAgeMonths} meses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de hitos esperados vs logrados */}
        <div className="space-y-3">
          {WHO_MILESTONES.map(milestone => {
            const achieved = milestones.find(m => m.milestone_type === milestone.type)
            const status = achieved?.status || 'pending'

            return (
              <div
                key={milestone.type}
                className={`p-3 border-2 rounded-lg ${getStatusColor(status)} flex items-center justify-between`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(status)}
                  <div>
                    <div className="font-medium">
                      {milestone.label}
                      <Badge variant="outline" className="ml-2 text-xs">
                        ≈{milestone.expected_months} meses
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{milestone.description}</div>
                    {achieved?.achieved_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Logrado: {new Date(achieved.achieved_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Agregar nuevo hito */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Registrar nuevo hito</h3>
          <div className="space-y-3">
            <select
              value={newMilestoneType}
              onChange={(e) => setNewMilestoneType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Seleccionar hito...</option>
              {WHO_MILESTONES.map(m => (
                <option key={m.type} value={m.type}>
                  {m.label} ({m.expected_months} meses)
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={newMilestoneDate}
              onChange={(e) => setNewMilestoneDate(e.target.value)}
              className="w-full"
              placeholder="Fecha de logro"
            />

            <Button
              onClick={handleAddMilestone}
              disabled={!newMilestoneType || !newMilestoneDate}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar hito
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            Error: {error.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
