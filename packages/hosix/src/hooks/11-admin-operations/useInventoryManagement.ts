// ============================================================================
// useInventoryManagement Hook - Pharmacy Inventory Control
// Handle medication stock levels, movements, and inventory tracking
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@hosix/hooks/shared/useAuth';

interface MedicationInventory {
  id: string;
  medicine_id: string;
  medicine_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  location: string;
  last_updated: string;
}

interface InventoryMovement {
  id: string;
  medicine_id: string;
  movement_type: 'purchase' | 'dispensing' | 'adjustment' | 'return';
  quantity: number;
  reason: string;
  recorded_by: string;
  recorded_at: string;
}

interface InventoryAlert {
  medicine_id: string;
  medicine_name: string;
  current_stock: number;
  minimum_stock: number;
  alert_type: 'low_stock' | 'overstock' | 'critical';
}

export const useInventoryManagement = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<MedicationInventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('medication_inventory')
        .select('*, medicine:medicine_id(name, unit_of_measure)')
        .order('medicine_name', { ascending: true });

      if (queryError) throw queryError;

      setInventory(
        (data || []).map((item) => ({
          id: item.id,
          medicine_id: item.medicine_id,
          medicine_name: item.medicine?.name || item.medicine_id,
          current_stock: item.current_stock_quantity,
          minimum_stock: item.minimum_stock_level,
          maximum_stock: item.maximum_stock_level,
          unit: item.medicine?.unit_of_measure || '',
          location: item.storage_location,
          last_updated: item.updated_at,
        }))
      );

      // Check for alerts
      generateAlerts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAlerts = (inventoryData: any[]) => {
    const alertsList: InventoryAlert[] = [];

    inventoryData.forEach((item) => {
      if (item.current_stock_quantity <= item.minimum_stock_level) {
        alertsList.push({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine?.name || item.medicine_id,
          current_stock: item.current_stock_quantity,
          minimum_stock: item.minimum_stock_level,
          alert_type: item.current_stock_quantity === 0 ? 'critical' : 'low_stock',
        });
      } else if (item.current_stock_quantity > item.maximum_stock_level) {
        alertsList.push({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine?.name || item.medicine_id,
          current_stock: item.current_stock_quantity,
          minimum_stock: item.minimum_stock_level,
          alert_type: 'overstock',
        });
      }
    });

    setAlerts(alertsList);
  };

  const fetchMovements = useCallback(async (medicineId?: string, limit: number = 50) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('inventory_movements')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (medicineId) {
        query = query.eq('medicine_id', medicineId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setMovements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching movements');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordMovement = useCallback(async (
    medicineId: string,
    movementType: 'purchase' | 'dispensing' | 'adjustment' | 'return',
    quantity: number,
    reason: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('inventory_movements')
        .insert([
          {
            medicine_id: medicineId,
            movement_type: movementType,
            quantity,
            reason,
            recorded_by: user?.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Update inventory based on movement
      let quantityChange = quantity;
      if (movementType === 'dispensing' || movementType === 'return') {
        quantityChange = -quantity;
      }

      const { error: updateError } = await supabase
        .from('medication_inventory')
        .update({
          current_stock_quantity: supabase.raw(`current_stock_quantity + ${quantityChange}`),
          updated_at: new Date().toISOString(),
        })
        .eq('medicine_id', medicineId);

      if (updateError) throw updateError;

      await fetchInventory();
      return data?.[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error recording movement');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchInventory]);

  return {
    inventory,
    movements,
    alerts,
    loading,
    error,
    fetchInventory,
    fetchMovements,
    recordMovement,
  };
};
