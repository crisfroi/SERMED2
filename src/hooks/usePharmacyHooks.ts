// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
interface InventoryItem {
  id: string;
  medicine_name: string;
  category: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  expiration_date: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'near_expiration';
  supplier_id: string;
  last_reorder_date: string;
  days_until_expiration: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'delivered' | 'cancelled';
  expected_delivery_date: string;
  actual_delivery_date: string | null;
  created_at: string;
}

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ExpirationAlert {
  id: string;
  medicine_id: string;
  medicine_name: string;
  lot_number: string;
  quantity_affected: number;
  expiration_date: string;
  days_until_expiration: number;
  severity: 'critical' | 'warning' | 'info';
  alert_type: 'near_expiration' | 'expired' | 'disposal_required';
  resolved: boolean;
  cost_impact: number;
}

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// HOOK: useInventoryManagement
// ============================================================================
export const useInventoryManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(
    async (): Promise<ApiResponse<InventoryItem[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('medicine_inventory')
          .select('*')
          .order('medicine_name', { ascending: true });

        if (dbError) throw dbError;

        // Enrich with status and calculated fields
        const enriched = data?.map(item => {
          const now = new Date();
          const expDate = new Date(item.expiration_date);
          const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status = 'in_stock';
          if (daysUntil < 0) {
            status = 'expired';
          } else if (daysUntil < 30) {
            status = 'near_expiration';
          } else if (item.quantity_on_hand <= item.reorder_level) {
            status = item.quantity_on_hand === 0 ? 'out_of_stock' : 'low_stock';
          }

          return {
            ...item,
            status,
            days_until_expiration: Math.max(daysUntil, 0),
          };
        }) || [];

        return { success: true, data: enriched };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching inventory';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const autoReorder = useCallback(
    async (itemId: string): Promise<ApiResponse<PurchaseOrder>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Get inventory item
        const { data: item } = await supabase
          .from('medicine_inventory')
          .select('*, suppliers(id)')
          .eq('id', itemId)
          .single();

        if (!item) throw new Error('Inventory item not found');

        // Create purchase order
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert([
            {
              supplier_id: item.suppliers[0]?.id,
              items: [
                {
                  medicine_id: item.id,
                  medicine_name: item.medicine_name,
                  quantity: item.reorder_level * 2,
                  unit_price: item.unit_cost,
                },
              ],
              total_amount: item.unit_cost * (item.reorder_level * 2),
              status: 'submitted',
              expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ])
          .select()
          .single();

        if (poError) throw poError;

        return { success: true, data: po };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating reorder';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchInventory,
    autoReorder,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useProcurementWorkflow
// ============================================================================
export const useProcurementWorkflow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = useCallback(
    async (): Promise<ApiResponse<PurchaseOrder[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(company_name)')
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        const enriched = data?.map(po => ({
          ...po,
          supplier_name: po.suppliers?.company_name || 'Unknown',
        })) || [];

        return { success: true, data: enriched };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching purchase orders';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchSuppliers = useCallback(
    async (): Promise<ApiResponse<Supplier[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('is_preferred', true)
          .order('company_name', { ascending: true });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching suppliers';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createPurchaseOrder = useCallback(
    async (input: any): Promise<ApiResponse<PurchaseOrder>> => {
      try {
        setIsLoading(true);
        setError(null);

        // Generate PO number
        const poNumber = `PO-${Date.now()}`;

        const { data, error: dbError } = await supabase
          .from('purchase_orders')
          .insert([
            {
              po_number: poNumber,
              supplier_id: input.supplier_id,
              items: input.items,
              total_amount: input.items.reduce((sum: number, item: any) => sum + item.subtotal, 0),
              status: 'draft',
              expected_delivery_date: input.expected_delivery_date,
              notes: input.notes,
            },
          ])
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error creating purchase order';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const approvePurchaseOrder = useCallback(
    async (poId: string): Promise<ApiResponse<PurchaseOrder>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('purchase_orders')
          .update({ status: 'approved' })
          .eq('id', poId)
          .select()
          .single();

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error approving purchase order';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchPurchaseOrders,
    fetchSuppliers,
    createPurchaseOrder,
    approvePurchaseOrder,
    isLoading,
    error,
  };
};

// ============================================================================
// HOOK: useExpirationTracking
// ============================================================================
export const useExpirationTracking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpirationAlerts = useCallback(
    async (): Promise<ApiResponse<ExpirationAlert[]>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('expiration_alerts')
          .select('*')
          .order('days_until_expiration', { ascending: true });

        if (dbError) throw dbError;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error fetching expiration alerts';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const markAlertResolved = useCallback(
    async (alertId: string, action: 'used' | 'destroyed' | 'returned'): Promise<ApiResponse<void>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { error: dbError } = await supabase
          .from('expiration_alerts')
          .update({
            resolved: true,
            resolution_action: action,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', alertId);

        if (dbError) throw dbError;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error marking alert resolved';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAlert = useCallback(
    async (alertId: string): Promise<ApiResponse<void>> => {
      try {
        setIsLoading(true);
        setError(null);

        const { error: dbError } = await supabase
          .from('expiration_alerts')
          .delete()
          .eq('id', alertId);

        if (dbError) throw dbError;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error deleting alert';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    fetchExpirationAlerts,
    markAlertResolved,
    deleteAlert,
    isLoading,
    error,
  };
};
