// @ts-nocheck
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface ExperienciaItem {
  funcion: string;
  institucion: string;
  periodo: string;
}

interface ExperienciaLaboralProps {
  form: UseFormReturn<any>;
}

export const ExperienciaLaboral: React.FC<ExperienciaLaboralProps> = ({ form }) => {
  const experiencias = form.watch('experiencia_laboral') || [];

  const addExperiencia = () => {
    const current = form.getValues('experiencia_laboral') || [];
    if (current.length < 3) {
      form.setValue('experiencia_laboral', [...current, { funcion: '', institucion: '', periodo: '' }]);
    }
  };

  const removeExperiencia = (index: number) => {
    const current = form.getValues('experiencia_laboral') || [];
    form.setValue('experiencia_laboral', current.filter((_: any, i: number) => i !== index));
  };

  const updateExperiencia = (index: number, field: keyof ExperienciaItem, value: string) => {
    const current = form.getValues('experiencia_laboral') || [];
    const updated = [...current];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      form.setValue('experiencia_laboral', updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Experiencia Laboral (máx. 3)</Label>
        {experiencias.length < 3 && (
          <Button type="button" variant="outline" size="sm" onClick={addExperiencia}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {experiencias.length === 0 && (
        <p className="text-sm text-gray-500 italic">No se ha agregado experiencia laboral (opcional).</p>
      )}

      {experiencias.map((exp: ExperienciaItem, idx: number) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Experiencia #{idx + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeExperiencia(idx)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Función / Puesto</Label>
              <Input
                placeholder="Ej: Médico General"
                value={exp.funcion || ''}
                onChange={(e) => updateExperiencia(idx, 'funcion', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Institución</Label>
              <Input
                placeholder="Ej: Hospital Regional Bata"
                value={exp.institucion || ''}
                onChange={(e) => updateExperiencia(idx, 'institucion', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Input
                placeholder="Ej: 2019 - 2022"
                value={exp.periodo || ''}
                onChange={(e) => updateExperiencia(idx, 'periodo', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
