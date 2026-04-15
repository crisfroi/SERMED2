// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DevelopmentScreening from '@/components/ASIS_05_CRED/DevelopmentScreening';
import GrowthChart from '@/components/ASIS_05_CRED/GrowthChart';
import MilestoneTracker from '@/components/ASIS_05_CRED/MilestoneTracker';
import VaccinationSchedule from '@/components/ASIS_05_CRED/VaccinationSchedule';

const CREDModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">CRED — Control de Desarrollo (ASIS 5)</h1>
    <Tabs defaultValue="screening">
      <TabsList><TabsTrigger value="screening">Screening</TabsTrigger><TabsTrigger value="growth">Crecimiento</TabsTrigger><TabsTrigger value="milestones">Hitos</TabsTrigger><TabsTrigger value="vaccines">Vacunas</TabsTrigger></TabsList>
      <TabsContent value="screening"><DevelopmentScreening /></TabsContent>
      <TabsContent value="growth"><GrowthChart /></TabsContent>
      <TabsContent value="milestones"><MilestoneTracker /></TabsContent>
      <TabsContent value="vaccines"><VaccinationSchedule /></TabsContent>
    </Tabs>
  </div>
);
export default CREDModule;
