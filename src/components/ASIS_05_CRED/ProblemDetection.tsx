// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Eye, Ear, Zap, Heart, MessageSquare } from 'lucide-react';

interface ProblemDetectionProps {
  childId: string;
  physicianId: string;
}

interface DetectedProblem {
  problemType: 'hearing' | 'vision' | 'motor' | 'speech' | 'cardiac' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  referralNeeded: boolean;
  recommendedSpecialty?: string;
  observations: string;
}

const PROBLEM_TYPES = [
  {
    id: 'hearing',
    name: 'Audición',
    icon: <Ear className="h-5 w-5" />,
    color: 'text-blue-600 bg-blue-50',
    signs: [
      'No responde a sonidos fuertes',
      'No voltea hacia la voz',
      'Retraso en el lenguaje',
      'Habla con volumen anormalmente alto o bajo',
      'Dificultad para comprender instrucciones',
    ],
    referral: 'otorhinolaryngologist',
  },
  {
    id: 'vision',
    name: 'Visión',
    icon: <Eye className="h-5 w-5" />,
    color: 'text-green-600 bg-green-50',
    signs: [
      'No sigue objetos visuales',
      'Acerca mucho los ojos a los objetos',
      'Ojos desalineados o estrabismo',
      'Lagrimeo excesivo o enrojecimiento',
      'Fotofobia (molestia con luz brillante)',
    ],
    referral: 'ophthalmologist',
  },
  {
    id: 'motor',
    name: 'Motor/Movimiento',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-purple-600 bg-purple-50',
    signs: [
      'Hipotonía (bajo tono muscular)',
      'Hipertonía (alto tono muscular)',
      'Asimetría en movimientos',
      'Retraso en hitos motores',
      'Falta de coordinación',
    ],
    referral: 'neurologist',
  },
  {
    id: 'speech',
    name: 'Lenguaje y Habla',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'text-orange-600 bg-orange-50',
    signs: [
      'Ausencia de balbuceo o palabras',
      'Dificultad articular sonidos',
      'Fluidez alterada (tartamudeo)',
      'Lenguaje poco inteligible',
      'Retraso en comprensión',
    ],
    referral: 'speech_therapist',
  },
  {
    id: 'cardiac',
    name: 'Cardiaco',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50',
    signs: [
      'Soplo cardíaco',
      'Cianosis (labios/dedos azules)',
      'Disnea con el esfuerzo',
      'Pulsos débiles o asimétricos',
      'Presión arterial anormal',
    ],
    referral: 'cardiologist',
  },
];

const SPECIALTIES = {
  otorhinolaryngologist: 'Otorrinolaringólogo',
  ophthalmologist: 'Oftalmólogo',
  neurologist: 'Neurólogo',
  speech_therapist: 'Logopeda/Terapeuta del Lenguaje',
  cardiologist: 'Cardiólogo Pediátrico',
  other: 'Otro especialista',
};

