// @ts-nocheck
import React, { useState } from 'react';
import { useHosixMedicos, Interconsulta } from '@/hooks/useHosixMedicos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Plus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface InterconsultasProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
}

export default function Interconsultas({
  pacienteId,
  episodioId,
  tipoEpisodio,
  worklistId,
}: InterconsultasProps) {
  const { toast } = useToast();
  const { obtenerInterconsultas, crearInterconsultaMutation, responderInterconsultaMutation } =
    useHosixMedicos();
  const { data: interconsultas = [], isLoading } = obtenerInterconsultas(pacienteId, episodioId);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Interconsulta>>({
    paciente_id: pacienteId,
    episodio_id: episodioId,
    tipo_episodio: tipoEpisodio,
    worklist_id: worklistId,
    urgencia: 'normal',
    estado: 'pendiente',
  });

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hosix_servicios' as any)
        .select('id, nombre')
        .eq('activo', true) as any);
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.servicio_destino_id || !formData.motivo_interconsulta) {
      toast({
        title: 'Error',
        description: 'Servicio destino y motivo son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      await crearInterconsultaMutation.mutateAsync(formData);

      toast({
        title: 'Interconsulta creada',
        description: 'La interconsulta se ha creado correctamente.',
      });

      setFormData({
        paciente_id: pacienteId,
        episodio_id: episodioId,
        tipo_episodio: tipoEpisodio,
        worklist_id: worklistId,
        urgencia: 'normal',
        estado: 'pendiente',
      });
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear interconsulta',
        variant: 'destructive',
      });
    }
  };

  const handleResponder = async (id: string, respuesta: string, recomendaciones: string) => {
    try {
      await responderInterconsultaMutation.mutateAsync({
        id,
        respuesta_medica: respuesta,
        recomendaciones,
      });

      toast({
        title: 'Respuesta enviada',
        description: 'La respuesta a la interconsulta se ha registrado.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al responder interconsulta',
        variant: 'destructive',
      });
    }
  };

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Interconsultas Médicas
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancelar' : 'Nueva Interconsulta'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Interconsulta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Servicio Destino *</Label>
                  <Select
                    value={formData.servicio_destino_id || ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, servicio_destino_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map((serv: any) => (
                        <SelectItem key={serv.id} value={serv.id}>
                          {serv.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgencia</Label>
                  <Select
                    value={formData.urgencia}
                    onValueChange={(value) => setFormData({ ...formData, urgencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo de Interconsulta *</Label>
                <Textarea
                  placeholder="Describa el motivo de la interconsulta..."
                  value={formData.motivo_interconsulta || ''}
                  onChange={(e) => setFormData({ ...formData, motivo_interconsulta: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Pregunta Clínica</Label>
                <Textarea
                  placeholder="Formule la pregunta clínica específica..."
                  value={formData.pregunta_clinica || ''}
                  onChange={(e) => setFormData({ ...formData, pregunta_clinica: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Antecedentes Relevantes</Label>
                <Textarea
                  placeholder="Antecedentes relevantes para la interconsulta..."
                  value={formData.antecedentes_relevantes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, antecedentes_relevantes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearInterconsultaMutation.isPending}>
                  {crearInterconsultaMutation.isPending ? 'Enviando...' : 'Enviar Interconsulta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interconsultas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando interconsultas...</p>
            </div>
          ) : interconsultas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay interconsultas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Servicio Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interconsultas.map((inter: any) => (
                  <TableRow key={inter.id}>
                    <TableCell className="text-sm">{formatearFecha(inter.fecha_solicitud)}</TableCell>
                    <TableCell>{(inter.servicio_destino as any)?.nombre || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{inter.motivo_interconsulta}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          inter.urgencia === 'critica'
                            ? 'bg-red-600'
                            : inter.urgencia === 'alta'
                            ? 'bg-orange-600'
                            : 'bg-blue-600'
                        }
                      >
                        {inter.urgencia.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          inter.estado === 'respondida'
                            ? 'bg-green-600'
                            : inter.estado === 'pendiente'
                            ? 'bg-yellow-600'
                            : 'bg-gray-600'
                        }
                      >
                        {inter.estado.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inter.estado === 'pendiente' && (
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

