# WEEK 11 - ADMIN 1: GESTIÓN DE RECURSOS HUMANOS (HR Management)
## Plan de Implementación - RENAPROSA HOSIX

**Proyecto**: ADMIN 1 - Recursos Humanos (RH)  
**Semana**: 11 (Mayo 1-18, 2026)  
**Target**: 8,500 líneas de código  
**Moneda**: XAF (Francos CFA)  
**Arquitectura**: HOSIX autónomo (THALAMUS = sync opcional, no blocking)  

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────┐
│         HOSPITAL HOSIX LOCAL            │
│     (Sistema completamente autónomo)    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌────────────────┐   │
│  │   NÓMINA    │  │      RRHH      │   │
│  │  (en XAF)   │  │                │   │
│  └─────────────┘  └────────────────┘   │
│         ↓                  ↓            │
│  ┌─────────────┐  ┌────────────────┐   │
│  │   Turnos    │  │  Inventarios   │   │
│  │  Personal   │  │   Staff        │   │
│  └─────────────┘  └────────────────┘   │
│         ↓                  ↓            │
│     Auditoría Local    RLS Local        │
│                                         │
└─────────────────────────────────────────┘
         ↓ (opcional)
    ┌─────────────┐
    │  THALAMUS   │  (Agregaciones cross-hospital)
    │ (Sincronización centralizada - NO BLOCKING)
    └─────────────┘
```

### Componentes ADMIN 1

| Módulo | Funcionalidad | Estado |
|--------|---------------|--------|
| **Nómina** | Cálculo de salarios (XAF), deducciones, bonificaciones | IMPLEMENTAR |
| **RRHH** | Datos de empleados, contratos, historial | IMPLEMENTAR |
| **Turnos** | Programación de turnos, disponibilidad | IMPLEMENTAR |
| **Asistencia** | ⚠️ **PENDIENTE** (Fase posterior) | TODO |
| **Reportes** | Nóminas, RRHH, turnos, análisis cross-hospital | IMPLEMENTAR |

---

## ⚠️ CONTROL DE ASISTENCIA - PENDIENTE

**Próxima fase (no en WEEK 11)**:
- Sistema de registro de entrada/salida
- Integración biométrica (ya existe en ASIS 13)
- Cálculo automático de horas trabajadas
- Validación de asistencia para nómina
- **TICKET**: ADMIN_1_ASISTENCIA_PHASE_2

**Impacto actual**: Nómina será manual/semi-automática (entrada de datos)

---

## 📊 ESPECIFICACIONES POR HITO

### **HITO 1: SQL MIGRATIONS** (1,200 líneas) ✅ **COMPLETO**

**Archivo**: `migrations/002_admin_1_hr_schema.sql` (450+ líneas SQL)

#### Tablas (7 principales)

```sql
-- 1. PERSONAL RECORDS
CREATE TABLE staff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  employee_id VARCHAR(20) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  identification_number VARCHAR(20),
  position_id UUID,
  department_id UUID,
  salary_xaf DECIMAL(15,2),  -- Salario mensual en XAF
  hire_date DATE,
  contract_type VARCHAR(50), -- 'indefinido', 'temporal', 'contrato'
  employment_status VARCHAR(30), -- 'activo', 'licencia', 'suspendido', 'jubilado'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  audit_trail JSONB
);

-- 2. PAYROLL PROCESSING
CREATE TABLE payroll_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff_records(id),
  payroll_period VARCHAR(7), -- 'YYYY-MM' (ej: '2026-05')
  base_salary_xaf DECIMAL(15,2),
  bonuses_xaf DECIMAL(15,2) DEFAULT 0,
  deductions_xaf DECIMAL(15,2) DEFAULT 0,
  taxes_xaf DECIMAL(15,2) DEFAULT 0,
  net_salary_xaf DECIMAL(15,2), -- Base - Deducciones - Impuestos
  status VARCHAR(30), -- 'draft', 'approved', 'processed', 'paid'
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_by UUID,
  processed_by UUID,
  audit_trail JSONB
);

