// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Radio, RadioGroup } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface DevelopmentScreeningProps {
  childId: string;
  ageMonths: number;
  physicianId: string;
}

interface ScreeningQuestion {
  id: string;
  category: 'motor' | 'cognitive' | 'language' | 'social';
  question: string;
  description: string;
  expectedAge: number;
  options: {
    value: 'yes' | 'partially' | 'no';
    label: string;
  }[];
}

// Denver Developmental Screening Test (DDST) inspired questions
const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  // Motor Development
  {
    id: 'motor_1',
    category: 'motor',
    question: '¿Levanta la cabeza?',
    description: 'Levanta la cabeza 45 grados cuando está boca abajo',
    expectedAge: 1,
    options: [
      { value: 'yes', label: 'Sí, consistentemente' },
      { value: 'partially', label: 'A veces' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'motor_2',
    category: 'motor',
    question: '¿Se sienta sin apoyo?',
    description: 'Mantiene el equilibrio sentado sin apoyo de manos',
    expectedAge: 6,
    options: [
      { value: 'yes', label: 'Sí, mantiene bien el equilibrio' },
      { value: 'partially', label: 'Intenta pero necesita apoyo' },
      { value: 'no', label: 'No puede' },
    ],
  },
  {
    id: 'motor_3',
    category: 'motor',
    question: '¿Se pone de pie con apoyo?',
    description: 'Se eleva del suelo usando apoyo',
    expectedAge: 9,
    options: [
      { value: 'yes', label: 'Sí, de forma estable' },
      { value: 'partially', label: 'Intenta frecuentemente' },
      { value: 'no', label: 'No puede' },
    ],
  },
  {
    id: 'motor_4',
    category: 'motor',
    question: '¿Camina?',
    description: 'Camina independientemente sin apoyo',
    expectedAge: 12,
    options: [
      { value: 'yes', label: 'Sí, camina independientemente' },
      { value: 'partially', label: 'Camina con apoyo/ayuda' },
      { value: 'no', label: 'No camina' },
    ],
  },

  // Cognitive Development
  {
    id: 'cognitive_1',
    category: 'cognitive',
    question: '¿Sigue objetos con la vista?',
    description: 'Sigue un juguete que se mueve de lado a lado',
    expectedAge: 1,
    options: [
      { value: 'yes', label: 'Sí, la mayoría de las veces' },
      { value: 'partially', label: 'A veces' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'cognitive_2',
    category: 'cognitive',
    question: '¿Entiende "no"?',
    description: 'Para de hacer algo cuando se le dice "no"',
    expectedAge: 9,
    options: [
      { value: 'yes', label: 'Sí, entiende claramente' },
      { value: 'partially', label: 'A veces entiende' },
      { value: 'no', label: 'No muestra comprensión' },
    ],
  },
  {
    id: 'cognitive_3',
    category: 'cognitive',
    question: '¿Sabe dónde están sus (juguete/objeto favorito)?',
    description: 'Busca cosas cuando se le pregunta',
    expectedAge: 9,
    options: [
      { value: 'yes', label: 'Sí, la busca rápidamente' },
      { value: 'partially', label: 'A veces la busca' },
      { value: 'no', label: 'No la busca' },
    ],
  },

  // Language Development
  {
    id: 'language_1',
    category: 'language',
    question: '¿Emite sonidos característicos?',
    description: 'Emite sonidos vocálicos (aaa, eee) dirigidos a personas',
    expectedAge: 2,
    options: [
      { value: 'yes', label: 'Sí, frecuentemente' },
      { value: 'partially', label: 'A veces' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'language_2',
    category: 'language',
    question: '¿Balbucía?',
    description: 'Produce sonidos repetitivos (ba-ba-ba, da-da-da)',
    expectedAge: 4,
    options: [
      { value: 'yes', label: 'Sí, balbucía múltiples sonidos' },
      { value: 'partially', label: 'Balbucía ocasionalmente' },
      { value: 'no', label: 'No balbucía' },
    ],
  },
  {
    id: 'language_3',
    category: 'language',
    question: '¿Dice palabras simples?',
    description: 'Dice "papá", "mamá" o palabras similares significativas',
    expectedAge: 9,
    options: [
      { value: 'yes', label: 'Sí, 2+ palabras diferentes' },
      { value: 'partially', label: '1 palabra significativa' },
      { value: 'no', label: 'No dice palabras' },
    ],
  },

  // Social-Emotional Development
  {
    id: 'social_1',
    category: 'social',
    question: '¿Sonríe en respuesta?',
    description: 'Sonríe cuando se le sonríe o se le habla',
    expectedAge: 1,
    options: [
      { value: 'yes', label: 'Sí, sonríe claramente' },
      { value: 'partially', label: 'Sonríe ocasionalmente' },
      { value: 'no', label: 'No sonríe' },
    ],
  },
  {
    id: 'social_2',
    category: 'social',
    question: '¿Reconoce personas?',
    description: 'Muestra preferencia por cuidadores familiares',
    expectedAge: 6,
    options: [
      { value: 'yes', label: 'Sí, claramente diferencia' },
      { value: 'partially', label: 'A veces diferencia' },
      { value: 'no', label: 'No diferencia' },
    ],
  },
  {
    id: 'social_3',
    category: 'social',
    question: '¿Juega interactivamente?',
    description: 'Participa en juegos simples como "cucu"',
    expectedAge: 9,
    options: [
      { value: 'yes', label: 'Sí, ríe y participa' },
      { value: 'partially', label: 'Observe pero no participa activamente' },
      { value: 'no', label: 'No participa' },
    ],
  },
];

export const DevelopmentScreening: React.FC<DevelopmentScreeningProps> = ({
  childId,
  ageMonths,
  physicianId,
}) => {
  const [responses, setResponses] = useState<{ [key: string]: 'yes' | 'partially' | 'no' | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState<{
    overallScore: number;
    status: 'normal' | 'borderline' | 'delayed';
    categoryScores: { [key: string]: number };
    recommendations: string[];
  } | null>(null);

  const relevantQuestions = SCREENING_QUESTIONS.filter(
    (q) => q.expectedAge <= ageMonths + 3
  );

  const categoryGroups = {
    motor: relevantQuestions.filter((q) => q.category === 'motor'),
    cognitive: relevantQuestions.filter((q) => q.category === 'cognitive'),
    language: relevantQuestions.filter((q) => q.category === 'language'),
    social: relevantQuestions.filter((q) => q.category === 'social'),
  };

  const calculateScores = () => {
    const categoryScores: { [key: string]: number } = {};
    const allRecommendations: string[] = [];

    Object.entries(categoryGroups).forEach(([category, questions]) => {
      let score = 0;
      questions.forEach((q) => {
        if (responses[q.id] === 'yes') score += 1;
        else if (responses[q.id] === 'partially') score += 0.5;
      });

      const percentage = (score / questions.length) * 100;
      categoryScores[category] = percentage;

      if (percentage < 50) {
        allRecommendations.push(`Evaluación especializada para desarrollo ${category}`);
      }
    });

    const overallScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length;

    let status: 'normal' | 'borderline' | 'delayed' = 'normal';
    if (overallScore < 50) status = 'delayed';
    else if (overallScore < 70) status = 'borderline';

    return {
      overallScore: Math.round(overallScore),
      status,
      categoryScores,
      recommendations: allRecommendations,
    };
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value as 'yes' | 'partially' | 'no',
    }));
  };

  const handleSubmit = async () => {
    const result = calculateScores();
    setScreenshotResult(result);
    setSubmitting(true);

    try {
      const { error } = await supabase.from('problem_detection').insert([
        {
          child_id: childId,
          problem_type: 'development',
          severity: result.status === 'delayed' ? 'high' : result.status === 'borderline' ? 'medium' : 'low',
          screening_score: result.overallScore,
          screening_details: {
            categoryScores: result.categoryScores,
            recommendations: result.recommendations,
            responses: responses,
          },
          referred_to_speciality: result.status === 'delayed' ? 'developmental_pediatrician' : null,
          detected_by: physicianId,
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving screening:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && screenshotResult) {
    return <ScreeningResultView result={screenshotResult} childId={childId} />;
  }

  const categoryNames: { [key: string]: string } = {
    motor: 'Desarrollo Motor',
    cognitive: 'Desarrollo Cognitivo',
    language: 'Desarrollo del Lenguaje',
    social: 'Desarrollo Socio-Emocional',
  };

  const answered = Object.values(responses).filter((v) => v !== null).length;
  const total = relevantQuestions.length;
  const progress = Math.round((answered / total) * 100);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-medium">Progreso de Cribado</p>
              <p className="text-sm font-mono">{answered}/{total}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screening Questions */}
      {Object.entries(categoryGroups).map(([category, questions]) => (
        questions.length > 0 && (
          <Card key={category}>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-base">{categoryNames[category]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {questions.map((question) => (
                <div key={question.id} className="space-y-3 pb-4 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{question.question}</p>
                    <p className="text-sm text-gray-600">{question.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Edad esperada: {question.expectedAge} meses
                    </p>
                  </div>

                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    <div className="space-y-2 ml-4">
                      {question.options.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                          <Radio value={option.value} id={`${question.id}-${option.value}`} />
                          <label
                            htmlFor={`${question.id}-${option.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      ))}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={answered === 0 || submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Analizando...' : 'Completar Cribado del Desarrollo'}
      </Button>
    </div>
  );
};

// Componente para mostrar resultados
interface ScreeningResultViewProps {
  result: {
    overallScore: number;
    status: 'normal' | 'borderline' | 'delayed';
    categoryScores: { [key: string]: number };
    recommendations: string[];
  };
  childId: string;
}

const ScreeningResultView: React.FC<ScreeningResultViewProps> = ({ result, childId }) => {
  const categoryNames: { [key: string]: string } = {
    motor: 'Motor',
    cognitive: 'Cognitivo',
    language: 'Lenguaje',
    social: 'Socio-Emocional',
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={`border-2 ${
        result.status === 'normal' ? 'border-green-300 bg-green-50' :
        result.status === 'borderline' ? 'border-yellow-300 bg-yellow-50' :
        'border-red-300 bg-red-50'
      }`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              {result.status === 'normal' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {result.status === 'borderline' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
              {result.status === 'delayed' && <AlertTriangle className="h-6 w-6 text-red-600" />}
              <h2 className="text-xl font-bold">
                {result.status === 'normal' ? 'Desarrollo Normal' :
                result.status === 'borderline' ? 'Necesita Seguimiento' :
                'Requiere Evaluación Especializada'}
              </h2>
            </div>
            <p className="text-3xl font-bold">{result.overallScore}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(result.categoryScores).map(([category, score]) => (
          <Card key={category}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-2">{categoryNames[category]}</p>
              <p className="text-2xl font-bold">{Math.round(score)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <p className="font-medium mb-2">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-1">
              {result.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button className="w-full" variant="outline">
        ⬅️ Volver al Cribado
      </Button>
    </div>
  );
};

export default DevelopmentScreening;
