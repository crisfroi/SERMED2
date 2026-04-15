// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NewbornAssessmentProps {
  deliveryId: string;
  onSuccess?: () => void;
}

interface ApgarScore {
  parameter: string;
  score: 0 | 1 | 2;
  description: string;
}

interface NewbornData {
  // Apgar Scores
  apgar1Min: number;
  apgar5Min: number;
  apgar10Min?: number;
  
  // Anthropometric
  weightGrams: number;
  lengthCm: number;
  headCircumferenceCm: number;
  
  // Physical Assessment
  skinColor: 'pink' | 'pale' | 'cyanotic' | 'jaundiced';
  moro: boolean; // Moro reflex present
  rooting: boolean; // Rooting reflex present
  sucking: boolean; // Sucking reflex present
  graspingReflex: boolean;
  
  // Breathing
  respiratoryEffort: 'normal' | 'labored' | 'distressed';
  firstCryTime: number; // Minutes
  
  // Complications
  congenitalAnomalies: string;
  vitalSigns: {
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
  };
  
  // Medications
  vitaminK: boolean;
  eyePropylaxis: boolean;
  hepatitisB: boolean;
  
  // Bonding
  skimContact: boolean;
  breastfeedingInitiation: boolean;
  
  // Notes
  additionalNotes: string;
}

const APGAR_CRITERIA = [
  {
    parameter: 'Apariencia (Appearance)',
    scores: [
      { value: 0, description: 'Pálido o azulado' },
      { value: 1, description: 'Cuerpo rosa, extremidades azuladas' },
      { value: 2, description: 'Completamente rosa' },
    ],
  },
  {
    parameter: 'Pulso (Pulse)',
    scores: [
      { value: 0, description: 'Ausente' },
      { value: 1, description: '< 100 bpm' },
      { value: 2, description: '> 100 bpm' },
    ],
  },
  {
    parameter: 'Mueca (Grimace)',
    scores: [
      { value: 0, description: 'Sin respuesta' },
      { value: 1, description: 'Mueca' },
      { value: 2, description: 'Llanto vigoroso' },
    ],
  },
  {
    parameter: 'Actividad (Activity)',
    scores: [
      { value: 0, description: 'Flácido' },
      { value: 1, description: 'Algún movimiento' },
      { value: 2, description: 'Movimiento activo' },
    ],
  },
  {
    parameter: 'Respiración (Respirations)',
    scores: [
      { value: 0, description: 'Ausente' },
      { value: 1, description: 'Lenta/irregular' },
      { value: 2, description: 'Llanto vigoroso' },
    ],
  },
];

const getApgarInterpretation = (score: number) => {
  if (score >= 7) return { status: 'normal', color: 'text-green-600', badge: 'Normalidad' };
  if (score >= 4) return { status: 'moderate', color: 'text-yellow-600', badge: 'Depresión Moderada' };
  return { status: 'severe', color: 'text-red-600', badge: 'Depresión Severa' };
};

