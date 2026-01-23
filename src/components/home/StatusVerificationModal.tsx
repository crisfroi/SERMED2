import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Clock, FileCheck, XCircle } from 'lucide-react';

interface StatusVerificationModalProps {
  open: boolean;
  onClose: () => void;
}

interface SolicitudResult {
  id: string;
  nombre_completo: string;
  codigo_expediente: string;
  estado_solicitud: string;
  fecha_solicitud: string;
  area_profesional: string;
  telefono: string;
}

const estadoConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  Recibido: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Solicitud Recibida' },
  Revisando: { icon: FileCheck, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'En Revisión' },
  'Pendiente de Firma': { icon: FileCheck, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Pendiente de Firma' },
  Aprobado: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Aprobado' },
  Rechazado: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rechazado' },
};

export const StatusVerificationModal: React.FC<StatusVerificationModalProps> = ({ open, onClose }) => {
  const [telefono, setTelefono] = useState('');
  const [codigoExpediente, setCodigoExpediente] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SolicitudResult | null>(null);

  const handleSearch = async () => {
    if (!telefono.trim() || !codigoExpediente.trim()) {
      setError('Por favor, complete ambos campos.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Normalizar teléfono
      let telefonoNorm = telefono.replace(/\s|-/g, '').trim();
      if (!telefonoNorm.startsWith('+')) {
        if (telefonoNorm.startsWith('240')) {
          telefonoNorm = '+' + telefonoNorm;
        } else {
          telefonoNorm = '+240' + telefonoNorm.replace(/^0+/, '');
        }
      }

      const { data, error: dbError } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, codigo_expediente, estado_solicitud, fecha_solicitud, area_profesional, telefono')
        .eq('codigo_expediente', codigoExpediente.trim().toUpperCase())
        .eq('telefono', telefonoNorm)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('No se encontró ninguna solicitud con los datos proporcionados. Verifique el código de expediente y el número de teléfono.');
        return;
      }

      setResult(data);
    } catch (err: any) {
      console.error('Error buscando solicitud:', err);
      setError('Error al buscar la solicitud. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTelefono('');
    setCodigoExpediente('');
    setError('');
    setResult(null);
    onClose();
  };

  const config = result?.estado_solicitud ? estadoConfig[result.estado_solicitud] || estadoConfig.Recibido : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Verificar Estado de Solicitud
          </DialogTitle>
          <DialogDescription>
            Ingrese su código de expediente y número de teléfono para consultar el estado de su solicitud.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Expediente</Label>
              <Input
                id="codigo"
                placeholder="Ej: MED-001-2024"
                value={codigoExpediente}
                onChange={(e) => setCodigoExpediente(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Número de Teléfono</Label>
              <Input
                id="telefono"
                placeholder="+240 222 123 456"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Consultar Estado'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estado destacado */}
            {config && (
              <div className={`${config.bg} ${config.color} p-4 rounded-lg flex items-center gap-3`}>
                <config.icon className="w-8 h-8" />
                <div>
                  <p className="font-semibold text-lg">{config.label}</p>
                  <p className="text-sm opacity-80">Estado actual de su solicitud</p>
                </div>
              </div>
            )}

            {/* Detalles */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{result.nombre_completo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expediente:</span>
                <span className="font-medium">{result.codigo_expediente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Área:</span>
                <span className="font-medium">{result.area_profesional}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha Solicitud:</span>
                <span className="font-medium">
                  {result.fecha_solicitud ? new Date(result.fecha_solicitud).toLocaleDateString('es-ES') : 'N/A'}
                </span>
              </div>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
