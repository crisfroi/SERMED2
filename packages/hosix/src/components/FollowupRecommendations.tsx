'use client';

import React, { useState, useEffect,  useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReferralFollowup } from '@hosix/hooks/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Calendar,
} from 'lucide-react';

interface FollowupRecommendationsProps {
  referralId: string;
  patientId: string;
}

export const FollowupRecommendations: React.FC<FollowupRecommendationsProps> = ({
  referralId,
  patientId,
}) => {
  const {
    loading: followupLoading,
    error: followupError,
    scheduleFollowup,
    getPendingFollowups,
    getFollowupHistory,
    completeFollowup,
  } = useReferralFollowup();

  const {
    loading: outcomeLoading,
    error: outcomeError,
    recordOutcome,
    getOutcomeForReferral,
    getQualityMetrics,
  } = useReferralOutcomes();

  const [followups, setFollowups] = useState<any[]>([]);
  const [outcome, setOutcome] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);

  // Form states
  const [followupDate, setFollowupDate] = useState('');
  const [followupType, setFollowupType] = useState<'phone' | 'in_person' | 'email' | 'sms'>('phone');
  const [followupNotes, setFollowupNotes] = useState('');
  const [outcomeType, setOutcomeType] = useState('resolved');
  const [clinicalOutcome, setClinicalOutcome] = useState('');
  const [satisfaction, setSatisfaction] = useState('5');
  const [complications, setComplications] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const history = await getFollowupHistory(referralId);
      setFollowups(history);

      const outcomeData = await getOutcomeForReferral(referralId);
      setOutcome(outcomeData);

      const metrics = await getQualityMetrics();
      setQualityMetrics(metrics);
    };

    loadData();
  }, [referralId, getFollowupHistory, getOutcomeForReferral, getQualityMetrics]);

  const handleScheduleFollowup = useCallback(async () => {
    if (!followupDate) {
      alert('Selecciona una fecha para el seguimiento');
      return;
    }

    const success = await scheduleFollowup(
      referralId,
      patientId,
      followupDate,
      followupType,
      followupNotes,
      'current-user'
    );

    if (success) {
      const history = await getFollowupHistory(referralId);
      setFollowups(history);
      setShowFollowupForm(false);
      setFollowupDate('');
      setFollowupNotes('');
    }
  }, [referralId, patientId, followupDate, followupType, followupNotes, scheduleFollowup, getFollowupHistory]);

  const handleRecordOutcome = useCallback(async () => {
    if (!clinicalOutcome) {
      alert('Describe el resultado clínico');
      return;
    }

    const success = await recordOutcome(
      referralId,
      patientId,
      outcomeType as any,
      clinicalOutcome,
      parseInt(satisfaction),
      complications || null,
      'current-user'
    );

    if (success) {
      const outcomeData = await getOutcomeForReferral(referralId);
      setOutcome(outcomeData);
      setShowOutcomeForm(false);
      setClinicalOutcome('');
    }
  }, [referralId, patientId, outcomeType, clinicalOutcome, satisfaction, complications, recordOutcome, getOutcomeForReferral]);

  const handleCompleteFollowup = useCallback(async (followupId: string) => {
    const notes = prompt('Notas de seguimiento completado:');
    if (!notes) return;

    const success = await completeFollowup(followupId, notes, 'current-user');
    if (success) {
      const history = await getFollowupHistory(referralId);
      setFollowups(history);
    }
  }, [referralId, completeFollowup, getFollowupHistory]);

  return (
    <div className="w-full space-y-4">
      {/* Quality Metrics */}
      {qualityMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{qualityMetrics.totalReferrals}</p>
                <p className="text-xs text-gray-600 mt-1">Total Derivaciones</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(qualityMetrics.resolutionRate)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Tasa Resolución</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {qualityMetrics.averageSpecialistResponseTime}
                </p>
                <p className="text-xs text-gray-600 mt-1">Días respuesta</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {qualityMetrics.averagePatientSatisfaction.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Satisfacción (1-5)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="followups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Seguimiento
          </TabsTrigger>
          <TabsTrigger value="outcome" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resultado
          </TabsTrigger>
        </TabsList>

        {/* Followups Tab */}
        <TabsContent value="followups" className="space-y-4">
          {/* Schedule Followup Form */}
          {!showFollowupForm ? (
            <Button onClick={() => setShowFollowupForm(true)} className="w-full">
              Agendar Seguimiento
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agendar Seguimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Fecha de seguimiento</Label>
                    <Input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Tipo de contacto</Label>
                    <Select value={followupType} onValueChange={(v) => setFollowupType(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Llamada telefónica</SelectItem>
                        <SelectItem value="in_person">Presencial</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Textarea
                    value={followupNotes}
                    onChange={(e) => setFollowupNotes(e.target.value)}
                    placeholder="Razón del seguimiento, puntos a tratar..."
                    className="mt-1 min-h-20"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleScheduleFollowup}
                    disabled={followupLoading}
                    className="flex-1"
                  >
                    Agendar
                  </Button>
                  <Button
                    onClick={() => setShowFollowupForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Followups List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {followups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sin seguimientos agendados</p>
              ) : (
                <div className="space-y-3">
                  {followups.map((followup) => (
                    <div
                      key={followup.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {followup.followup_type}
                          </Badge>
                          {followup.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              ✓ Completado
                            </Badge>
                          ) : followup.status === 'missed' ? (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              ✗ Perdido
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              ⏳ Pendiente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          Fecha: {format(new Date(followup.followup_date), 'PPp', { locale: es })}
                        </p>
                        {followup.notes && (
                          <p className="text-xs text-gray-600 mt-1">{followup.notes}</p>
                        )}
                      </div>

                      {followup.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteFollowup(followup.id)}
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcome Tab */}
        <TabsContent value="outcome" className="space-y-4">
          {!outcome ? (
            !showOutcomeForm ? (
              <Button onClick={() => setShowOutcomeForm(true)} className="w-full">
                Registrar Resultado
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registrar Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Tipo de resultado</Label>
                    <Select value={outcomeType} onValueChange={setOutcomeType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                        <SelectItem value="ongoing">En curso</SelectItem>
                        <SelectItem value="referred_elsewhere">Referido a otro lugar</SelectItem>
                        <SelectItem value="declined_treatment">Paciente rechazó tratamiento</SelectItem>
                        <SelectItem value="lost_to_followup">Perdido en seguimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Resultado clínico</Label>
                    <Textarea
                      value={clinicalOutcome}
                      onChange={(e) => setClinicalOutcome(e.target.value)}
                      placeholder="Describe el resultado del tratamiento..."
                      className="mt-1 min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Satisfacción del paciente</Label>
                      <Select value={satisfaction} onValueChange={setSatisfaction}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">⭐ Muy insatisfecho</SelectItem>
                          <SelectItem value="2">⭐⭐ Insatisfecho</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ Neutral</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ Satisfecho</SelectItem>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ Muy satisfecho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Complicaciones (opcional)</Label>
                      <Input
                        value={complications}
                        onChange={(e) => setComplications(e.target.value)}
                        placeholder="Si aplica..."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRecordOutcome}
                      disabled={outcomeLoading}
                      className="flex-1"
                    >
                      Registrar
                    </Button>
                    <Button
                      onClick={() => setShowOutcomeForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resultado Registrado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de resultado</p>
                  <Badge className="mt-1">{outcome.outcome_type}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Resultado clínico</p>
                  <p className="text-sm text-gray-800 mt-1">{outcome.clinical_outcome}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción del paciente</p>
                  <p className="text-sm mt-1 flex items-center">
                    {'⭐'.repeat(outcome.patient_satisfaction)}
                    <span className="ml-2 text-gray-600">({outcome.patient_satisfaction}/5)</span>
                  </p>
                </div>

                {outcome.complications && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Complicaciones</p>
                    <p className="text-sm text-gray-800 mt-1">{outcome.complications}</p>
                  </div>
                )}

                <p className="text-xs text-gray-600 pt-2 border-t">
                  Registrado: {format(new Date(outcome.outcome_date), 'PPp', { locale: es })}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {(followupError || outcomeError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">Error: {followupError || outcomeError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
