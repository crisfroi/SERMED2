// @ts-nocheck
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface DeliveryFormProps {
  pregnancyId: string;
  onSuccess?: () => void;
}

interface DeliveryFormData {
  delivery_mode: 'vaginal' | 'cesarean' | 'assisted_vaginal';
  anesthesia_type: string;
  blood_loss_ml: number;
  episiotomy: boolean;
  tears_degree: number;
  maternal_complications: string[];
  fetal_complications: string[];
  notes: string;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({ pregnancyId, onSuccess }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DeliveryFormData>({
    defaultValues: {
      delivery_mode: 'vaginal',
      anesthesia_type: 'none',
      blood_loss_ml: 0,
      episiotomy: false,
      tears_degree: 0,
      maternal_complications: [],
      fetal_complications: [],
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const deliveryMode = watch('delivery_mode');
  const bloodLoss = watch('blood_loss_ml');
  const isEpisiotomy = watch('episiotomy');

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery')
        .insert({
          pregnancy_id: pregnancyId,
          delivery_datetime: new Date().toISOString(),
          delivery_mode: data.delivery_mode,
          anesthesia_type: data.anesthesia_type,
          blood_loss_ml: data.blood_loss_ml,
          episiotomy: data.episiotomy,
          tears_degree: data.tears_degree,
          maternal_complications: data.maternal_complications,
          fetal_complications: data.fetal_complications,
        });

      if (error) throw error;
      
      setMessage({ type: 'success', text: '✅ Parto registrado exitosamente' });
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Error: ${(err as any).message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registro de Parto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mensajes */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* Modo de Parto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Modo de Parto *</label>
            <select
              {...register('delivery_mode', { required: 'Requerido' })}
              className="w-full border rounded-md p-2"
            >
              <option value="vaginal">Parto Vaginal</option>
              <option value="cesarean">Cesárea</option>
              <option value="assisted_vaginal">Parto Vaginal Asistido</option>
            </select>
            {errors.delivery_mode && <p className="text-red-500 text-xs">{errors.delivery_mode.message}</p>}
          </div>

          {/* Tipo de Anestesia */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Anestesia</label>
            <select
              {...register('anesthesia_type')}
              className="w-full border rounded-md p-2"
            >
              <option value="none">Ninguna</option>
              <option value="local">Local</option>
              <option value="regional">Regional (Epidural/Raquídea)</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Sangrado */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pérdida de Sangre (ml)</label>
            <input
              type="number"
              {...register('blood_loss_ml', { min: 0 })}
              className="w-full border rounded-md p-2"
              placeholder="Ej: 500"
            />
            {bloodLoss > 1000 && (
              <Badge variant="destructive">Hemorragia postparto significativa</Badge>
            )}
          </div>

          {/* Episiotomía */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('episiotomy')}
              className="h-4 w-4"
            />
            <label className="text-sm">Episiotomía realizada</label>
          </div>

          {/* Grado de desgarro */}
          {isEpisiotomy && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Grado de Desgarro</label>
              <select
                {...register('tears_degree', { valueAsNumber: true })}
                className="w-full border rounded-md p-2"
              >
                <option value={0}>Ninguno</option>
                <option value={1}>1er grado (superficial)</option>
                <option value={2}>2do grado (perineal)</option>
                <option value={3}>3er grado (esfínter)</option>
                <option value={4}>4to grado (completo)</option>
              </select>
            </div>
          )}

          {/* Complicaciones Maternales */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Complicaciones Maternales</label>
            <div className="space-y-2">
              {['Hemorragia', 'Infección', 'Tromboembolismo', 'Eclampsia', 'Otra'].map((comp) => (
                <label key={comp} className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-sm">{comp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Complicaciones Fetales */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Complicaciones Fetales</label>
            <textarea
              {...register('fetal_complications')}
              placeholder="Ej: Sufrimiento fetal, meconio..."
              className="w-full border rounded-md p-2 h-20"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Parto'}
            </Button>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DeliveryForm;
