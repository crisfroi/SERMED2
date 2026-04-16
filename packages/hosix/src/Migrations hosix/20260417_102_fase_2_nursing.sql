-- FASE 2 Module 3: Nursing Management
-- Tables: nursing_tasks, care_orders, nurse_shifts, task_assignments

CREATE TABLE IF NOT EXISTS nursing_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('once', 'every_2h', 'every_4h', 'every_6h', 'daily')),
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS care_orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  order_type TEXT NOT NULL,
  order_description TEXT,
  ordered_by UUID NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nurse_shifts (
  shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id UUID NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'night')),
  start_time TIME,
  end_time TIME,
  department TEXT,
  assigned_patients INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES nursing_tasks(task_id),
  nurse_id UUID NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_nursing_tasks_patient_id ON nursing_tasks(patient_id);
CREATE INDEX idx_nursing_tasks_status ON nursing_tasks(status);
CREATE INDEX idx_care_orders_patient_id ON care_orders(patient_id);
CREATE INDEX idx_nurse_shifts_nurse_id ON nurse_shifts(nurse_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);

INSERT INTO ehr_audit_trail (action, table_name, details, severity)
VALUES ('schema_migration', 'nursing_tasks,care_orders,nurse_shifts,task_assignments', 'FASE 2 Module 3: Nursing Management tables created', 'high');
