// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MedicationForm from '@/components/ASIS_10_Medicamentos/MedicationForm';
import InteractionChecker from '@/components/ASIS_10_Medicamentos/InteractionChecker';
import AdherenceTracker from '@/components/ASIS_10_Medicamentos/AdherenceTracker';
import RegimensList from '@/components/ASIS_10_Medicamentos/RegimensList';

const MedicamentosModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Medicamentos (ASIS 10)</h1>
    <Tabs defaultValue="form">
      <TabsList><TabsTrigger value="form">Prescripción</TabsTrigger><TabsTrigger value="interactions">Interacciones</TabsTrigger><TabsTrigger value="adherence">Adherencia</TabsTrigger><TabsTrigger value="regimens">Regímenes</TabsTrigger></TabsList>
      <TabsContent value="form"><MedicationForm /></TabsContent>
      <TabsContent value="interactions"><InteractionChecker /></TabsContent>
      <TabsContent value="adherence"><AdherenceTracker /></TabsContent>
      <TabsContent value="regimens"><RegimensList /></TabsContent>
    </Tabs>
  </div>
);
export default MedicamentosModule;
