import React, { useState, useEffect } from 'react';
import { useHosixMedicos } from '@/hooks/useHosixMedicos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Pill, Plus, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { checkPatientDrugInteractions, InteractionCheckResult } from '@/lib/drugbank/interactions';

interface PrescripcionProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
  onClose?: () => void;
}

export default function Prescripcion({
  pacienteId,
  episodioId,
  tipoEpisodio,
  worklistId,
  onClose,
}: PrescripcionProps) {
  const { toast } = useToast();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [interacciones, setInteracciones] = useState<InteractionCheckResult[]>([]);
  const [verificandoInteracciones, setVerificandoInteracciones] = useState(false);
  const [medicamentoActual, setMedicamentoActual] = useState({
    medicamento_id: '',
    medicamento_texto: '',
    dosis: '',
    frecuencia: '',
    via_administracion: '',
    duracion_dias: '',
    instrucciones: '',
  });

  const { data: medicamentosList = [] } = useQuery({
    queryKey: ['medicamentos'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hosix_medicamentos' as any)
        .select('id, nombre_comercial, principio_activo')
        .eq('activo', true)
        .limit(100) as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Verificar interacciones cuando cambian los medicamentos
  useEffect(() => {
    const verificarInteracciones = async () => {
      if (medicamentos.length === 0) {
        setInteracciones([]);
        return;
      }

      setVerificandoInteracciones(true);
      try {
        const ultimoMed = medicamentos[medicamentos.length - 1];
        const interaccionesEncontradas = await checkPatientDrugInteractions(
          pacienteId,
          ultimoMed.medicamento_id,
          ultimoMed.medicamento_texto
        );
        setInteracciones(interaccionesEncontradas);

        // Mostrar alertas para interacciones graves o críticas
        const interaccionesGraves = interaccionesEncontradas.filter(
          (i) => i.severidad === 'grave' || i.severidad === 'critica'
        );
        if (interaccionesGraves.length > 0) {
          toast({
            title: '⚠️ Interacciones Medicamentosas Detectadas',
            description: `Se encontraron ${interaccionesGraves.length} interacción(es) grave(s) o crítica(s)`,
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error verificando interacciones:', error);
      } finally {
        setVerificandoInteracciones(false);
      }
    };

    verificarInteracciones();
  }, [medicamentos, pacienteId, toast]);

  const handleAgregarMedicamento = async () => {
    if (!medicamentoActual.medicamento_texto && !medicamentoActual.medicamento_id) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar o escribir un medicamento',
        variant: 'destructive',
      });
      return;
    }

    // Verificar interacciones antes de agregar
    setVerificandoInteracciones(true);
    try {
      const interaccionesEncontradas = await checkPatientDrugInteractions(
        pacienteId,
        medicamentoActual.medicamento_id,
        medicamentoActual.medicamento_texto
      );

      // Si hay interacciones críticas, pedir confirmación
      const interaccionesCriticas = interaccionesEncontradas.filter(
        (i) => i.severidad === 'critica'
      );

      if (interaccionesCriticas.length > 0) {
        const confirmar = window.confirm(
          `⚠️ ADVERTENCIA: Se detectaron ${interaccionesCriticas.length} interacción(es) CRÍTICA(S). ¿Desea continuar?`
        );
        if (!confirmar) {
          setVerificandoInteracciones(false);
          return;
        }
      }

      setMedicamentos([...medicamentos, { ...medicamentoActual, id: Date.now() }]);
      setMedicamentoActual({
        medicamento_id: '',
        medicamento_texto: '',
        dosis: '',
        frecuencia: '',
        via_administracion: '',
        duracion_dias: '',
        instrucciones: '',
      });
    } catch (error) {
      console.error('Error verificando interacciones:', error);
      // Continuar agregando el medicamento aunque falle la verificación
      setMedicamentos([...medicamentos, { ...medicamentoActual, id: Date.now() }]);
      setMedicamentoActual({
        medicamento_id: '',
        medicamento_texto: '',
        dosis: '',
        frecuencia: '',
        via_administracion: '',
        duracion_dias: '',
        instrucciones: '',
      });
    } finally {
      setVerificandoInteracciones(false);
    }
  };

  const handleEliminarMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const handleGuardarPrescripcion = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      for (const med of medicamentos) {
        await (supabase
          .from('hosix_prescripciones' as any)
          .insert([
            {
              paciente_id: pacienteId,
              episodio_id: episodioId,
              medicamento_id: med.medicamento_id || null,
              medicamento_texto: med.medicamento_texto,
              dosis: med.dosis,
              frecuencia: med.frecuencia,
              via_administracion: med.via_administracion,
              duracion_dias: parseInt(med.duracion_dias) || null,
              instrucciones: med.instrucciones,
              prescriptor_id: user.user?.id,
              fecha_prescripcion: new Date().toISOString(),
              estado: 'activa',
            },
          ]) as any);
      }

      toast({
        title: 'Prescripción guardada',
        description: `${medicamentos.length} medicamento(s) prescrito(s) correctamente.`,
      });

      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar prescripción',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Prescripción Médica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Medicamento</Label>
            <Select
              value={medicamentoActual.medicamento_id}
              onValueChange={(value) => {
                const med = medicamentosList.find((m: any) => m.id === value);
                setMedicamentoActual({
                  ...medicamentoActual,
                  medicamento_id: value,
                  medicamento_texto: med?.nombre_comercial || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Buscar medicamento..." />
              </SelectTrigger>
              <SelectContent>
                {medicamentosList.map((med: any) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.nombre_comercial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>O escribir manualmente</Label>
            <Input
              placeholder="Nombre del medicamento"
              value={medicamentoActual.medicamento_texto}
              onChange={(e) =>
                setMedicamentoActual({ ...medicamentoActual, medicamento_texto: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Dosis</Label>
            <Input
              placeholder="Ej: 500mg"
              value={medicamentoActual.dosis}
              onChange={(e) => setMedicamentoActual({ ...medicamentoActual, dosis: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Input
              placeholder="Ej: Cada 8h"
              value={medicamentoActual.frecuencia}
              onChange={(e) =>
                setMedicamentoActual({ ...medicamentoActual, frecuencia: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Vía</Label>
            <Select
              value={medicamentoActual.via_administracion}
              onValueChange={(value) =>
                setMedicamentoActual({ ...medicamentoActual, via_administracion: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Vía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oral">Oral</SelectItem>
                <SelectItem value="intravenosa">IV</SelectItem>
                <SelectItem value="intramuscular">IM</SelectItem>
                <SelectItem value="subcutanea">SC</SelectItem>
                <SelectItem value="topica">Tópica</SelectItem>
                <SelectItem value="inhalatoria">Inhalatoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duración (días)</Label>
            <Input
              type="number"
              placeholder="7"
              value={medicamentoActual.duracion_dias}
              onChange={(e) =>
                setMedicamentoActual({ ...medicamentoActual, duracion_dias: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Instrucciones</Label>
          <Textarea
            placeholder="Instrucciones adicionales para el paciente..."
            value={medicamentoActual.instrucciones}
            onChange={(e) =>
              setMedicamentoActual({ ...medicamentoActual, instrucciones: e.target.value })
            }
            rows={2}
          />
        </div>

        <Button
          type="button"
          onClick={handleAgregarMedicamento}
          className="w-full"
          disabled={verificandoInteracciones}
        >
          <Plus className="h-4 w-4 mr-2" />
          {verificandoInteracciones ? 'Verificando interacciones...' : 'Agregar a Prescripción'}
        </Button>

        {/* Alertas de interacciones */}
        {interacciones.length > 0 && (
          <div className="space-y-2">
            {interacciones.map((interaccion, idx) => (
              <Alert
                key={idx}
                variant={
                  interaccion.severidad === 'critica' || interaccion.severidad === 'grave'
                    ? 'destructive'
                    : 'default'
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Interacción {interaccion.severidad.toUpperCase()}: {interaccion.medicamento1_nombre} +{' '}
                  {interaccion.medicamento2_nombre}
                </AlertTitle>
                <AlertDescription>
                  <p className="font-medium">{interaccion.descripcion}</p>
                  {interaccion.recomendacion && (
                    <p className="mt-2 text-sm">Recomendación: {interaccion.recomendacion}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fuente: {interaccion.fuente === 'drugbank' ? 'DrugBank' : 'Base de datos local'}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {medicamentos.length > 0 && (
          <div className="space-y-2">
            <Label>Medicamentos Prescritos ({medicamentos.length})</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Vía</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicamentos.map((med, index) => (
                  <TableRow key={med.id}>
                    <TableCell>{med.medicamento_texto}</TableCell>
                    <TableCell>{med.dosis}</TableCell>
                    <TableCell>{med.frecuencia}</TableCell>
                    <TableCell>{med.via_administracion}</TableCell>
                    <TableCell>{med.duracion_dias} días</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEliminarMedicamento(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleGuardarPrescripcion}
            disabled={medicamentos.length === 0}
          >
            Guardar Prescripción
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

