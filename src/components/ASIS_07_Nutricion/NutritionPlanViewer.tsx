// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Clock, AlertTriangle, Loader, Download } from 'lucide-react';
import { useNutritionPlanning } from '@/hooks/useNutritionPlanning';

// ============================================================================
// TYPES
// ============================================================================
interface NutritionPlan {
  id: string;
  patient_id: string;
  nutrition_assessment_id: string;
  daily_calorie_target: number;
  protein_g_per_day: number;
  carbs_percentage: number;
  fat_percentage: number;
  therapeutic_diet: string;
  meal_frequency: number;
  status: 'active' | 'suspended' | 'completed' | 'cancelled';
  created_by_id: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  nutrition_objectives: string[];
  supplements_prescribed: Record<string, any>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const NutritionPlanViewer: React.FC<{
  patientId: string;
  planId?: string;
}> = ({ patientId, planId }) => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedObjectives, setExpandedObjectives] = useState(false);

  const { fetchNutritionPlans, getNutritionPlanDetails } = useNutritionPlanning();

  // Load plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchNutritionPlans(patientId);
        if (result.success) {
          setPlans(result.data);

          // If planId provided, select it
          if (planId) {
            const plan = result.data.find((p: NutritionPlan) => p.id === planId);
            if (plan) {
              setSelectedPlan(plan);
            }
          } else if (result.data.length > 0) {
            // Select most recent active plan
            const activePlan = result.data.find((p: NutritionPlan) => p.status === 'active');
            setSelectedPlan(activePlan || result.data[0]);
          }
        } else {
          setError(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [patientId, planId, fetchNutritionPlans]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Plan List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Planes Nutricionales Disponibles</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando planes...</span>
          </div>
        ) : error ? (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        ) : plans.length === 0 ? (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              No hay planes nutricionales registered para este paciente
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full p-4 border rounded-lg transition-all hover:shadow-md ${
                  selectedPlan?.id === plan.id 
                    ? 'bg-blue-50 border-blue-500 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(plan.status)}`}>
                        {getStatusIcon(plan.status)}
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Del {new Date(plan.start_date).toLocaleDateString()} 
                      {plan.end_date ? ` al ${new Date(plan.end_date).toLocaleDateString()}` : ' (sin fin)'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.daily_calorie_target} kcal | {plan.protein_g_per_day}g proteína | {plan.meal_frequency} comidas
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Plan Details */}
      {selectedPlan && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">Detalles del Plan Nutricional</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>

            {/* Caloric & Macronutrient Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Calorías Diarias</p>
                <p className="text-2xl font-bold text-blue-600">{selectedPlan.daily_calorie_target}</p>
                <p className="text-xs text-gray-500 mt-1">kcal/día</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Proteína</p>
                <p className="text-2xl font-bold text-green-600">{selectedPlan.protein_g_per_day}</p>
                <p className="text-xs text-gray-500 mt-1">g/día</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Carbohidratos</p>
                <p className="text-2xl font-bold text-yellow-600">{selectedPlan.carbs_percentage}%</p>
                <p className="text-xs text-gray-500 mt-1">del total calórico</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Grasas</p>
                <p className="text-2xl font-bold text-orange-600">{selectedPlan.fat_percentage}%</p>
                <p className="text-xs text-gray-500 mt-1">del total calórico</p>
              </div>
            </div>

            {/* Plan Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-y">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Especificaciones del Plan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de Dieta:</span>
                    <span className="font-medium text-gray-900">{selectedPlan.therapeutic_diet || 'Estándar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frecuencia de Comidas:</span>
                    <span className="font-medium text-gray-900">{selectedPlan.meal_frequency} por día</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPlan.status)}`}>
                      {selectedPlan.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Fechas del Plan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inicio:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedPlan.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fin:</span>
                    <span className="font-medium text-gray-900">
                      {selectedPlan.end_date ? new Date(selectedPlan.end_date).toLocaleDateString() : 'Abierto'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedPlan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Objectives */}
            {selectedPlan.nutrition_objectives && selectedPlan.nutrition_objectives.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedObjectives(!expandedObjectives)}
                  className="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <h4 className="font-semibold text-gray-900">Objetivos Nutricionales</h4>
                  <span className="text-gray-600">{expandedObjectives ? '▼' : '▶'}</span>
                </button>

                {expandedObjectives && (
                  <ul className="mt-3 space-y-2 ml-4">
                    {selectedPlan.nutrition_objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Supplements */}
            {selectedPlan.supplements_prescribed && Object.keys(selectedPlan.supplements_prescribed).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Suplementación</h4>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  {Object.entries(selectedPlan.supplements_prescribed).map(([name, details]: [string, any]) => (
                    <div key={name} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className="text-gray-600">{details.dosage} - {details.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1">Editar Plan</Button>
              <Button variant="outline" className="flex-1">Crear Seguimiento</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NutritionPlanViewer;
