// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VaccinationScheduleForm from '@/components/ASIS_9_Inmunizacion/VaccinationScheduleForm';
import VaccineStatusTracker from '@/components/ASIS_9_Inmunizacion/VaccineStatusTracker';
import ImmunizationComplianceMonitor from '@/components/ASIS_9_Inmunizacion/ImmunizationComplianceMonitor';

const InmunizacionModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Inmunización (ASIS 9)</h1>
    <Tabs defaultValue="schedule">
      <TabsList><TabsTrigger value="schedule">Calendario</TabsTrigger><TabsTrigger value="status">Estado</TabsTrigger><TabsTrigger value="compliance">Cumplimiento</TabsTrigger></TabsList>
      <TabsContent value="schedule"><VaccinationScheduleForm /></TabsContent>
      <TabsContent value="status"><VaccineStatusTracker /></TabsContent>
      <TabsContent value="compliance"><ImmunizationComplianceMonitor /></TabsContent>
    </Tabs>
  </div>
);
export default InmunizacionModule;
