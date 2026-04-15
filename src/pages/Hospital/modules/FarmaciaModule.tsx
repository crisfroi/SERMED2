// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryDashboard from '@/components/ASIS_09_Farmacia/InventoryDashboard';
import ExpirationAlertViewer from '@/components/ASIS_09_Farmacia/ExpirationAlertViewer';
import SupplierOrderManager from '@/components/ASIS_09_Farmacia/SupplierOrderManager';

const FarmaciaModule = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Farmacia (ASIS 9)</h1>
    <Tabs defaultValue="inventory">
      <TabsList><TabsTrigger value="inventory">Inventario</TabsTrigger><TabsTrigger value="expiration">Caducidades</TabsTrigger><TabsTrigger value="suppliers">Proveedores</TabsTrigger></TabsList>
      <TabsContent value="inventory"><InventoryDashboard /></TabsContent>
      <TabsContent value="expiration"><ExpirationAlertViewer /></TabsContent>
      <TabsContent value="suppliers"><SupplierOrderManager /></TabsContent>
    </Tabs>
  </div>
);
export default FarmaciaModule;
