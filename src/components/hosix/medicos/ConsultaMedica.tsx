// @ts-nocheck
import React, { useState } from 'react';
import { useHosixMedicos } from '@/hooks/useHosixMedicos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, FileText, Pill, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsultaMedicaProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
  onClose?: () => void;
}

export default function ConsultaMedica({
  pacienteId,
  episodioId,
  tipoEpisodio,
  worklistId,
  onClose,
}: ConsultaMedicaProps) {
  const { toast } = useToast();
  const { crearConsultaMutation, obtenerDiagnosticos, crearDiagnosticoMutation } = useHosixMedicos();
  const { data: diagnosticos = [] } = obtenerDiagnosticos(pacienteId, episodioId);

  const [formData, setFormData] = useState({
    paciente_id: pacienteId,
    episodio_id: episodioId,
    tipo_episodio: tipoEpisodio,
    worklist_id: worklistId,
    motivo_consulta: '',
    enfermedad_actual: '',
    antecedentes_personales: '',
    antecedentes_familiares: '',
    alergias: [] as string[],
    medicamentos_actuales: [] as any[],
    exploracion_fisica: {} as Record<string, any>,
    plan_terapeutico: '',
    observaciones: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await crearConsultaMutation.mutateAsync(formData);

      toast({
        title: 'Consulta registrada',
        description: 'La consulta médica se ha registrado correctamente.',
      });

      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar consulta',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Consulta Médica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="anamnesis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="anamnesis">Anamnesis</TabsTrigger>
              <TabsTrigger value="exploracion">Exploración</TabsTrigger>
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="anamnesis" className="space-y-4">
              <div className="space-y-2">
                <Label>Motivo de Consulta</Label>
                <Textarea
                  placeholder="Describa el motivo de consulta..."
                  value={formData.motivo_consulta}
                  onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Enfermedad Actual</Label>
                <Textarea
                  placeholder="Historia de la enfermedad actual..."
                  value={formData.enfermedad_actual}
                  onChange={(e) => setFormData({ ...formData, enfermedad_actual: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antecedentes Personales</Label>
                  <Textarea
                    placeholder="Antecedentes personales relevantes..."
                    value={formData.antecedentes_personales}
                    onChange={(e) => setFormData({ ...formData, antecedentes_personales: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Antecedentes Familiares</Label>
                  <Textarea
                    placeholder="Antecedentes familiares relevantes..."
                    value={formData.antecedentes_familiares}
                    onChange={(e) => setFormData({ ...formData, antecedentes_familiares: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exploracion" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>TA (mmHg)</Label>
                  <Input
                    placeholder="120/80"
                    value={formData.exploracion_fisica.ta || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, ta: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>FC (lpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={formData.exploracion_fisica.fc || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, fc: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>FR (rpm)</Label>
                  <Input
                    type="number"
                    placeholder="16"
                    value={formData.exploracion_fisica.fr || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, fr: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={formData.exploracion_fisica.temp || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, temp: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={formData.exploracion_fisica.peso || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, peso: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Talla (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="170"
                    value={formData.exploracion_fisica.talla || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exploracion_fisica: { ...formData.exploracion_fisica, talla: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exploración Física Detallada</Label>
                <Textarea
                  placeholder="Describa la exploración física completa..."
                  rows={5}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exploracion_fisica: { ...formData.exploracion_fisica, detalle: e.target.value },
                    })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-4">
              <div className="space-y-2">
                <Label>Diagnóstico Principal</Label>
                <Input
                  placeholder="Código CIE-10 o descripción"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diagnosticos_principales: [e.target.value],
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Diagnósticos Secundarios</Label>
                <Textarea
                  placeholder="Diagnósticos secundarios (uno por línea)"
                  rows={4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diagnosticos_secundarios: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                />
              </div>
              {diagnosticos.length > 0 && (
                <div className="space-y-2">
                  <Label>Diagnósticos Previos</Label>
                  <div className="space-y-1">
                    {diagnosticos.slice(0, 5).map((diag: any) => (
                      <Badge key={diag.id} variant="outline" className="mr-2">
                        {diag.descripcion_diagnostico}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plan" className="space-y-4">
              <div className="space-y-2">
                <Label>Plan Terapéutico</Label>
                <Textarea
                  placeholder="Describa el plan terapéutico..."
                  value={formData.plan_terapeutico}
                  onChange={(e) => setFormData({ ...formData, plan_terapeutico: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={crearConsultaMutation.isPending}>
              {crearConsultaMutation.isPending ? 'Guardando...' : 'Guardar Consulta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

