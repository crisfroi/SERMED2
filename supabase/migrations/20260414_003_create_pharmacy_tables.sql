-- ============================================================================
-- WEEK 4 - HITO 1: SQL SCHEMAS
-- ASIS 9: Farmacia e Inventario - Control de Medicamentos y Suministros
-- FECHA: Abril 14, 2026 - 03:00 UTC
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: medicine_inventory (HITO 1: Core table)
-- Inventario principal de medicinas en farmacia
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicine_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- Medicine identification
  medicine_id UUID NOT NULL REFERENCES public.medication_types(id),
  medicine_code VARCHAR(50) NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  presentation VARCHAR(100), -- "500mg tablet", "10ml injection"
  
  -- Inventory tracking
  quantity_on_hand DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity_unit VARCHAR(50), -- tablets, vials, boxes, ml
  
  -- Storage
  storage_location VARCHAR(255), -- Shelf A3, Fridge B1, etc.
  batch_number VARCHAR(100),
  
  -- Temporal data
  expiration_date DATE,
  days_until_expiration INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (expiration_date - CURRENT_DATE))::INTEGER
  ) STORED,
  received_date DATE DEFAULT CURRENT_DATE,
  
  -- Ordering and reordering
  minimum_stock_level DECIMAL(10, 2) DEFAULT 10,
  reorder_quantity DECIMAL(10, 2) DEFAULT 50,
  reorder_point_quantity DECIMAL(10, 2), -- Auto-trigger reorder below this
  average_daily_consumption DECIMAL(10, 2) DEFAULT 0,
  
  -- Pricing
  unit_cost DECIMAL(10, 4),
  total_cost DECIMAL(14, 2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost) STORED,
  supplier_price DECIMAL(10, 4),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, discontinued, recall, out_of_stock
  reorder_status VARCHAR(50) DEFAULT 'normal', -- normal, reorder_pending, critical
  cold_chain_required BOOLEAN DEFAULT FALSE,
  controlled_substance BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  last_inventory_count_date DATE,
  last_inventory_count_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA: inventory_movements
