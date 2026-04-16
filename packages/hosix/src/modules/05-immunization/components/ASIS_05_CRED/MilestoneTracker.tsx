import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useChildGrowth } from '@/hooks/useChildGrowth';
import { supabase } from '@/lib/supabase';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface Milestone {
  ageMonths: number;
  category: 'gross_motor' | 'fine_motor' | 'language' | 'social_emotional';
  description: string;
  achieved?: boolean;
  emergenceAge?: number;
}

interface MilestoneTrackerProps {
  childId: string;
  ageMonths: number;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ childId, ageMonths }) => {
  const { currentMilestone, loading, error } = useChildGrowth(childId);
  const [updating, setUpdating] = useState(false);

  // WHO Developmental Milestones (12 meses)
  const milestones: Milestone[] = [
    // Gross Motor (0-12 months)
    {
      ageMonths: 2,
      category: 'gross_motor',
      description: 'Levanta la cabeza desde posición prona',
      achieved: currentMilestone?.gross_motor_2m,
    },
    {
      ageMonths: 4,
      category: 'gross_motor',
      description: 'Se sienta con apoyo',
      achieved: currentMilestone?.gross_motor_4m,
    },
    {
      ageMonths: 6,
      category: 'gross_motor',
      description: 'Se sienta sin apoyo',
      achieved: currentMilestone?.gross_motor_6m,
    },
    {
      ageMonths: 9,
      category: 'gross_motor',
      description: 'Se pone de pie con apoyo',
      achieved: currentMilestone?.gross_motor_9m,
    },
    {
      ageMonths: 12,
      category: 'gross_motor',
      description: 'Camina con apoyo o sin apoyo',
      achieved: currentMilestone?.gross_motor_12m,
    },

    // Fine Motor (0-12 months)
    {
      ageMonths: 2,
      category: 'fine_motor',
      description: 'Fija la mirada',
      achieved: currentMilestone?.fine_motor_2m,
    },
    {
      ageMonths: 4,
      category: 'fine_motor',
      description: 'Lleva objetos a la boca',
      achieved: currentMilestone?.fine_motor_4m,
    },
    {
      ageMonths: 6,
      category: 'fine_motor',
      description: 'Agarra objetos con dos manos',
      achieved: currentMilestone?.fine_motor_6m,
    },
    {
      ageMonths: 9,
      category: 'fine_motor',
      description: 'Pinza pulgar-índice',
      achieved: currentMilestone?.fine_motor_9m,
    },
    {
      ageMonths: 12,
      category: 'fine_motor',
      description: 'Señala con un dedo',
      achieved: currentMilestone?.fine_motor_12m,
    },

    // Language (0-12 months)
    {
      ageMonths: 2,
      category: 'language',
      description: 'Emite sonidos vocálicos',
      achieved: currentMilestone?.language_2m,
    },
    {
      ageMonths: 4,
      category: 'language',
      description: 'Balbuceo doble (ba-ba)',
      achieved: currentMilestone?.language_4m,
    },
    {
      ageMonths: 6,
      category: 'language',
      description: 'Balbuceo diverso',
      achieved: currentMilestone?.language_6m,
    },
    {
      ageMonths: 9,
      category: 'language',
      description: 'Dice "papá" o "mamá"',
      achieved: currentMilestone?.language_9m,
    },
    {
      ageMonths: 12,
      category: 'language',
      description: 'Dice primeras palabras significativas',
      achieved: currentMilestone?.language_12m,
    },

    // Social-Emotional (0-12 months)
    {
      ageMonths: 2,
      category: 'social_emotional',
      description: 'Sonríe refleja',
      achieved: currentMilestone?.social_emotional_2m,
    },
    {
      ageMonths: 4,
      category: 'social_emotional',
      description: 'Sonríe selectiva',
      achieved: currentMilestone?.social_emotional_4m,
    },
    {
      ageMonths: 6,
      category: 'social_emotional',
      description: 'Reconoce personas familiar y extraña',
      achieved: currentMilestone?.social_emotional_6m,
    },
    {
      ageMonths: 9,
      category: 'social_emotional',
      description: 'Ansiedad ante extraños',
      achieved: currentMilestone?.social_emotional_9m,
    },
    {
      ageMonths: 12,
      category: 'social_emotional',
      description: 'Juego interactivo simple',
      achieved: currentMilestone?.social_emotional_12m,
    },
  ];

  // Filtrar hitos por edad del niño (mostrar los que ya debería tener + próximos)
  const currentAgeMilestones = milestones.filter(
    (m) => m.ageMonths <= ageMonths + 3 // Mostrar próximos también
  );

  const groupedByCategory = {
    gross_motor: currentAgeMilestones.filter((m) => m.category === 'gross_motor'),
    fine_motor: currentAgeMilestones.filter((m) => m.category === 'fine_motor'),
    language: currentAgeMilestones.filter((m) => m.category === 'language'),
    social_emotional: currentAgeMilestones.filter((m) => m.category === 'social_emotional'),
  };

  const handleUpdateMilestone = async (milestone: Milestone, checked: boolean) => {
    setUpdating(true);
    try {
      const fieldName = `${milestone.category}_${milestone.ageMonths}m`;
      const { error: updateError } = await supabase
        .from('developmental_milestone')
        .update({ [fieldName]: checked })
        .eq('child_id', childId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating milestone:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Cargando hitos del desarrollo...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const categoryNames = {
    gross_motor: 'Motor Grueso',
    fine_motor: 'Motor Fino',
    language: 'Lenguaje',
    social_emotional: 'Socio-Emocional',
  };

  const categoryColors = {
    gross_motor: 'bg-blue-50 border-blue-200',
    fine_motor: 'bg-purple-50 border-purple-200',
    language: 'bg-green-50 border-green-200',
    social_emotional: 'bg-pink-50 border-pink-200',
  };

  const calculateProgress = (category: string) => {
    const categoryMilestones = groupedByCategory[category as keyof typeof groupedByCategory];
    if (categoryMilestones.length === 0) return 0;
    const achieved = categoryMilestones.filter((m) => m.achieved).length;
    return Math.round((achieved / categoryMilestones.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(categoryNames).map(([key, name]) => (
          <Card key={key} className={categoryColors[key as keyof typeof categoryColors]}>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-600 mb-2">{name}</p>
              <p className="text-2xl font-bold text-gray-800">{calculateProgress(key)}%</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all`}
                  style={{ 
                    width: `${calculateProgress(key)}%`,
                    backgroundColor: key === 'gross_motor' ? '#3B82F6' :
                                    key === 'fine_motor' ? '#A855F7' :
                                    key === 'language' ? '#10B981' :
                                    '#EC4899'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Age Alert */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Edad Actual: {ageMonths} meses</p>
            <p className="text-sm text-amber-700">
              Mostrando hitos hasta {ageMonths + 3} meses. Los hitos varían según el niño.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Milestones by Category */}
      {Object.entries(categoryNames).map(([categoryKey, categoryName]) => {
        const categoryMilestones = groupedByCategory[categoryKey as keyof typeof groupedByCategory];
        if (categoryMilestones.length === 0) return null;

        return (
          <Card key={categoryKey} className={categoryColors[categoryKey as keyof typeof categoryColors]}>
            <CardHeader>
              <CardTitle className="text-lg">{categoryName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryMilestones.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <Checkbox
                    checked={milestone.achieved || false}
                    disabled={updating}
                    onCheckedChange={(checked) =>
                      handleUpdateMilestone(milestone, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{milestone.description}</p>
                    <p className="text-sm text-gray-500">
                      {milestone.ageMonths === ageMonths && '📍 Para la edad actual'}
                      {milestone.ageMonths < ageMonths && '✅ Deber haber aparecido'}
                      {milestone.ageMonths > ageMonths && '⏳ Próximamente esperado'}
                    </p>
                  </div>
                  <Badge variant={milestone.achieved ? 'default' : 'outline'}>
                    {milestone.ageMonths}m
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* WHO Reference */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Referencia WHO (0-12 meses)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-600">
          <p>
            Los hitos del desarrollo varían naturalmente. La mayoría de niños logran estos hitos dentro
            de un rango de edad. Si tienes preocupaciones, consulta con el pediatra.
          </p>
          <p className="font-medium text-gray-800">Signos de alerta:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>No fija la mirada a los 2 meses</li>
            <li>No emite sonidos a los 4 meses</li>
            <li>No se sienta sin apoyo a los 8 meses</li>
            <li>No camina a los 18 meses</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneTracker;
