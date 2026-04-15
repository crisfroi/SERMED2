// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DicomViewer from '@/components/ASIS_15_Imagenes/DicomViewer';
import ImagingOrderForm from '@/components/ASIS_15_Imagenes/ImagingOrderForm';
import RadiologyReport from '@/components/ASIS_15_Imagenes/RadiologyReport';

const ImagenesModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Imágenes Médicas (ASIS 15)</h1>
    <Tabs defaultValue="orders">
      <TabsList><TabsTrigger value="orders">Órdenes</TabsTrigger><TabsTrigger value="viewer">Visor DICOM</TabsTrigger><TabsTrigger value="reports">Informes</TabsTrigger></TabsList>
      <TabsContent value="orders"><ImagingOrderForm /></TabsContent>
      <TabsContent value="viewer"><DicomViewer /></TabsContent>
      <TabsContent value="reports"><RadiologyReport /></TabsContent>
    </Tabs>
  </div>
);
export default ImagenesModule;
