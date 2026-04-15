// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealPlanViewer from '@/components/ASIS_8_Dietetica/MealPlanViewer';
import NutritionAssessmentForm from '@/components/ASIS_8_Dietetica/NutritionAssessmentForm';
import NutritionComplianceTracker from '@/components/ASIS_8_Dietetica/NutritionComplianceTracker';

const DieteticaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Dietética y Nutrición (ASIS 8)</h1>
    <Tabs defaultValue="assessment">
      <TabsList><TabsTrigger value="assessment">Evaluación</TabsTrigger><TabsTrigger value="plans">Planes</TabsTrigger><TabsTrigger value="compliance">Seguimiento</TabsTrigger></TabsList>
      <TabsContent value="assessment"><NutritionAssessmentForm /></TabsContent>
      <TabsContent value="plans"><MealPlanViewer /></TabsContent>
      <TabsContent value="compliance"><NutritionComplianceTracker /></TabsContent>
    </Tabs>
  </div>
);
export default DieteticaModule;
