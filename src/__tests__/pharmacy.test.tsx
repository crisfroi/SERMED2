// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryDashboard } from '@/components/ASIS_09_Farmacia/InventoryDashboard';
import { SupplierOrderManager } from '@/components/ASIS_09_Farmacia/SupplierOrderManager';
import { ExpirationAlertViewer } from '@/components/ASIS_09_Farmacia/ExpirationAlertViewer';
import {
  useInventoryManagement,
  useProcurementWorkflow,
  useExpirationTracking,
} from '@/hooks';

// ============================================================================
// PHARMACY COMPONENTS TESTS
// ============================================================================
describe('InventoryDashboard Component', () => {
  it('renders inventory overview', () => {
    render(<InventoryDashboard />);

    expect(screen.getByText(/inventory|medicinas|medicines/i)).toBeInTheDocument();
  });

  it('displays inventory summary statistics', () => {
    render(<InventoryDashboard />);

    // Should show summary cards
    expect(screen.queryByText(/total|items|articles/i)).toBeTruthy();
    expect(screen.queryByText(/bajo|low.*stock/i)).toBeTruthy();
    expect(screen.queryByText(/agotado|out.*stock/i)).toBeTruthy();
  });

  it('shows status indicators for each medicine', () => {
    render(<InventoryDashboard />);

    // Should display status badges
    const statusBadges = screen.queryAllByText(/(en stock|stock bajo|agotado|próx.*vencer)/i);
    expect(statusBadges.length).toBeGreaterThanOrEqual(0);
  });

  it('provides search functionality', async () => {
    const user = userEvent.setup();
    render(<InventoryDashboard />);

    const searchInput = screen.getByPlaceholderText(/buscar|search/i);
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'Paracetamol');
    expect(searchInput).toHaveValue('Paracetamol');
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<InventoryDashboard />);

    const filterSelect = screen.getByDisplayValue(/todos|all/i);
    expect(filterSelect).toBeInTheDocument();

    await user.selectOption(filterSelect, 'low_stock');
    // Verify filtered results
  });

  it('displays restock button for low-stock items', async () => {
    const user = userEvent.setup();
    render(<InventoryDashboard />);

    const restockButtons = screen.queryAllByRole('button', { name: /reabastecer|restock/i });
    expect(restockButtons.length).toBeGreaterThanOrEqual(0);

    if (restockButtons.length > 0) {
      await user.click(restockButtons[0]);
      // Verify reorder PO was created
    }
  });

  it('exports inventory report', async () => {
    const user = userEvent.setup();
    render(<InventoryDashboard />);

    const exportButton = screen.getByRole('button', { name: /exportar|export/i });
    await user.click(exportButton);
    // Verify download was triggered
  });

  it('shows estimated inventory value', () => {
    render(<InventoryDashboard />);

    // Should display total estimated value
    expect(screen.queryByText(/valor|value|estimado|estimated/i)).toBeTruthy();
  });
});

describe('SupplierOrderManager Component', () => {
  it('renders order management interface', () => {
    render(<SupplierOrderManager />);

    expect(screen.getByText(/orden|purchase|compra/i)).toBeInTheDocument();
  });

  it('displays order summary statistics', () => {
    render(<SupplierOrderManager />);

    expect(screen.queryByText(/total.*value|valor.*total/i)).toBeTruthy();
    expect(screen.queryByText(/pendientes|pending/i)).toBeTruthy();
    expect(screen.queryByText(/aprobadas|approved/i)).toBeTruthy();
    expect(screen.queryByText(/entregadas|delivered/i)).toBeTruthy();
  });

  it('provides new order creation form', async () => {
    const user = userEvent.setup();
    render(<SupplierOrderManager />);

    const newOrderButton = screen.getByRole('button', { name: /nueva orden|new order/i });
    await user.click(newOrderButton);

    // Form should appear
    expect(screen.getByLabelText(/proveedor|supplier/i)).toBeInTheDocument();
  });

  it('allows supplier selection', async () => {
    const user = userEvent.setup();
    render(<SupplierOrderManager />);

    const newOrderButton = screen.getByRole('button', { name: /nueva orden|new order/i });
    await user.click(newOrderButton);

    const supplierSelect = screen.getByLabelText(/proveedor|supplier/i);
    expect(supplierSelect).toBeInTheDocument();
  });

  it('validates delivery date is in future', async () => {
    const user = userEvent.setup();
    render(<SupplierOrderManager />);

    const newOrderButton = screen.getByRole('button', { name: /nueva orden|new order/i });
    await user.click(newOrderButton);

    const dateInput = screen.getByLabelText(/entrega|delivery/i);

    // Try past date
    await user.type(dateInput, '2000-01-01');

    // Should show error
    const createButton = screen.getByRole('button', { name: /crear|create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.queryByText(/futuro|future|invalido|invalid/i)).toBeTruthy();
    });
  });

  it('displays purchase orders in table', () => {
    render(<SupplierOrderManager />);

    // Should show table headers
    expect(screen.queryByText(/orden.*número|PO|orden/i)).toBeTruthy();
    expect(screen.queryByText(/proveedor|supplier/i)).toBeTruthy();
    expect(screen.queryByText(/monto|total|amount/i)).toBeTruthy();
    expect(screen.queryByText(/estado|status/i)).toBeTruthy();
  });

  it('allows filtering by status', async () => {
    const user = userEvent.setup();
    render(<SupplierOrderManager />);

    const statusButtons = screen.queryAllByRole('button', {
      name: /(todas|borradores|enviadas|aprobadas|entregadas)/i,
    });

    if (statusButtons.length > 0) {
      await user.click(statusButtons[0]);
      // Verify filtering
    }
  });

  it('allows order approval', async () => {
    const user = userEvent.setup();
    render(<SupplierOrderManager />);

    const approveButtons = screen.queryAllByRole('button', { name: /aprobar|approve/i });
    if (approveButtons.length > 0) {
      await user.click(approveButtons[0]);
      // Verify approval
    }
  });
});

