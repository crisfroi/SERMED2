// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrescriptionForm from '@/components/ASIS_12_Farmacoterapia/PrescriptionForm';
import DrugInteractionChecker from '@/components/ASIS_12_Farmacoterapia/DrugInteractionChecker';
import MedicationAdherenceTracker from '@/components/ASIS_12_Farmacoterapia/MedicationAdherenceTracker';

const FarmacoterapiaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Farmacoterapia (ASIS 12)</h1>
    <Tabs defaultValue="prescription">
      <TabsList><TabsTrigger value="prescription">Prescripción</TabsTrigger><TabsTrigger value="interactions">Interacciones</TabsTrigger><TabsTrigger value="adherence">Adherencia</TabsTrigger></TabsList>
      <TabsContent value="prescription"><PrescriptionForm /></TabsContent>
      <TabsContent value="interactions"><DrugInteractionChecker /></TabsContent>
      <TabsContent value="adherence"><MedicationAdherenceTracker /></TabsContent>
    </Tabs>
  </div>
);
export default FarmacoterapiaModule;
