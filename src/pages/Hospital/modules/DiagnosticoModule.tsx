// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiagnosisForm from '@/components/ASIS_14_Diagnostico/DiagnosisForm';
import DiagnosisList from '@/components/ASIS_14_Diagnostico/DiagnosisList';
import DiagnosisHistory from '@/components/ASIS_14_Diagnostico/DiagnosisHistory';
import ComorbidityAssessment from '@/components/ASIS_14_Diagnostico/ComorbidityAssessment';

const DiagnosticoModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Diagnóstico (ASIS 14)</h1>
    <Tabs defaultValue="form">
      <TabsList><TabsTrigger value="form">Nuevo</TabsTrigger><TabsTrigger value="list">Listado</TabsTrigger><TabsTrigger value="history">Historial</TabsTrigger><TabsTrigger value="comorbidity">Comorbilidad</TabsTrigger></TabsList>
      <TabsContent value="form"><DiagnosisForm /></TabsContent>
      <TabsContent value="list"><DiagnosisList /></TabsContent>
      <TabsContent value="history"><DiagnosisHistory /></TabsContent>
      <TabsContent value="comorbidity"><ComorbidityAssessment /></TabsContent>
    </Tabs>
  </div>
);
export default DiagnosticoModule;