-- Historial de movimientos de inventario (entradas, salidas, ajustes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES public.medicine_inventory(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- Movement classification
  movement_type VARCHAR(50) NOT NULL, -- purchase, dispensing, waste, loss, adjustment, transfer, return
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Quantity movement
  quantity_moved DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(50),
  quantity_before DECIMAL(10, 2),
  quantity_after DECIMAL(10, 2),
  
  -- Related entities
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  dispensed_to_patient_id UUID REFERENCES public.patients(id),
  prescription_id VARCHAR(100),
  
  -- Movement details
  reason_code VARCHAR(50), -- stock_receipt, patient_dispensing, waste_disposal, shrinkage, correction
  movement_reason TEXT,
  responsible_user_id UUID NOT NULL REFERENCES public.users(id),
  
  -- Batch/Lot information
  batch_number VARCHAR(100),
  expiration_date DATE,
  
  -- Cost tracking
  unit_cost_at_movement DECIMAL(10, 4),
  total_cost DECIMAL(14, 2),
  
  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  approved_by_id UUID REFERENCES public.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  document_reference VARCHAR(255), -- Purchase order #, receipt #, etc.
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA: suppliers
-- Directorio de proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- Supplier identification
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  legal_id VARCHAR(50), -- RUC, Tax ID, etc.
  
  -- Contact information
  contact_person_name VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  alternative_phone VARCHAR(20),
  
  -- Address
  street_address VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business details
  supplier_type VARCHAR(50), -- pharmaceutical, medical_supplies, distributor, manufacturer
  medicines_provided TEXT[], -- Array of medicine specialties
  
  -- Terms and conditions
  payment_terms VARCHAR(100), -- Net 30, COD, etc.
  delivery_time_days INTEGER DEFAULT 5,
  minimum_order_amount DECIMAL(10, 2),
  
  -- Pricing
  has_volume_discounts BOOLEAN DEFAULT FALSE,
  standard_discount_percentage DECIMAL(5, 2),
  
  -- Quality and accreditation
  quality_certifications TEXT[], -- ISO, GMP, etc.
  accredited_with_ministry BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended, blacklisted
  is_preferred_supplier BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLA: purchase_orders (HITO 1: Core table)
-- Órdenes de compra y requisiciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- PO identification
  po_number VARCHAR(50) UNIQUE NOT NULL,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Supplier information
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  supplier_contact_person VARCHAR(255),
  
  -- Order items
  order_items JSONB NOT NULL, -- [{medicine_id, medicine_name, quantity, unit_price, subtotal}]
  
  -- Totals
  subtotal_amount DECIMAL(14, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(14, 2),
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(14, 2),
  total_amount DECIMAL(14, 2) NOT NULL,
  
  -- Delivery details
  requested_delivery_date DATE NOT NULL,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_location VARCHAR(255),
  
  -- Special requirements
  refrigerated_shipping BOOLEAN DEFAULT FALSE,
  special_handling_requirements TEXT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, ordered, partially_received, fully_received, cancelled
  approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  
  -- Approval workflow
  submitted_by_id UUID NOT NULL REFERENCES public.users(id),
  submission_date TIMESTAMP WITH TIME ZONE,
  
  approved_by_id UUID REFERENCES public.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  
  received_by_id UUID REFERENCES public.users(id),
  receipt_date TIMESTAMP WITH TIME ZONE,
  
  -- Receiving verification
  received_quantity_matches BOOLEAN,
  quality_inspection_passed BOOLEAN,
  received_notes TEXT,
  
  -- Financial
  payment_method VARCHAR(50), -- check, transfer, cash, credit_card
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid
  payment_date DATE,
  invoice_number VARCHAR(100),
  
  -- Notes
  special_notes TEXT,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: expiration_alerts
-- Sistema de alertas para medicinas próximas a vencer
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expiration_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES public.medicine_inventory(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centros_salud(id),
  
  -- Alert identification
  alert_type VARCHAR(50), -- expiration_warning, expired, almost_expired_stock
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Medicine information
  medicine_name VARCHAR(255) NOT NULL,
  batch_number VARCHAR(100),
  medicine_code VARCHAR(50),
  
  -- Expiration data
  expiration_date DATE NOT NULL,
  days_until_expiration INTEGER,
  quantity_expiring DECIMAL(10, 2),
  
  -- Alert status
  alert_severity VARCHAR(50), -- low, medium, high, critical
  alert_triggered_date DATE,
  
  -- Actions
  action_taken VARCHAR(100), -- none, marked_for_disposal, returned_to_supplier, used_in_emergencies
  action_date DATE,
  action_notes TEXT,
  
  -- Responsible party
  alert_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by_id UUID REFERENCES public.users(id),
  acknowledged_date TIMESTAMP WITH TIME ZONE,
  
  -- Notifications
  notification_sent_to TEXT[], -- Array of email addresses
  notification_sent_date DATE,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_method VARCHAR(100),
  resolved_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - Performance optimization
-- ============================================================================
CREATE INDEX idx_medicine_inventory_center ON public.medicine_inventory(center_id);
CREATE INDEX idx_medicine_inventory_status ON public.medicine_inventory(status);
CREATE INDEX idx_medicine_inventory_reorder ON public.medicine_inventory(reorder_status);
CREATE INDEX idx_medicine_inventory_expiration ON public.medicine_inventory(expiration_date);

CREATE INDEX idx_inventory_movements_inventory ON public.inventory_movements(inventory_id);
CREATE INDEX idx_inventory_movements_center ON public.inventory_movements(center_id);
CREATE INDEX idx_inventory_movements_date ON public.inventory_movements(movement_date);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(movement_type);

CREATE INDEX idx_suppliers_center ON public.suppliers(center_id);
CREATE INDEX idx_suppliers_status ON public.suppliers(status);

CREATE INDEX idx_purchase_orders_center ON public.purchase_orders(center_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON public.purchase_orders(po_date);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);

CREATE INDEX idx_expiration_alerts_inventory ON public.expiration_alerts(inventory_id);
CREATE INDEX idx_expiration_alerts_center ON public.expiration_alerts(center_id);
CREATE INDEX idx_expiration_alerts_severity ON public.expiration_alerts(alert_severity);
CREATE INDEX idx_expiration_alerts_resolved ON public.expiration_alerts(resolved);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.medicine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiration_alerts ENABLE ROW LEVEL SECURITY;

-- medicine_inventory - Pharmacy staff can manage
CREATE POLICY rls_medicine_inventory_select ON public.medicine_inventory
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'nurse') OR
    center_id = (SELECT center_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY rls_medicine_inventory_insert ON public.medicine_inventory
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist')
  );

CREATE POLICY rls_medicine_inventory_update ON public.medicine_inventory
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist')
  );

-- inventory_movements - Audit trail for all users
CREATE POLICY rls_inventory_movements_select ON public.inventory_movements
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'nurse', 'auditor')
  );

