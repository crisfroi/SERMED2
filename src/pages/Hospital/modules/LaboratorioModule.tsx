// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LabOrderForm from '@/components/ASIS_10_Laboratorio/LabOrderForm';
import LabResultsViewer from '@/components/ASIS_10_Laboratorio/LabResultsViewer';
import QualityControlDashboard from '@/components/ASIS_10_Laboratorio/QualityControlDashboard';

const LaboratorioModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Laboratorio (ASIS 10)</h1>
    <Tabs defaultValue="orders">
      <TabsList><TabsTrigger value="orders">Órdenes</TabsTrigger><TabsTrigger value="results">Resultados</TabsTrigger><TabsTrigger value="qc">Control Calidad</TabsTrigger></TabsList>
      <TabsContent value="orders"><LabOrderForm /></TabsContent>
      <TabsContent value="results"><LabResultsViewer /></TabsContent>
      <TabsContent value="qc"><QualityControlDashboard /></TabsContent>
    </Tabs>
  </div>
);
export default LaboratorioModule;
