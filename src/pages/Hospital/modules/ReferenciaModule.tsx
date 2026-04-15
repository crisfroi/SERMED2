// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReferralRequestForm from '@/components/ASIS_11_Referencia/ReferralRequestForm';
import ReferralTrackingViewer from '@/components/ASIS_11_Referencia/ReferralTrackingViewer';
import OutcomeAssessmentForm from '@/components/ASIS_11_Referencia/OutcomeAssessmentForm';

const ReferenciaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Referencia y Contrarreferencia (ASIS 11)</h1>
    <Tabs defaultValue="request">
      <TabsList><TabsTrigger value="request">Solicitud</TabsTrigger><TabsTrigger value="tracking">Seguimiento</TabsTrigger><TabsTrigger value="outcome">Resultados</TabsTrigger></TabsList>
      <TabsContent value="request"><ReferralRequestForm /></TabsContent>
      <TabsContent value="tracking"><ReferralTrackingViewer /></TabsContent>
      <TabsContent value="outcome"><OutcomeAssessmentForm /></TabsContent>
    </Tabs>
  </div>
);
export default ReferenciaModule;
