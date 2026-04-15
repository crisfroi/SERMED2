// @ts-nocheck
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeliveryForm from '@/components/ASIS_04_Obstetricia/DeliveryForm';
import GestationMonitor from '@/components/ASIS_04_Obstetricia/GestationMonitor';
import NewbornAssessment from '@/components/ASIS_04_Obstetricia/NewbornAssessment';
import PostpartumCareForm from '@/components/ASIS_04_Obstetricia/PostpartumCareForm';
import ObstetricRiskAlert from '@/components/ASIS_04_Obstetricia/ObstetricRiskAlert';

const ObstetriciaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Obstetricia (ASIS 4)</h1>
    <Tabs defaultValue="gestacion">
      <TabsList><TabsTrigger value="gestacion">Gestación</TabsTrigger><TabsTrigger value="parto">Parto</TabsTrigger><TabsTrigger value="postparto">Postparto</TabsTrigger><TabsTrigger value="neonato">Neonato</TabsTrigger></TabsList>
      <TabsContent value="gestacion"><GestationMonitor /></TabsContent>
      <TabsContent value="parto"><DeliveryForm /></TabsContent>
      <TabsContent value="postparto"><PostpartumCareForm /></TabsContent>
      <TabsContent value="neonato"><NewbornAssessment /></TabsContent>
    </Tabs>
  </div>
);
export default ObstetriciaModule;
