// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SurgeryScheduleForm from '@/components/ASIS_7_Cirugia/SurgeryScheduleForm';
import SurgeryTeamManagement from '@/components/ASIS_7_Cirugia/SurgeryTeamManagement';
import PostSurgeryRecoveryTracker from '@/components/ASIS_7_Cirugia/PostSurgeryRecoveryTracker';

const CirugiaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Cirugía (ASIS 7)</h1>
    <Tabs defaultValue="schedule">
      <TabsList><TabsTrigger value="schedule">Programación</TabsTrigger><TabsTrigger value="team">Equipo</TabsTrigger><TabsTrigger value="recovery">Recuperación</TabsTrigger></TabsList>
      <TabsContent value="schedule"><SurgeryScheduleForm /></TabsContent>
      <TabsContent value="team"><SurgeryTeamManagement /></TabsContent>
      <TabsContent value="recovery"><PostSurgeryRecoveryTracker /></TabsContent>
    </Tabs>
  </div>
);
export default CirugiaModule;