CREATE POLICY rls_inventory_movements_insert ON public.inventory_movements
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'nurse')
  );

-- suppliers - Procurement staff only
CREATE POLICY rls_suppliers_select ON public.suppliers
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'procurement_officer')
  );

CREATE POLICY rls_suppliers_modify ON public.suppliers
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'role' IN ('admin', 'procurement_officer')
  );

-- purchase_orders - Procurement workflow
CREATE POLICY rls_purchase_orders_select ON public.purchase_orders
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'procurement_officer', 'accountant')
  );

CREATE POLICY rls_purchase_orders_insert ON public.purchase_orders
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'procurement_officer')
  );

CREATE POLICY rls_purchase_orders_update ON public.purchase_orders
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'procurement_officer')
  );

-- expiration_alerts - Pharmacy alerts
CREATE POLICY rls_expiration_alerts_select ON public.expiration_alerts
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'pharmacist', 'nurse')
  );

-- ============================================================================
-- TRIGGERS - Automated functions
-- ============================================================================

-- Calculate reorder status
CREATE OR REPLACE FUNCTION update_reorder_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_on_hand <= NEW.reorder_point_quantity THEN
    NEW.reorder_status := 'reorder_pending';
  ELSIF NEW.quantity_on_hand < NEW.minimum_stock_level THEN
    NEW.reorder_status := 'critical';
  ELSE
    NEW.reorder_status := 'normal';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reorder_status
  BEFORE INSERT OR UPDATE ON public.medicine_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_reorder_status();

-- Auto-update inventory when receiving PO
CREATE OR REPLACE FUNCTION process_purchase_order_receipt()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  medicine_inv_id UUID;
BEGIN
  IF NEW.status = 'fully_received' AND OLD.status != 'fully_received' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.order_items) LOOP
      -- Find or create inventory record
      SELECT id INTO medicine_inv_id FROM public.medicine_inventory
      WHERE medicine_id::text = (item->>'medicine_id')
      AND center_id = NEW.center_id;
      
      -- Create movement record
      IF medicine_inv_id IS NOT NULL THEN
        INSERT INTO public.inventory_movements 
        (inventory_id, center_id, movement_type, quantity_moved, purchase_order_id, responsible_user_id)
        VALUES 
        (medicine_inv_id, NEW.center_id, 'purchase', (item->>'quantity')::DECIMAL, NEW.id, NEW.received_by_id);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_po_receipt
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_purchase_order_receipt();

-- Create expiration alerts
CREATE OR REPLACE FUNCTION check_expiration_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if expiration alert already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.expiration_alerts
    WHERE inventory_id = NEW.id
    AND expiration_date = NEW.expiration_date
    AND resolved = FALSE
  ) THEN
    -- Create alert if within 30 days of expiration
    IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      INSERT INTO public.expiration_alerts 
      (inventory_id, center_id, alert_type, medicine_name, expiration_date, quantity_expiring, alert_severity)
      VALUES 
      (NEW.id, NEW.center_id, 'expiration_warning', NEW.medicine_name, NEW.expiration_date, NEW.quantity_on_hand,
       CASE WHEN NEW.expiration_date <= CURRENT_DATE THEN 'critical'
            WHEN NEW.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'high'
            WHEN NEW.expiration_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'medium'
            ELSE 'low' END);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_expiration
  AFTER INSERT OR UPDATE ON public.medicine_inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_expiration_alerts();

-- ============================================================================
-- GRANTS - Permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.medicine_inventory TO authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT SELECT ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.purchase_orders TO authenticated;
GRANT SELECT ON public.expiration_alerts TO authenticated;
