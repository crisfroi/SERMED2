// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HRDashboard from '@/components/ADMIN_1_HR/HRDashboard';
import StaffDirectory from '@/components/ADMIN_1_HR/StaffDirectory';
import SchedulingBoard from '@/components/ADMIN_1_HR/SchedulingBoard';
import PayrollManagement from '@/components/ADMIN_1_HR/PayrollManagement';
import ReportsAndAnalytics from '@/components/ADMIN_1_HR/ReportsAndAnalytics';

const RRHHModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Recursos Humanos (ADMIN 1)</h1>
    <Tabs defaultValue="dashboard">
      <TabsList><TabsTrigger value="dashboard">Dashboard</TabsTrigger><TabsTrigger value="staff">Personal</TabsTrigger><TabsTrigger value="scheduling">Turnos</TabsTrigger><TabsTrigger value="payroll">Nóminas</TabsTrigger><TabsTrigger value="reports">Reportes</TabsTrigger></TabsList>
      <TabsContent value="dashboard"><HRDashboard /></TabsContent>
      <TabsContent value="staff"><StaffDirectory /></TabsContent>
      <TabsContent value="scheduling"><SchedulingBoard /></TabsContent>
      <TabsContent value="payroll"><PayrollManagement /></TabsContent>
      <TabsContent value="reports"><ReportsAndAnalytics /></TabsContent>
    </Tabs>
  </div>
);
export default RRHHModule;
