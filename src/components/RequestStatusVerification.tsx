// @ts-nocheck
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Phone,
  FileCheck,
  Search,
} from 'lucide-react';

interface RequestStatusVerificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusIcon = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case 'recibido':
      return <Clock className="w-4 h-4" />;
    case 'aprobado':
      return <CheckCircle className="w-4 h-4" />;
    case 'rechazado':
      return <AlertCircle className="w-4 h-4" />;
    case 'pendiente de firma':
      return <FileCheck className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusBadgeColor = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case 'recibido':
      return 'bg-blue-100 text-blue-800';
    case 'aprobado':
      return 'bg-green-100 text-green-800';
    case 'rechazado':
      return 'bg-red-100 text-red-800';
    case 'pendiente de firma':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const RequestStatusVerification = ({
  isOpen,
  onClose,
}: RequestStatusVerificationProps) => {
  const { toast } = useToast();
  const [expediente, setExpediente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const normalizeTelefono = (tel: string): string => {
    if (!tel) return '';
    let v = tel.replace(/\s|-/g, '');
    if (v.startsWith('+240')) return v;
    if (v.startsWith('00240')) return '+' + v.slice(2);
    if (v.startsWith('240')) return '+' + v;
    if (v.startsWith('+')) return v;
    v = v.replace(/^0+/, '');
    return '+240' + v;
  };

  const handleSearch = async () => {
    if (!expediente.trim() || !telefono.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor ingrese número de expediente y teléfono',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const telefonoNorm = normalizeTelefono(telefono);

      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select(
          'id, codigo_expediente, nombre_completo, area_profesional, estado_solicitud, fecha_solicitud, telefono'
        )
        .eq('codigo_expediente', expediente.toUpperCase())
        .eq('telefono', telefonoNorm)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult(data);
      } else {
        setNotFound(true);
        toast({
          title: 'Solicitud no encontrada',
          description: 'No se encontró solicitud con estos datos',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      toast({
        title: 'Error en búsqueda',
        description: error.message || 'Hubo un error al buscar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExpediente('');
    setTelefono('');
    setResult(null);
    setNotFound(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verificar Estado de Solicitud</DialogTitle>
          <DialogDescription>
            Ingrese su número de expediente y teléfono para verificar el estado
            de su solicitud
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expediente">Número de Expediente</Label>
                <Input
                  id="expediente"
                  placeholder="Ej: EXP-2025-00001"
                  value={expediente}
                  onChange={(e) => setExpediente(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Número de Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: +240 999 123456 o 999123456"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleSearch}
                disabled={loading || !expediente.trim() || !telefono.trim()}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar Solicitud'}
              </Button>

              {notFound && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se encontró solicitud con estos datos. Verifique que el
                    número de expediente y teléfono sean correctos.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {result && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {result.nombre_completo}
                    </CardTitle>
                    <Badge className={getStatusBadgeColor(result.estado_solicitud)}>
                      {getStatusIcon(result.estado_solicitud)}
                      <span className="ml-1">{result.estado_solicitud}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Código de Expediente:</span>
                      <p className="text-gray-700">{result.codigo_expediente}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Área Profesional:</span>
                      <p className="text-gray-700">{result.area_profesional}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Teléfono:</span>
                      <p className="text-gray-700">{result.telefono}</p>
                    </div>
                    {result.fecha_solicitud && (
                      <div>
                        <span className="font-semibold">Fecha de Solicitud:</span>
                        <p className="text-gray-700">
                          {new Date(result.fecha_solicitud).toLocaleDateString(
                            'es-ES'
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.estado_solicitud === 'Recibido' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Su solicitud ha sido recibida y se encuentra en proceso de
                        revisión.
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.estado_solicitud === 'Aprobado' && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ¡Felicidades! Su solicitud ha sido aprobada. Puede descargar
                        su carnet profesional.
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.estado_solicitud === 'Rechazado' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Su solicitud ha sido rechazada. Por favor, contacte al
                        Ministerio de Sanidad para obtener más información.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                Nueva Búsqueda
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
