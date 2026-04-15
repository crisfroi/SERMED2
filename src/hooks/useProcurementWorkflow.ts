// ============================================================================
// useProcurementWorkflow Hook - Pharmacy Procurement Management
// Handle purchase orders, supplier management, and procurement workflow
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'delivered' | 'cancelled';
  expected_delivery_date: string;
  created_at: string;
  notes?: string;
}

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export const useProcurementWorkflow = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (queryError) throw queryError;

      setSuppliers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async (supplierId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setPurchaseOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPurchaseOrder = useCallback(async (
    supplierId: string,
    items: OrderItem[],
    expectedDeliveryDate: string,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0);

      const { data, error: insertError } = await supabase
        .from('purchase_orders')
        .insert([
          {
            supplier_id: supplierId,
            total_amount: totalAmount,
            status: 'draft',
            expected_delivery_date: expectedDeliveryDate,
            notes,
            created_by: user?.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Insert order items
      if (data && data[0]) {
        const orderItems = items.map(item => ({
          purchase_order_id: data[0].id,
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      await fetchPurchaseOrders();
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating purchase order');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPurchaseOrders]);

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: 'draft' | 'submitted' | 'approved' | 'delivered' | 'cancelled'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await fetchPurchaseOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating order status');
    } finally {
      setLoading(false);
    }
  }, [fetchPurchaseOrders]);

  return {
    suppliers,
    purchaseOrders,
    loading,
    error,
    fetchSuppliers,
    fetchPurchaseOrders,
    createPurchaseOrder,
    updateOrderStatus,
  };
};