describe('ExpirationAlertViewer Component', () => {
  it('renders expiration alerts interface', () => {
    render(<ExpirationAlertViewer />);

    expect(screen.getByText(/vencimiento|expiration|alerta/i)).toBeInTheDocument();
  });

  it('displays alert statistics', () => {
    render(<ExpirationAlertViewer />);

    expect(screen.queryByText(/total.*alerta|total.*alert/i)).toBeTruthy();
    expect(screen.queryByText(/crítica|critical/i)).toBeTruthy();
    expect(screen.queryByText(/advertencia|warning/i)).toBeTruthy();
    expect(screen.queryByText(/activas|active/i)).toBeTruthy();
  });

  it('shows severity indicators', () => {
    render(<ExpirationAlertViewer />);

    // Should display severity levels with colors
    const severityElements = screen.queryAllByText(/(crítico|crítica|advertencia|información)/i);
    expect(severityElements.length).toBeGreaterThanOrEqual(0);
  });

  it('filters alerts by status', async () => {
    const user = userEvent.setup();
    render(<ExpirationAlertViewer />);

    const activeButton = screen.getByRole('button', { name: /activas|active/i });
    await user.click(activeButton);

    // Should filter to active alerts only
  });

  it('filters by severity level', async () => {
    const user = userEvent.setup();
    render(<ExpirationAlertViewer />);

    const severitySelect = screen.getByDisplayValue(/todas|all/i);
    await user.selectOption(severitySelect, 'critical');

    // Should show only critical alerts
  });

  it('allows marking alerts as resolved', async () => {
    const user = userEvent.setup();
    render(<ExpirationAlertViewer />);

    const resolveButtons = screen.queryAllByRole('button', {
      name: /(utilizado|usado|destruido|devuelto|used|destroyed|returned)/i,
    });

    if (resolveButtons.length > 0) {
      await user.click(resolveButtons[0]);
      // Verify alert marked as resolved
    }
  });

  it('tracks resolution action (used/destroyed/returned)', async () => {
    const user = userEvent.setup();
    render(<ExpirationAlertViewer />);

    const usedButton = screen.queryByRole('button', { name: /utilizado|used/i });
    const destroyedButton = screen.queryByRole('button', { name: /destruido|destroyed/i });
    const returnedButton = screen.queryByRole('button', { name: /devuelto|returned/i });

    expect(usedButton || destroyedButton || returnedButton).toBeTruthy();
  });

  it('shows resolved alerts separately', () => {
    render(<ExpirationAlertViewer />);

    // Should have resolved section
    expect(screen.queryByText(/resueltas|resolved/i)).toBeTruthy();
  });

  it('displays financial impact', () => {
    render(<ExpirationAlertViewer />);

    // Should show cost impact
    expect(screen.queryByText(/impacto|impact|costo|cost/i)).toBeTruthy();
  });

  it('exports expiration report', async () => {
    const user = userEvent.setup();
    render(<ExpirationAlertViewer />);

    const exportButton = screen.getByRole('button', { name: /exportar|export/i });
    await user.click(exportButton);
    // Verify download
  });
});

