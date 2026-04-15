// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WaitingRoomDashboard from '@/components/ADMIN_2_WAITING_ROOMS/WaitingRoomDashboard';
import QueueManagementPanel from '@/components/ADMIN_2_WAITING_ROOMS/QueueManagementPanel';
import RoomConfigurationPage from '@/components/ADMIN_2_WAITING_ROOMS/RoomConfigurationPage';
import QueueAnalyticsReport from '@/components/ADMIN_2_WAITING_ROOMS/QueueAnalyticsReport';

const SalasEsperaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Salas de Espera (ADMIN 2)</h1>
    <Tabs defaultValue="dashboard">
      <TabsList><TabsTrigger value="dashboard">Dashboard</TabsTrigger><TabsTrigger value="queue">Colas</TabsTrigger><TabsTrigger value="config">Configuración</TabsTrigger><TabsTrigger value="analytics">Analítica</TabsTrigger></TabsList>
      <TabsContent value="dashboard"><WaitingRoomDashboard /></TabsContent>
      <TabsContent value="queue"><QueueManagementPanel /></TabsContent>
      <TabsContent value="config"><RoomConfigurationPage /></TabsContent>
      <TabsContent value="analytics"><QueueAnalyticsReport /></TabsContent>
    </Tabs>
  </div>
);
export default SalasEsperaModule;