-- 3. STAFF POSITIONS
CREATE TABLE staff_positions (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL,
  position_name VARCHAR(100),
  position_level VARCHAR(50), -- 'senior', 'mid', 'junior'
  basic_salary_xaf DECIMAL(15,2), -- Salario base para la posición
  department_id UUID,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 4. SALARY ADJUSTMENTS (Ajustes, bonificaciones, descuentos)
CREATE TABLE salary_adjustments (
  id UUID PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff_records(id),
  adjustment_type VARCHAR(50), -- 'bonus', 'deduction', 'increase', 'decrease'
  amount_xaf DECIMAL(15,2),
  description VARCHAR(500),
  effective_date DATE,
  reason_code VARCHAR(100),
  approved_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. STAFF SCHEDULING (Turnos)
CREATE TABLE staff_scheduling (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff_records(id),
  schedule_date DATE,
  shift_type VARCHAR(50), -- 'morning', 'afternoon', 'night', 'on-call'
  shift_start TIME,
  shift_end TIME,
  location_department VARCHAR(100),
  is_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. STAFF DEPARTMENTS
CREATE TABLE staff_departments (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL,
  department_name VARCHAR(100),
  department_head_id UUID,
  budget_xaf DECIMAL(15,2), -- Presupuesto departamento
  staff_count INT DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 7. PAYROLL LOGS (Auditoría de procesos de nómina)
CREATE TABLE payroll_audit_log (
  id UUID PRIMARY KEY,
  hospital_id UUID NOT NULL,
  payroll_id UUID NOT NULL,
  action VARCHAR(100), -- 'created', 'approved', 'processed', 'paid', 'modified'
  performed_by UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  reason TEXT
);
```

#### Índices (12+)
```sql
CREATE INDEX idx_payroll_hospital_period ON payroll_processing(hospital_id, payroll_period);
CREATE INDEX idx_payroll_staff ON payroll_processing(staff_id);
CREATE INDEX idx_schedule_staff_date ON staff_scheduling(staff_id, schedule_date);
CREATE INDEX idx_salary_adjustments_staff ON salary_adjustments(staff_id);
CREATE INDEX idx_staff_hospital_status ON staff_records(hospital_id, employment_status);
-- ... 7+ más
```

#### RLS Policies (5)
```sql
-- Director: acceso completo a su hospital
-- HR Manager: acceso a staff, nómina, turnos
-- Staff: solo su propio registro (salario, turnos)
-- Finance: solo nómina procesada
-- Admin: acceso reducido
```

#### Triggers (4)
```sql
-- Actualizar updated_at en staff_records
-- Log de cambios en payroll_processing
-- Calcular net_salary cuando cambia base/bonos/deducciones
-- Auditoría de acceso a datos salariales
```

---

### **HITO 2: REACT COMPONENTS** (2,200 líneas)

#### Componentes (5 principales)

1. **HRDashboard (500L)**
   - Vista general de personal
   - KPIs: Total staff, ocupación, rotación
   - Turnos próximos
   - Nóminas pendientes
   - Integración THALAMUS (si disponible): Staff cross-hospital

2. **PayrollManagement (600L)**
   - Crear/editar nóminas
   - Cálculo de salarios (XAF)
   - Bonificaciones y deducciones
   - Aprobación de nóminas
   - Exportar nómina (PDF, Excel)
   - Historial de pagos

3. **StaffDirectory (500L)**
   - Listado de empleados
   - Búsqueda/filtros
   - Editar datos personales, contrato
   - Cargar documentos (CV, certificados)
   - Historial laboral

4. **SchedulingBoard (450L)**
   - Vista de turnos (semanal/mensual)
   - Asignar turnos
   - Conflictos de horario
   - Disponibilidad de personal
   - **NOTA**: Integración con control de asistencia será en PHASE 2

5. **ReportsAndAnalytics (150L)**
   - Reportes de nómina
   - Análisis de costos (XAF)
   - Reportes RRHH

---

### **HITO 3: CUSTOM HOOKS** (1,800 líneas)

1. **useStaffManagement (450L)**
   - CRUD staff_records
   - Búsqueda, filtros
   - Validaciones

2. **usePayrollProcessing (500L)**
   - Crear/editar nóminas (XAF)
   - Cálculos automáticos
   - Flujo de aprobación
   - Exportar

3. **useStaffScheduling (450L)**
   - CRUD turnos
   - Detección de conflictos
   - Disponibilidad

4. **useThalamusStaffSync (400L)** [OPCIONAL]
   - Sincronizar staff a THALAMUS (si se requiere)
   - Consultas cross-hospital (lectura)
   - **NO blocking** - sistema funciona sin esto

---

### **HITO 4: EDGE FUNCTIONS** (1,800 líneas)

1. **calculat_payroll (500L)**
   - Calcular net_salary (XAF)
   - Aplicar bonos, deducciones, impuestos
   - Generar nómina
   - **PENDIENTE**: Integración con asistencia

2. **process_payroll_approval (300L)**
   - Flujo de aprobación
   - Validaciones

3. **generate_payroll_report (400L)**
   - PDF con nóminas
   - Excel con detalles

4. **sync_staff_to_thalamus (300L)**
   - Sincronizar datos a THALAMUS (si aplica)

5. **process_staff_updates (300L)**
   - Log de cambios
   - Auditoría

---

### **HITO 5: TEST SUITE** (1,000 líneas)

- 100+ test cases
- Component tests (React)
- Hook tests (useStaffManagement, usePayrollProcessing, etc)
- Integration tests (flujo completo de nómina)
- Edge Function tests

---

## 💰 MONEDA: XAF EN TODOS LADOS

Todos los valores monetarios:
- Salarios: `salary_xaf DECIMAL(15,2)`
- Bonificaciones: `bonuses_xaf DECIMAL(15,2)`
- Deducciones: `deductions_xaf DECIMAL(15,2)`
- Impuestos: `taxes_xaf DECIMAL(15,2)`
- Neto: `net_salary_xaf DECIMAL(15,2)`

**Formato en UI**: "25,500.50 XAF" o "25.500,50 XAF" (según locale)

---

## ⚠️ CONTROL DE ASISTENCIA - PENDIENTE

**No está en WEEK 11:**
```
┌─────────────────────────────────────┐
│    CONTROL DE ASISTENCIA (TODO)     │
│                                     │
│ • Check-in/Check-out               │
│ • Integración biométrica (opcional) │
│ • Cálculo de horas reales          │
│ • Validación para nómina           │
│ • Reportes de asistencia           │
│                                     │
│ FASE: Posterior a WEEK 11          │
│ TICKET: ADMIN_1_ASISTENCIA_PHASE_2 │
└─────────────────────────────────────┘
```

**Por ahora en nómina:**
- Manual: HR ingresa horas trabajadas
- Futura: Se actualizará automáticamente cuando esté el módulo de asistencia

---

## 📅 TIMELINE WEEK 11

```
Lunes 1 mayo:    Hito 1 (SQL) complete + Hito 2 started
Miércoles 3 mayo: Hito 2 (React) complete + Hito 3 started
Viernes 5 mayo:   Hito 3 (Hooks) complete + Hito 4 started
Lunes 8 mayo:     Hito 4 (Functions) + Hito 5 started
Viernes 12 mayo:  Hito 5 (Tests) complete
Lunes 15 mayo:    Documentation + Sign-off
Miércoles 17 mayo: Deployment approval

Fin: 18 mayo (entrega complete)
```

---

## 🚀 ¿COMENZAMOS?

**Confirma**:
- ✅ Arquitectura HOSIX autónomo (OK)
- ✅ Moneda XAF (OK)
- ✅ Control de asistencia PENDIENTE (OK)
- ✅ 5 Hitos comenzando ahora (OK)

**¿Listo para Hito 1 SQL?** 🏗️