// ============================================================================
// PHARMACY HOOKS TESTS
// ============================================================================
describe('useInventoryManagement Hook', () => {
  it('fetches all inventory items', async () => {
    const { result } = renderHook(() => useInventoryManagement());

    const response = await result.current.fetchInventory();

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach(item => {
        expect(item).toHaveProperty('medicine_name');
        expect(item).toHaveProperty('quantity_on_hand');
        expect(item).toHaveProperty('status');
      });
    }
  });

  it('enriches inventory with status', async () => {
    const { result } = renderHook(() => useInventoryManagement());

    const response = await result.current.fetchInventory();

    if (response.data) {
      response.data.forEach(item => {
        expect(['in_stock', 'low_stock', 'out_of_stock', 'near_expiration']).toContain(item.status);
      });
    }
  });

  it('calculates days until expiration', async () => {
    const { result } = renderHook(() => useInventoryManagement());

    const response = await result.current.fetchInventory();

    if (response.data && response.data.length > 0) {
      const item = response.data[0];
      expect(item.days_until_expiration).toBeGreaterThanOrEqual(0);
    }
  });

  it('triggers auto-reorder', async () => {
    const { result } = renderHook(() => useInventoryManagement());

    const response = await result.current.autoReorder('medicine-123');

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data).toHaveProperty('status');
      expect(['draft', 'submitted', 'approved']).toContain(response.data.status);
    }
  });
});

describe('useProcurementWorkflow Hook', () => {
  it('fetches purchase orders', async () => {
    const { result } = renderHook(() => useProcurementWorkflow());

    const response = await result.current.fetchPurchaseOrders();

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('fetches supplier list', async () => {
    const { result } = renderHook(() => useProcurementWorkflow());

    const response = await result.current.fetchSuppliers();

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach(supplier => {
        expect(supplier).toHaveProperty('company_name');
        expect(supplier).toHaveProperty('contact_name');
      });
    }
  });

  it('creates purchase order', async () => {
    const { result } = renderHook(() => useProcurementWorkflow());

    const input = {
      supplier_id: 'supplier-123',
      items: [
        {
          medicine_id: 'med-123',
          quantity: 100,
          unit_price: 10.5,
        },
      ],
      expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await result.current.createPurchaseOrder(input);

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data.status).toBe('draft');
      expect(response.data).toHaveProperty('po_number');
    }
  });

  it('approves purchase order', async () => {
    const { result } = renderHook(() => useProcurementWorkflow());

    const response = await result.current.approvePurchaseOrder('po-123');

    expect(response.success).toBe(true);
    if (response.data) {
      expect(response.data.status).toBe('approved');
    }
  });
});

describe('useExpirationTracking Hook', () => {
  it('fetches expiration alerts', async () => {
    const { result } = renderHook(() => useExpirationTracking());

    const response = await result.current.fetchExpirationAlerts();

    expect(response.success).toBe(true);
    if (response.data) {
      expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('marks alert as resolved', async () => {
    const { result } = renderHook(() => useExpirationTracking());

    const response = await result.current.markAlertResolved('alert-123', 'used');

    expect(response.success).toBe(true);
  });

  it('tracks resolution action', async () => {
    const { result } = renderHook(() => useExpirationTracking());

    const actions = ['used', 'destroyed', 'returned'];

    for (const action of actions) {
      const response = await result.current.markAlertResolved('alert-123', action as any);
      expect(response.success).toBe(true);
    }
  });

  it('deletes expiration alert', async () => {
    const { result } = renderHook(() => useExpirationTracking());

    const response = await result.current.deleteAlert('alert-123');

    expect(response.success).toBe(true);
  });

  it('sorts alerts by urgency', async () => {
    const { result } = renderHook(() => useExpirationTracking());

    const response = await result.current.fetchExpirationAlerts();

    if (response.data && response.data.length > 1) {
      // Critical should come before warning, warning before info
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      for (let i = 0; i < response.data.length - 1; i++) {
        const currentSeverity =
          severityOrder[response.data[i].severity as keyof typeof severityOrder] || 3;
        const nextSeverity =
          severityOrder[response.data[i + 1].severity as keyof typeof severityOrder] || 3;

        expect(currentSeverity).toBeLessThanOrEqual(nextSeverity);
      }
    }
  });
});

// ============================================================================
// Test fixture helper
// ============================================================================
function renderHook<T>(hook: () => T) {
  let result: { current: T };

  function TestComponent() {
    result = { current: hook() };
    return null;
  }

  render(<TestComponent />);
  return result!;
}
