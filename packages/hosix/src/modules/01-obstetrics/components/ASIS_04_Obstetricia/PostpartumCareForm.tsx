import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/services/supabaseClient';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PostpartumCareFormProps {
  deliveryId: string;
  pregnancyId: string;
  onSuccess?: () => void;
}

interface PostpartumFormData {
  daysPostpartum: number;
  lochiaType: 'lochia_rubra' | 'lochia_serosa' | 'lochia_alba';
  lochiaVolume: 'normal' | 'excessive' | 'scanty';
  vitalSigns: {
    temperature: number;
    bloodPressure: string;
    heartRate: number;
  };
  involutionStatus: 'normal' | 'slow' | 'rapid';
  uteringHeight: number; // In centimeters
  cervicalStatus: 'closed' | 'slight_open' | 'open';
  infectionSigns: boolean;
  infectionDetails?: string;
  thromboembolismSigns: boolean;
  thromboembolismDetails?: string;
  eclampsiaSigns: boolean;
  eclampsiaamDetails?: string;
  breastfeedingStatus: 'exclusive' | 'mixed' | 'formula';
  breastfeedingDifficulties: string;
  psychologicalStatus: 'good' | 'anxious' | 'depressed' | 'concerning';
  psychologicalDetails?: string;
  bonding: 'excellent' | 'good' | 'concerning';
  consultedPlanningFamily: boolean;
  contraceptionMethod?: string;
  additionalFindings?: string;
}

const POSTPARTUM_DANGER_SIGNS = [
  'Fiebre > 38.5°C',
  'Sangrado vaginal excesivo',
  'Dolor abdominal severo',
  'Edema facial/extremidades',
  'Síntomas de infección de herida',
  'Depresión posparto severa',
  'Pensamientos suicidas',
  'Alucinaciones',
];

