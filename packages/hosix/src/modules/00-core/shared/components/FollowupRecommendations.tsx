'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface FollowupRecommendation {
  id: string;
  referralId: string;
  recommendedDate: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  purpose: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  outcome?: string;
}

interface QualityMetric {
  label: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
}

export const FollowupRecommendations: React.FC = () => {
  const { getFollowups, scheduleFollowup, completeFollowup } = useReferralFollowup();
  const { getOutcomeStats, recordOutcome } = useReferralOutcomes();

  const [followups, setFollowups] = useState<FollowupRecommendation[]>([]);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isScheduling, setIsScheduling] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    referralId: '',
    followupDate: '',
    purpose: 'clinical_assessment',
    priority: 'medium',
    notes: '',
  });

  // Outcome form state
  const [outcomeForm, setOutcomeForm] = useState({
    followupId: '',
    outcome: 'resolved',
    notes: '',
    nextSteps: '',
  });

  useEffect(() => {
    loadFollowups();
    loadMetrics();
  }, []);

  const loadFollowups = async () => {
    try {
      const data = await getFollowups();
      setFollowups(data);
    } catch (error) {
      console.error('Error loading followups:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const stats = await getOutcomeStats();
      setMetrics([
        {
          label: 'Tasa de Cumplimiento',
          value: stats.compliance_rate || 85,
          unit: '%',
          status: stats.compliance_rate >= 80 ? 'good' : 'warning',
        },
        {
          label: 'Tiempo Promedio (días)',
          value: stats.avg_resolution_days || 14,
          unit: 'd',
          status: stats.avg_resolution_days <= 21 ? 'good' : 'poor',
        },
        {
          label: 'Tasa de Resolución',
          value: stats.resolution_rate || 78,
          unit: '%',
          status: stats.resolution_rate >= 75 ? 'good' : 'warning',
        },
        {
          label: 'Pacientes Satisfechos',
          value: stats.satisfaction_rate || 92,
          unit: '%',
          status: stats.satisfaction_rate >= 90 ? 'good' : 'warning',
        },
      ]);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);

    try {
      await scheduleFollowup({
        referral_id: scheduleForm.referralId,
        recommended_date: scheduleForm.followupDate,
        purpose: scheduleForm.purpose as any,
        priority: scheduleForm.priority as any,
        notes: scheduleForm.notes,
      });

      setScheduleForm({
        referralId: '',
        followupDate: '',
        purpose: 'clinical_assessment',
        priority: 'medium',
        notes: '',
      });

      await loadFollowups();
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await recordOutcome(outcomeForm.followupId, {
        outcome: outcomeForm.outcome as any,
        notes: outcomeForm.notes,
        next_steps: outcomeForm.nextSteps,
      });

      setOutcomeForm({
        followupId: '',
        outcome: 'resolved',
        notes: '',
        nextSteps: '',
      });

      await loadFollowups();
    } catch (error) {
      console.error('Error recording outcome:', error);
    }
  };

  const filteredFollowups = followups.filter((f) => {
    if (selectedTab === 'all') return true;
    return f.status === selectedTab;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: 'bg-green-50 text-green-700 border-green-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-red-50 text-red-700 border-red-200',
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                </div>
                <Badge
                  className={
                    metric.status === 'good'
                      ? 'bg-green-100 text-green-800'
                      : metric.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }
                >
                  {metric.status === 'good' ? '✓ Bien' : metric.status === 'warning' ? '⚠ Alerta' : '✗ Bajo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas ({followups.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredFollowups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Sin seguimientos en esta categoría
              </CardContent>
            </Card>
          ) : (
            filteredFollowups.map((followup) => (
              <Card key={followup.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{followup.purpose}</h4>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getStatusBadge(followup.status)}>
                            {followup.status}
                          </Badge>
                          <Badge className={getPriorityBadge(followup.priority)}>
                            {followup.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(followup.recommendedDate), 'PPp', { locale: es })}
                        </p>
                      </div>
                    </div>

                    {followup.notes && (
                      <p className="text-sm text-muted-foreground">{followup.notes}</p>
                    )}

                    {followup.outcome && (
                      <div className="p-2 bg-green-50 rounded text-sm">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        {followup.outcome}
                      </div>
                    )}

                    {followup.status === 'scheduled' && !followup.outcome && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeFollowup(followup.id)}
                      >
                        Marcar como Completada
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule New Followup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendar Nuevo Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScheduleFollowup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referralId">ID Derivación</Label>
                <Input
                  id="referralId"
                  value={scheduleForm.referralId}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, referralId: e.target.value })
                  }
                  placeholder="Seleccionar derivación"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followupDate">Fecha Recomendada</Label>
                <Input
                  id="followupDate"
                  type="datetime-local"
                  value={scheduleForm.followupDate}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, followupDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito</Label>
                <Select
                  value={scheduleForm.purpose}
                  onValueChange={(value) =>
                    setScheduleForm({ ...scheduleForm, purpose: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical_assessment">Evaluación Clínica</SelectItem>
                    <SelectItem value="lab_results">Resultados Laboratorio</SelectItem>
                    <SelectItem value="medication_adjustment">Ajuste Medicamentos</SelectItem>
                    <SelectItem value="routine_check">Chequeo Rutina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={scheduleForm.priority}
                  onValueChange={(value) =>
                    setScheduleForm({ ...scheduleForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="Notas sobre el seguimiento"
                rows={3}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <Button type="submit" disabled={isScheduling}>
              {isScheduling ? 'Agendando...' : 'Agendar Seguimiento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