export const ProblemDetection: React.FC<ProblemDetectionProps> = ({ childId, physicianId }) => {
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [problemDetails, setProblemDetails] = useState<{ [key: string]: DetectedProblem }>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleProblemToggle = (problemId: string) => {
    setSelectedProblems((prev) =>
      prev.includes(problemId) ? prev.filter((p) => p !== problemId) : [...prev, problemId]
    );

    // Inicializar detalles si no existen
    if (!problemDetails[problemId]) {
      const problemType = problemId as 'hearing' | 'vision' | 'motor' | 'speech' | 'cardiac' | 'other';
      const problem = PROBLEM_TYPES.find((p) => p.id === problemId);
      setProblemDetails((prev) => ({
        ...prev,
        [problemId]: {
          problemType,
          severity: 'mild',
          description: '',
          referralNeeded: false,
          recommendedSpecialty: problem?.referral,
          observations: '',
        },
      }));
    }
  };

  const handleProblemDetailsChange = (problemId: string, field: string, value: any) => {
    setProblemDetails((prev) => ({
      ...prev,
      [problemId]: {
        ...prev[problemId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar cada problema detectado
      const detectedProblems = selectedProblems.map((problemId) => {
        const details = problemDetails[problemId];
        return {
          child_id: childId,
          problem_type: details.problemType,
          severity: details.severity,
          description: details.description,
          observations: details.observations,
          referred_to_speciality: details.referralNeeded ? details.recommendedSpecialty : null,
          detected_by: physicianId,
          detection_date: new Date().toISOString(),
        };
      });

      if (detectedProblems.length > 0) {
        const { error } = await supabase.from('problem_detection').insert(detectedProblems);

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => {
        setSelectedProblems([]);
        setProblemDetails({});
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving problems:', err);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Problemas guardados correctamente</p>
              <p className="text-sm text-green-700">
                Los referidos han sido generados y serán procesados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Detección de Problemas de Desarrollo</p>
          <p className="text-sm">
            Esta sección permite documentar y referir problemas potenciales identificados durante la evaluación CRED.
            Cualquier preocupación debe ser discutida con los padres y documentada en el expediente del niño.
          </p>
        </AlertDescription>
      </Alert>

      {/* Problem Selection */}
      <div className="grid gap-4">
        {PROBLEM_TYPES.map((problemType) => (
          <Card key={problemType.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Problem Header */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProblems.includes(problemType.id)}
                    onCheckedChange={() => handleProblemToggle(problemType.id)}
                    id={`problem-${problemType.id}`}
                  />
                  <label htmlFor={`problem-${problemType.id}`} className="flex-1 cursor-pointer">
                    <div className={`p-3 rounded-lg ${problemType.color}`}>
                      <div className="flex items-center gap-2">
                        {problemType.icon}
                        <span className="font-medium">{problemType.name}</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Expanded Details */}
                {selectedProblems.includes(problemType.id) && (
                  <div className="space-y-4 ml-8 pt-4 border-t">
                    {/* Signs and Symptoms */}
                    <div>
                      <p className="font-medium text-sm mb-2">Signos de alerta:</p>
                      <ul className="text-sm space-y-1 text-gray-600">
                        {problemType.signs.map((sign, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Severidad</label>
                      <Select
                        value={problemDetails[problemType.id]?.severity || 'mild'}
                        onValueChange={(value) =>
                          handleProblemDetailsChange(
                            problemType.id,
                            'severity',
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Leve</SelectItem>
                          <SelectItem value="moderate">Moderada</SelectItem>
                          <SelectItem value="severe">Severa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hallazgos Clínicos
                      </label>
                      <Textarea
                        placeholder="Describe los hallazgos específicos encontrados..."
                        value={problemDetails[problemType.id]?.description || ''}
                        onChange={(e) =>
                          handleProblemDetailsChange(problemType.id, 'description', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    {/* Referral */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={problemDetails[problemType.id]?.referralNeeded || false}
                          onCheckedChange={(checked) =>
                            handleProblemDetailsChange(
                              problemType.id,
                              'referralNeeded',
                              checked
                            )
                          }
                          id={`referral-${problemType.id}`}
                        />
                        <label
                          htmlFor={`referral-${problemType.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Requiere referido especializado
                        </label>
                      </div>

                      {problemDetails[problemType.id]?.referralNeeded && (
                        <Select
                          value={problemDetails[problemType.id]?.recommendedSpecialty || ''}
                          onValueChange={(value) =>
                            handleProblemDetailsChange(
                              problemType.id,
                              'recommendedSpecialty',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecciona especialista" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SPECIALTIES).map(([key, name]) => (
                              <SelectItem key={key} value={key}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Observations */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Observaciones Adicionales</label>
                      <Textarea
                        placeholder="Notas personalizadas para los padres o el expediente..."
                        value={problemDetails[problemType.id]?.observations || ''}
                        onChange={(e) =>
                          handleProblemDetailsChange(problemType.id, 'observations', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={selectedProblems.length === 0 || saving}
          className="flex-1"
          size="lg"
        >
          {saving ? 'Guardando...' : `Guardar ${selectedProblems.length} Problema(s)`}
        </Button>
        {selectedProblems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedProblems([]);
              setProblemDetails({});
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Information Panel */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Continuidad del Cuidado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>
            Los problemas detectados generarán automáticamente referidos a especialistas cuando sea necesario.
          </p>
          <p>
            Comunica los hallazgos a los padres/cuidadores de manera comprensible y solicita seguimiento según la severidad.
          </p>
          <p className="font-medium">
            📋 Todo debe documentarse en el expediente clínico del niño para continuidad de cuidado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProblemDetection;