export const PostpartumCareForm: React.FC<PostpartumCareFormProps> = ({
  deliveryId,
  pregnancyId,
  onSuccess,
}) => {
  const { watch, setValue } = useForm<PostpartumFormData>({
    defaultValues: {
      vitalSigns: {
        temperature: 37,
        heartRate: 70,
      },
    },
  });

  const [formData, setFormData] = useState<PostpartumFormData>({
    daysPostpartum: 1,
    lochiaType: 'lochia_rubra',
    lochiaVolume: 'normal',
    vitalSigns: {
      temperature: 37,
      bloodPressure: '120/80',
      heartRate: 70,
    },
    involutionStatus: 'normal',
    uteringHeight: 12,
    cervicalStatus: 'closed',
    infectionSigns: false,
    thromboembolismSigns: false,
    eclampsiaSigns: false,
    breastfeedingStatus: 'exclusive',
    breastfeedingDifficulties: '',
    psychologicalStatus: 'good',
    bonding: 'good',
    consultedPlanningFamily: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Validaciones básicas
      if (formData.daysPostpartum < 0 || formData.daysPostpartum > 42) {
        throw new Error('Los días posparto deben estar entre 0 y 42');
      }

      if (formData.vitalSigns.temperature > 40) {
        throw new Error('Verificar temperatura alta (posible fiebre parperal)');
      }

      // Insertar registro de cuidado posparto
      const { error: insertError } = await supabase.from('puerperium').insert([
        {
          delivery_id: deliveryId,
          pregnancy_id: pregnancyId,
          days_postpartum: formData.daysPostpartum,
          lochia_type: formData.lochiaType,
          lochia_volume: formData.lochiaVolume,
          temperature: formData.vitalSigns.temperature,
          blood_pressure: formData.vitalSigns.bloodPressure,
          heart_rate: formData.vitalSigns.heartRate,
          involution_status: formData.involutionStatus,
          uterine_height_cm: formData.uteringHeight,
          cervical_status: formData.cervicalStatus,
          infection_sign: formData.infectionSigns,
          infection_details: formData.infectionDetails,
          thromboembolism_sign: formData.thromboembolismSigns,
          thromboembolism_details: formData.thromboembolismDetails,
          eclampsia_sign: formData.eclampsiaSigns,
          eclampsia_details: formData.eclampsiaamDetails,
          breastfeeding_status: formData.breastfeedingStatus,
          breastfeeding_difficulties: formData.breastfeedingDifficulties,
          psychological_status: formData.psychologicalStatus,
          psychological_details: formData.psychologicalDetails,
          mother_baby_bonding: formData.bonding,
          family_planning_consult: formData.consultedPlanningFamily,
          contraception_method: formData.contraceptionMethod,
          additional_findings: formData.additionalFindings,
        },
      ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Cuidado Posparto Registrado</p>
              <p className="text-sm text-green-700">El seguimiento posparto ha sido guardado correctamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Danger Signs Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <p className="font-medium mb-2">⚠️ Signos de Peligro - Requieren Evaluación Urgente:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {POSTPARTUM_DANGER_SIGNS.map((sign, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span>•</span>
                <span>{sign}</span>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* Days Postpartum */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Días de Postparto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0"
              max="42"
              value={formData.daysPostpartum}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  daysPostpartum: parseInt(e.target.value),
                }))
              }
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Badge variant={formData.daysPostpartum <= 7 ? 'destructive' : 'secondary'}>
              {formData.daysPostpartum === 1 && 'Primer día'}
              {formData.daysPostpartum === 7 && 'Primera semana'}
              {formData.daysPostpartum > 7 && formData.daysPostpartum <= 14 && 'Dos semanas'}
              {formData.daysPostpartum > 14 && formData.daysPostpartum <= 42 && 'Cuarentena'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lochia Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluación de Loquios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Lochia</label>
            <Select
              value={formData.lochiaType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  lochiaType: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lochia_rubra">
                  Lochia Rubra - Rojo oscuro (0-3 días)
                </SelectItem>
                <SelectItem value="lochia_serosa">
                  Lochia Serosa - Marrón (4-14 días)
                </SelectItem>
                <SelectItem value="lochia_alba">
                  Lochia Alba - Blanco/amarillento (>15 días)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Volumen de Sangrado</label>
            <Select
              value={formData.lochiaVolume}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  lochiaVolume: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scanty">Escaso (&lt;1 toalla/día)</SelectItem>
                <SelectItem value="normal">Normal (1-3 toallas/día)</SelectItem>
                <SelectItem value="excessive">&gt;4 toallas/día ⚠️</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.lochiaVolume === 'excessive' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Sangrado vaginal excesivo puede indicar retención de placenta o coagulopatía. Considerar referencia.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signos Vitales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                min="35"
                max="40"
                value={formData.vitalSigns.temperature}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      temperature: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tensión Arterial</label>
              <input
                type="text"
                placeholder="120/80"
                value={formData.vitalSigns.bloodPressure}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      bloodPressure: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Frecuencia Cardíaca</label>
              <input
                type="number"
                min="40"
                max="120"
                value={formData.vitalSigns.heartRate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      heartRate: parseInt(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {formData.vitalSigns.temperature >= 38.5 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Fiebre ≥38.5°C sugiere fiebre parperal. Evaluar infección.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Involution Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluación de Involución Uterina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Altura Uterina (cm desde sínfisis pubiana)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.uteringHeight}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  uteringHeight: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-md mb-2"
            />
            <p className="text-xs text-gray-600">
              Día 1: ~12 cm | Día 3: ~9 cm | Día 7: ~6 cm | Semana 2: ~2 cm
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estatus de Involución</label>
            <Select
              value={formData.involutionStatus}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  involutionStatus: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Involución Normal</SelectItem>
                <SelectItem value="slow">Involución Lenta (útero persistentemente grande)</SelectItem>
                <SelectItem value="rapid">Involución Rápida (poco común)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estatus Cervical</label>
            <Select
              value={formData.cervicalStatus}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  cervicalStatus: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closed">Cerrado</SelectItem>
                <SelectItem value="slight_open">Ligeramente abierto</SelectItem>
                <SelectItem value="open">Abierto ⚠️</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complications Screening */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detección de Complicaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Infection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.infectionSigns}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    infectionSigns: checked as boolean,
                  }))
                }
                id="infection"
              />
              <label htmlFor="infection" className="font-medium cursor-pointer">
                Signos de Infección
              </label>
            </div>

            {formData.infectionSigns && (
              <Textarea
                placeholder="Describir síntomas de infección (fiebre, lochia purulenta, dolor abdominal, etc.)"
                value={formData.infectionDetails || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    infectionDetails: e.target.value,
                  }))
                }
                className="text-sm ml-6"
              />
            )}
          </div>

          {/* Thromboembolism */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.thromboembolismSigns}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    thromboembolismSigns: checked as boolean,
                  }))
                }
                id="thromboembolism"
              />
              <label htmlFor="thromboembolism" className="font-medium cursor-pointer">
                Signos de Tromboembolismo
              </label>
            </div>

            {formData.thromboembolismSigns && (
              <Textarea
                placeholder="Describir síntomas (dolor en pantorrilla, hinchazón, calor, enrojecimiento, disnea, chest pain)"
                value={formData.thromboembolismDetails || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thromboembolismDetails: e.target.value,
                  }))
                }
                className="text-sm ml-6"
              />
            )}
          </div>

          {/* Eclampsia */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.eclampsiaSigns}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    eclampsiaSigns: checked as boolean,
                  }))
                }
                id="eclampsia"
              />
              <label htmlFor="eclampsia" className="font-medium cursor-pointer">
                Signos de Eclampsia (URGENCIA)
              </label>
            </div>

            {formData.eclampsiaSigns && (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ⚠️ EMERGENCIA MÉDICA - Convulsiones posparto requieren atención inmediata
                  </AlertDescription>
                </Alert>
                <Textarea
                  placeholder="Describir evento y manejo..."
                  value={formData.eclampsiaamDetails || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      eclampsiaamDetails: e.target.value,
                    }))
                  }
                  className="text-sm ml-6"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breastfeeding & Bonding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lactancia y Vínculo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Estatus de Lactancia</label>
            <Select
              value={formData.breastfeedingStatus}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  breastfeedingStatus: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Lactancia Exclusiva</SelectItem>
                <SelectItem value="mixed">Lactancia Mixta</SelectItem>
                <SelectItem value="formula">Fórmula Exclusivamente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Dificultades con Lactancia</label>
            <Textarea
              placeholder="Grietas, ingurgitación, mastitis, rechazo del bebé, etc."
              value={formData.breastfeedingDifficulties}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  breastfeedingDifficulties: e.target.value,
                }))
              }
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vínculo Madre-Hijo</label>
            <Select
              value={formData.bonding}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  bonding: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excelente - Contacto, cuidados óptimos</SelectItem>
                <SelectItem value="good">Bueno - Cuidados adaptándose</SelectItem>
                <SelectItem value="concerning">Preocupante - Poco interés/rechazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Family Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planificación Familiar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.consultedPlanningFamily}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  consultedPlanningFamily: checked as boolean,
                }))
              }
              id="family-planning"
            />
            <label htmlFor="family-planning" className="font-medium cursor-pointer">
              Se asesoró sobre planificación familiar
            </label>
          </div>

          {formData.consultedPlanningFamily && (
            <div>
              <label className="text-sm font-medium mb-2 block">Método Elegido</label>
              <Select
                value={formData.contraceptionMethod || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    contraceptionMethod: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iud">DIU (Dispositivo Intrauterino)</SelectItem>
                  <SelectItem value="hormonal">Hormonales (píldoras, inyección)</SelectItem>
                  <SelectItem value="barrier">Métodos de barrera (condón, diafragma)</SelectItem>
                  <SelectItem value="natural">Métodos naturales</SelectItem>
                  <SelectItem value="sterilization">Esterilización</SelectItem>
                  <SelectItem value="lactational_amenorrhea">Amenorrea de la Lactancia</SelectItem>
                  <SelectItem value="none">Ninguno decidido actualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hallazgos Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas clínicas adicionales, observaciones de depresión posparto, estado emocional, etc."
            value={formData.additionalFindings || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                additionalFindings: e.target.value,
              }))
            }
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Guardando Cuidado Posparto...' : 'Guardar Evaluación Posparto'}
      </Button>
    </div>
  );
};

export default PostpartumCareForm;