export const NewbornAssessment: React.FC<NewbornAssessmentProps> = ({
  deliveryId,
  onSuccess,
}) => {
  const [data, setData] = useState<NewbornData>({
    apgar1Min: 7,
    apgar5Min: 8,
    weightGrams: 3500,
    lengthCm: 50,
    headCircumferenceCm: 34,
    skinColor: 'pink',
    moro: true,
    rooting: true,
    sucking: true,
    graspingReflex: true,
    respiratoryEffort: 'normal',
    firstCryTime: 1,
    congenitalAnomalies: '',
    vitalSigns: {
      heartRate: 140,
      respiratoryRate: 50,
      temperature: 36.8,
    },
    vitaminK: false,
    eyePropylaxis: false,
    hepatitisB: false,
    skimContact: false,
    breastfeedingInitiation: false,
    additionalNotes: '',
  });

  const [apgarScores, setApgarScores] = useState<Record<string, number>>({
    appearance: 2,
    pulse: 2,
    grimace: 2,
    activity: 2,
    respirations: 2,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apgar1Min = Object.values(apgarScores).reduce((a, b) => a + b, 0);
  const apgar5Min = data.apgar5Min;
  const interpretation1Min = getApgarInterpretation(apgar1Min);
  const interpretation5Min = getApgarInterpretation(apgar5Min);

  // Calculate birth weight category
  const getWeightCategory = (grams: number) => {
    if (grams < 2500) return 'LBW';
    if (grams > 4500) return 'LGA';
    return 'Normal';
  };

  const handleApgarChange = (parameter: string, score: number) => {
    setApgarScores((prev) => ({
      ...prev,
      [parameter]: score,
    }));
    setData((prev) => ({
      ...prev,
      apgar1Min: apgar1Min + (score - apgarScores[parameter]),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Validaciones
      if (data.weightGrams < 500 || data.weightGrams > 6000) {
        throw new Error('Peso debe ser entre 500g y 6000g');
      }

      if (data.lengthCm < 30 || data.lengthCm > 60) {
        throw new Error('Talla debe estar entre 30 y 60 cm');
      }

      if (data.headCircumferenceCm < 20 || data.headCircumferenceCm > 45) {
        throw new Error('Perímetro cefálico debe estar entre 20 y 45 cm');
      }

      // Guardar en base de datos
      const { error: insertError } = await supabase.from('newborn_assessment').insert([
        {
          delivery_id: deliveryId,
          weight_g: data.weightGrams,
          length_cm: data.lengthCm,
          head_circumference_cm: data.headCircumferenceCm,
          apgar_1min: apgar1Min,
          apgar_5min: apgar5Min,
          apgar_10min: data.apgar10Min,
          skin_color: data.skinColor,
          moro_reflex: data.moro,
          rooting_reflex: data.rooting,
          sucking_reflex: data.sucking,
          grasping_reflex: data.graspingReflex,
          respiratory_effort: data.respiratoryEffort,
          first_cry_minutes: data.firstCryTime,
          congenital_anomalies: data.congenitalAnomalies,
          heart_rate: data.vitalSigns.heartRate,
          respiratory_rate: data.vitalSigns.respiratoryRate,
          temperature: data.vitalSigns.temperature,
          vitamin_k_given: data.vitaminK,
          eye_prophylaxis_given: data.eyePropylaxis,
          hepatitis_b_given: data.hepatitisB,
          skin_to_skin_contact: data.skimContact,
          breastfeeding_initiated: data.breastfeedingInitiation,
          observations: data.additionalNotes,
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
              <p className="font-medium text-green-900">Evaluación Neonatal Guardada</p>
              <p className="text-sm text-green-700">Datos del recién nacido registrados correctamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          La evaluación de Apgar se realiza a 1 minuto, 5 minutos y (si es necesario) a 10 minutos del nacimiento.
          Evalúa cinco parámetros: Apariencia, Pulso, Mueca, Actividad y Respiración.
        </AlertDescription>
      </Alert>

      {/* APGAR Score Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Puntuación APGAR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {APGAR_CRITERIA.map((criterion, idx) => {
            const parameters = ['appearance', 'pulse', 'grimace', 'activity', 'respirations'];
            const paramKey = parameters[idx];

            return (
              <div key={idx} className="space-y-2">
                <label className="font-medium text-sm">{criterion.parameter}</label>
                <div className="flex gap-2">
                  {criterion.scores.map((score) => (
                    <button
                      key={score.value}
                      onClick={() => handleApgarChange(paramKey, score.value)}
                      className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                        apgarScores[paramKey] === score.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-lg">{score.value}</div>
                      <div className="text-xs text-gray-600">{score.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* APGAR Scores Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">APGAR 1 min</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{apgar1Min}</p>
                  <Badge className={`text-white ${
                    interpretation1Min.status === 'normal' ? 'bg-green-600' :
                    interpretation1Min.status === 'moderate' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {interpretation1Min.badge}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">APGAR 5 min</p>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={data.apgar5Min}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        apgar5Min: parseInt(e.target.value),
                      }))
                    }
                    className="w-16 px-2 py-1 border rounded font-bold text-xl"
                  />
                  <Badge className={`text-white ${
                    interpretation5Min.status === 'normal' ? 'bg-green-600' :
                    interpretation5Min.status === 'moderate' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {interpretation5Min.badge}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">APGAR 10 min (si necesario)</p>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={data.apgar10Min || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      apgar10Min: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="Opcional"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>

          {/* APGAR Interpretation Guide */}
          <div className="p-3 bg-gray-50 rounded text-xs space-y-1">
            <p className="font-medium">Interpretación:</p>
            <p>7-10: Normal - Buen pronóstico</p>
            <p className="text-yellow-700">4-6: Depresión moderada - Requiere intervención</p>
            <p className="text-red-700">0-3: Depresión severa - Reanimación urgente</p>
          </div>
        </CardContent>
      </Card>

      {/* Anthropometric Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Medidas Antropométricas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Peso (gramos)</label>
            <input
              type="number"
              min="500"
              max="6000"
              value={data.weightGrams}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  weightGrams: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-600 mt-1">
              Categoría: <Badge variant="outline">{getWeightCategory(data.weightGrams)}</Badge>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Talla (cm)</label>
              <input
                type="number"
                min="30"
                max="60"
                step="0.1"
                value={data.lengthCm}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    lengthCm: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Perímetro Cefálico (cm)</label>
              <input
                type="number"
                min="20"
                max="45"
                step="0.1"
                value={data.headCircumferenceCm}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    headCircumferenceCm: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Examination */}
      <Card>
        <CardHeader>
          <CardTitle>Examen Físico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Color de Piel</label>
            <div className="flex gap-2">
              {['pink', 'pale', 'cyanotic', 'jaundiced'].map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      skinColor: color as any,
                    }))
                  }
                  className={`flex-1 px-3 py-2 rounded border-2 text-sm ${
                    data.skinColor === color
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {color === 'pink' && '🌸 Rosa'}
                  {color === 'pale' && '⚪ Pálido'}
                  {color === 'cyanotic' && '💙 Cianótico'}
                  {color === 'jaundiced' && '💛 Ictérico'}
                </button>
              ))}
            </div>
          </div>

          {/* Reflexes */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Reflejo de Moro', key: 'moro' },
              { name: 'Reflejo de Búsqueda', key: 'rooting' },
              { name: 'Reflejo de Succión', key: 'sucking' },
              { name: 'Reflejo de Agarre', key: 'graspingReflex' },
            ].map((reflex) => (
              <div
                key={reflex.key}
                className={`p-3 rounded border-2 cursor-pointer transition-all ${
                  data[reflex.key as keyof NewbornData]
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    [reflex.key]: !prev[reflex.key as keyof NewbornData],
                  }))
                }
              >
                <p className="font-medium text-sm">{reflex.name}</p>
                <p className="text-xs text-gray-600">
                  {data[reflex.key as keyof NewbornData] ? '✓ Presente' : '✗ Ausente'}
                </p>
              </div>
            ))}
          </div>

          {/* Vital Signs */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
            <div>
              <label className="text-xs font-medium mb-1 block">FC (bpm)</label>
              <input
                type="number"
                value={data.vitalSigns.heartRate}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      heartRate: parseInt(e.target.value),
                    },
                  }))
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">FR (rpm)</label>
              <input
                type="number"
                value={data.vitalSigns.respiratoryRate}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      respiratoryRate: parseInt(e.target.value),
                    },
                  }))
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={data.vitalSigns.temperature}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      temperature: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prophylaxis */}
      <Card>
        <CardHeader>
          <CardTitle>Profilaxis Neonatal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'vitaminK', label: 'Vitamina K' },
            { key: 'eyePropylaxis', label: 'Profilaxis Ocular' },
            { key: 'hepatitisB', label: 'Vacuna Hepatitis B' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  [item.key]: !prev[item.key as keyof NewbornData],
                }))
              }
              className={`w-full p-3 rounded border-2 text-left transition-all ${
                data[item.key as keyof NewbornData]
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                <span>{data[item.key as keyof NewbornData] ? '✓' : '○'}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Bonding & Feeding */}
      <Card>
        <CardHeader>
          <CardTitle>Vínculo y Alimentación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() =>
              setData((prev) => ({
                ...prev,
                skimContact: !prev.skimContact,
              }))
            }
            className={`w-full p-3 rounded border-2 text-left transition-all ${
              data.skimContact
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Contacto Piel con Piel</span>
              <span>{data.skimContact ? '✓' : '○'}</span>
            </div>
          </button>

          <button
            onClick={() =>
              setData((prev) => ({
                ...prev,
                breastfeedingInitiation: !prev.breastfeedingInitiation,
              }))
            }
            className={`w-full p-3 rounded border-2 text-left transition-all ${
              data.breastfeedingInitiation
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Lactancia Iniciada</span>
              <span>{data.breastfeedingInitiation ? '✓' : '○'}</span>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Hallazgos Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Anomalías Congénitas</label>
            <textarea
              placeholder="Describir cualquier anomalía o hallazgo inusual..."
              value={data.congenitalAnomalies}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  congenitalAnomalies: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notas Clínicas Adicionales</label>
            <textarea
              placeholder="Observaciones adicionales..."
              value={data.additionalNotes}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  additionalNotes: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
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
        {submitting ? 'Guardando Evaluación Neonatal...' : 'Guardar Evaluación del Recién Nacido'}
      </Button>
    </div>
  );
};

export default NewbornAssessment;
