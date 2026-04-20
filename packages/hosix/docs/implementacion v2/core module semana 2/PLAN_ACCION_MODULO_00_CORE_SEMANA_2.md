# 🏥 PLAN DE ACCIÓN - CORE EXPANSION - SEMANA 2
## Red de Hospitales Públicos de Guinea Ecuatorial

**Período**: 28 Abril - 2 Mayo 2026   
**Módulo**: 00-Core (Patient Management + Hospital Management)   
**Completitud Meta**: 60% → 88%   
**Entregable Principal**: Patient & Hospital Management Robustess   

---

## 📋 RESUMEN EJECUTIVO

### Qué se logró en Semana 1
- ✅ 133 tests PASSING (E2E + Unit + Component)
- ✅ Security layer completa (Encryption, 2FA, RLS)
- ✅ Auth framework robusto

### Qué se logrará en Semana 2
- ✅ Patient Search avanzada (múltiples criterios)
- ✅ Patient Profile expandido (datos demográficos, contactos, alergias)
- ✅ Hospital Management (instituciones, departamentos, ubicaciones)
- ✅ Validation layer completa (DNI, teléfono, email, etc.)
- ✅ Audit logging en todas las operaciones
- ✅ **+150 TESTS nuevos** (Total: 283 tests PASSING)

---

## 🎯 OBJETIVOS SEMANA 2

### Objetivo 1: Patient Search Avanzada
**Completitud**: 45% → 85%

**Features**:
```
- Búsqueda por ID único (sistema + externo)
- Búsqueda por DNI/Cédula
- Búsqueda por nombres y apellidos
- Búsqueda por fecha de nacimiento
- Búsqueda por teléfono
- Búsqueda por email
- Filtros combinados (AND/OR logic)
- Resultados paginados
- Privacy: Hash búsquedas sensibles (DNI)
```

**Tests Necesarios**:
- E2E: Flujo completo búsqueda → resultados → perfil
- Unit: Cada criterio de búsqueda
- Unit: Lógica de combinación de filtros
- Component: SearchForm con validación
- Component: SearchResults table
- Component: Paginación

### Objetivo 2: Patient Profile Completo
**Completitud**: 50% → 90%

**Tabs/Secciones**:
```
1. DEMOGRÁFICOS
   - Nombres y apellidos (cambiar case on edit)
   - Fecha de nacimiento
   - Sexo/Género
   - DNI/Cédula de identidad
   - Ocupación
   - Nivel educativo
   - Estado civil
   
2. CONTACTO
   - Teléfono principal
   - Teléfono secundario
   - Email primario
   - Email secundario
   - Dirección principal
   - Dirección secundaria
   - Hospital preferido
   
3. ALERGIAS & COMORBILIDADES
   - Alergias medicamentosas (severidad)
   - Alergias ambientales
   - Comorbilidades (ICD-10)
   - Medicamentos actuales
   - Estado: Activo/Inactivo
   
4. AUDITORÍA
   - Creación: usuario + fecha + hora
   - Últimas modificaciones
   - Cambios de estado
   - Historial de búsquedas
```

**Tests Necesarios**:
- E2E: Navegación entre tabs
- E2E: Edición y guardado de datos
- Unit: Validación de cada campo
- Unit: Transformación de datos (case, formato)
- Component: Cada sección como componente
- Component: Modal edición
- Component: Audit log display

### Objetivo 3: Hospital Management
**Completitud**: 30% → 75%

**Funcionalidades**:
```
1. LISTAR HOSPITALES
   - Nombre de institución
   - Región/Provincia
   - Ciudad
   - Nivel de complejidad (I, II, III)
   - Número de camas
   - Responsable (Director)
   - Estado: Activo/Inactivo
   
2. DEPARTAMENTOS
   - Listar por hospital
   - Nombre de departamento
   - Especialidad
   - Jefe de departamento
   - Cantidad personal
   - Localizaciones
   
3. UBICACIONES
   - Piso
   - Ala
   - Sala número
   - Capacidad camas
   - Equipamiento
   - Estado
```

**Tests Necesarios**:
- E2E: Listar hospitales → seleccionar → ver departamentos
- E2E: Filtrar por nivel de complejidad
- Unit: Validación hospital data
- Unit: Relación Hospital ↔ Department ↔ Location
- Component: HospitalList
- Component: DepartmentList
- Component: LocationDetail

### Objetivo 4: Validation Layer
**Completitud**: 40% → 90%

**Validators**:
```typescript
// DNI/Cédula
validateDNI(dni: string, country: string): boolean

// Teléfono
validatePhoneNumber(phone: string, country: string): boolean

// Email
validateEmail(email: string): boolean

// Nombre
validateName(name: string): boolean // Letras, espacios, acentos

// Edad
validateAge(dob: Date, minAge: number, maxAge: number): boolean

// Fecha
validateDate(date: Date, before?: Date, after?: Date): boolean

// Selecciona
validateRequired(value: any): boolean

// Enum
validateEnum(value: string, enum: string[]): boolean

// Comorbilidades
validateComorbidity(icdCode: string): boolean
```

**Tests**: 
- Unit: Cada validador con casos válidos e inválidos
- Unit: Edge cases
- Integration: Validación en formularios

### Objetivo 5: Audit Logging
**Completitud**: 20% → 85%

**Lo que se audita**:
```
- CREATE: Patient
- UPDATE: Patient (campos específicos)
- UPDATE: Hospital
- UPDATE: Department
- UPDATE: Location
- SEARCH: Búsquedas de pacientes (sin PII en logs)
- DELETE: (soft delete con timestamp)

Cada registro contiene:
- action: CREATE|UPDATE|DELETE|SEARCH
- table: patients|hospitals|departments|locations
- recordId: ID del registro afectado
- userId: Quién hizo la acción
- timestamp: Cuándo
- changes: {before, after} para UPDATE
- ipAddress: De dónde
- sessionId: Sesión del usuario
```

**Tests**:
- E2E: Crear paciente → verificar audit log
- E2E: Editar paciente → verificar cambios en log
- Unit: Formato del audit entry
- Unit: Privacy de audit (no expone PII)
- Component: Audit log viewer

---

## 🗄️ ESQUEMA SUPABASE REQUERIDO

### Tablas Nuevas/Expandidas

```sql
-- EXPANDIR: patients
ALTER TABLE patients ADD COLUMN (
  full_name_upper VARCHAR,    -- Para búsqueda case-insensitive
  external_id VARCHAR,        -- ID externo de otro sistema
  nationality VARCHAR,
  occupation VARCHAR,
  education_level VARCHAR,
  marital_status VARCHAR,
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR
);

-- NUEVA: patient_contacts
CREATE TABLE patient_contacts (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  contact_type VARCHAR ('phone' | 'email' | 'address'),
  value VARCHAR,
  is_primary BOOLEAN,
  verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: patient_allergies
CREATE TABLE patient_allergies (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  allergy_type VARCHAR ('medication' | 'environmental' | 'food'),
  allergen VARCHAR,
  severity VARCHAR ('mild' | 'moderate' | 'severe' | 'life-threatening'),
  reaction_description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: patient_comorbidities
CREATE TABLE patient_comorbidities (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  icd10_code VARCHAR,
  diagnosis_name VARCHAR,
  onset_date DATE,
  status VARCHAR ('active' | 'inactive' | 'resolved'),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: hospitals
CREATE TABLE hospitals (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  province_region VARCHAR,
  city VARCHAR,
  complexity_level VARCHAR ('I' | 'II' | 'III'),
  total_beds INTEGER,
  director_name VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  status VARCHAR ('active' | 'inactive'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: departments
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  hospital_id UUID REFERENCES hospitals(id),
  name VARCHAR NOT NULL,
  specialty VARCHAR,
  department_head_name VARCHAR,
  total_staff INTEGER,
  total_beds INTEGER,
  status VARCHAR ('active' | 'inactive'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: locations
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  department_id UUID REFERENCES departments(id),
  floor INTEGER,
  wing VARCHAR,
  room_number VARCHAR,
  total_beds INTEGER,
  equipment TEXT,
  status VARCHAR ('active' | 'maintenance' | 'closed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NUEVA: audit_logs (EXPANDIDA)
ALTER TABLE audit_logs ADD COLUMN (
  session_id UUID,
  ip_address VARCHAR,
  change_details JSONB,    -- {before: {}, after: {}}
  search_criteria JSONB    -- Solo para SEARCH actions, sin PII
);
```

---

## 🧪 TESTS A CREAR

### Test Suite 1: Patient Search E2E
**Archivo**: `src/__tests__/e2e/patient-search.e2e.test.ts`
**Tests**: 35 tests

```typescript
describe('Patient Search E2E Workflow', () => {
  // By ID (sistema + externo)
  // By DNI (con hash privacy)
  // By nombres
  // By fecha nacimiento
  // By teléfono
  // By email
  // Combinación filtros
  // Paginación
  // Resultados privacidad (show/hide PII)
  // Error handling (no resultados)
  // Performance (búsqueda rápida)
```

### Test Suite 2: Patient Management Unit
**Archivo**: `src/__tests__/utils/patient-validation.test.ts`
**Tests**: 50 tests

```typescript
describe('Patient Validation & Transformation', () => {
  // Validar DNI (múltiples formatos)
  // Validar teléfono (múltiples países)
  // Validar email
  // Validar nombre (acentos, espacios)
  // Validar edad (rango permitido)
  // Transformación datos (case, trim)
  // Validación comorbilidades (ICD-10)
  // Validación alergias (severidad)
```

### Test Suite 3: Patient Profile Component
**Archivo**: `src/__tests__/components/PatientProfile.test.tsx`
**Tests**: 45 tests

```typescript
describe('Patient Profile Component', () => {
  // Renderizar tabs
  // Tab Demográficos (mostrar y editar)
  // Tab Contacto (múltiples contactos)
  // Tab Alergias & Comorbilidades
  // Tab Auditoría (mostrar cambios)
  // Edición modal
  // Guardado de cambios
  // Validación en real-time
  // Error display
```

### Test Suite 4: Hospital Management Unit
**Archivo**: `src/__tests__/utils/hospital-validation.test.ts`
**Tests**: 35 tests

```typescript
describe('Hospital Management Validation', () => {
  // Validar datos hospital
  // Relación Hospital → Department
  // Relación Department → Location
  // Filtrar por complejidad
  // Filtrar por región
  // Validación números (camas, personal)
```

### Test Suite 5: Hospital Management Component
**Archivo**: `src/__tests__/components/HospitalManagement.test.tsx`
**Tests**: 25 tests

```typescript
describe('Hospital Management Components', () => {
  // HospitalList (listar)
  // Filtros por nivel complejidad
  // Filtros por región
  // DepartmentList (expandir hospital)
  // LocationDetail (mostrar ubicaciones)
  // Estado rendering (activo/inactivo)
```

### Test Suite 6: Audit Logging
**Archivo**: `src/__tests__/utils/audit-logging.test.ts`
**Tests**: 15 tests

```typescript
describe('Audit Logging', () => {
  // Crear audit entry
  // Formato correcto
  // No expone PII
  // Incluye userId + timestamp
  // Incluye changes (before/after)
  // Valida action types
```

---

## 📂 COMPONENTES A CREAR/EXPANDIR

### Nuevos Componentes

```
src/components/patient-management/
├── PatientSearch.tsx
├── SearchForm.tsx (input con validación)
├── SearchResults.tsx (tabla paginada)
├── SearchFilters.tsx (AND/OR logic)
├── PatientProfile.tsx (tabs)
├── PatientDemographics.tsx
├── PatientContacts.tsx
├── PatientAllergies.tsx
├── PatientComorbidities.tsx
├── PatientAuditLog.tsx
└── EditPatientModal.tsx

packages/hosix/src/components/hospital-management/
├── HospitalManagement.tsx (vista principal)
├── HospitalList.tsx
├── HospitalFilters.tsx
├── DepartmentList.tsx
├── LocationDetail.tsx
└── HospitalDetails.tsx
```

### Nuevos Hooks

```
src/hooks/
├── usePatientSearch.ts (lógica búsqueda)
├── usePatientProfile.ts (obtener + editar)
├── usePatientAudit.ts (obtener audit log)
├── useHospitalManagement.ts
├── useValidation.ts (todos los validators)
└── useAuditLog.ts (crear entries)
```

---

## ⏰ TIMELINE DETALLADO - SEMANA 2

```
LUNES 28 ABRIL (DÍA 6)
├─ 09:00-10:00  Daily standup + Review Semana 1
├─ 10:00-12:00  Crear schema Supabase (tablas nuevas)
├─ 12:00-13:00  Almuerzo
├─ 13:00-15:00  Crear test file: patient-search.e2e.test.ts
├─ 15:00-17:00  Crear test file: patient-validation.test.ts
└─ 17:00        EOD checkpoint

MARTES 29 ABRIL (DÍA 7)
├─ 10:00        Daily standup
├─ 10:15-12:00  Implementar validadores en useValidation.ts
├─ 12:00-13:00  Almuerzo
├─ 13:00-15:00  Crear test file: hospital-validation.test.ts
├─ 15:00-17:00  Crear usePatientSearch hook
└─ 17:00        EOD checkpoint

MIÉRCOLES 30 ABRIL (DÍA 8)
├─ 10:00        Daily standup
├─ 10:15-12:00  Crear test file: PatientProfile.test.tsx
├─ 12:00-13:00  Almuerzo
├─ 13:00-15:00  Crear componentes patient-management/
├─ 15:00-17:00  Crear test file: HospitalManagement.test.tsx
└─ 17:00        EOD checkpoint

JUEVES 1 MAYO (DÍA 9) 🌴
├─ 10:00        Daily standup (feriado mitad de día)
├─ 10:15-12:00  Crear test file: audit-logging.test.ts
├─ 12:00        Pausa feriado
└─ 14:00-16:00  Crear componentes hospital-management/
                Crear hooks faltantes
                Ejecutar todos los tests

VIERNES 2 MAYO (DÍA 10)
├─ 10:00        Daily standup
├─ 10:15-14:00  Test execution & debugging
├─ 14:00-15:00  Fix failing tests (si hay)
├─ 15:00-16:00  Performance validation
├─ 16:00-17:00  WEEK 2 RETROSPECTIVE
└─ 17:00        All tests PASSING ✅
                Plan WEEK 3
```

---

## 🧪 CRITERIOS DE ÉXITO - SEMANA 2

```
MÉTRICA                         TARGET        STATUS
─────────────────────────────────────────────────────
Test suites nuevas              6             ⏳
Tests nuevos creados            205           ⏳
Tests PASSING                   205/205       ⏳ Meta
Tests coverage (Patient)        >80%          ⏳ Meta
Tests coverage (Hospital)       >75%          ⏳ Meta
Performance (p95 search)        <200ms        ⏳ Meta
Schema Supabase completo        ✅            ⏳ Meta
Validadores funcionales         100%          ⏳ Meta
Audit logging funcional         100%          ⏳ Meta
Documentación actualizada       100%          ⏳ Meta
Componentes funcionales         100%          ⏳ Meta
```

---

## 📊 PROGRESO ESPERADO

```
Semana 1 (Completado):
├─ Core: 60% → 73% (Semana 1 actual)
├─ Tests: 0 → 133 ✅
├─ Security: 0% → 100% ✅
└─ Status: ON TRACK ✅

Semana 2 (Objetivo):
├─ Core: 73% → 88%
├─ Tests: 133 → 338 (+205 nuevos)
├─ Patient Management: 50% → 90%
├─ Hospital Management: 30% → 75%
├─ Audit Logging: 20% → 85%
└─ Status: TARGET = 338 PASSING TESTS

Semana 3 (Próxima):
├─ Core: 88% → 100%
├─ Tests: 338 → 450+ (+112 nuevos)
├─ Data Sync: Implementar
├─ Real-time: Supabase subscriptions
└─ Ready: Para MEDICATIONS (Fase 2)
```

---

## 🎯 VALORES DE ÉXITO SEMANA 2

### Métricas de Éxito Cuantitativas

```
✅ Todos los tests PASSING (338 total)
✅ Zero skipped tests
✅ Zero warnings
✅ Coverage >80% (patient), >75% (hospital)
✅ Performance p95 <200ms (searches)
✅ All validators functional
✅ Audit logging on ALL changes
✅ RLS policies covering new tables
```

### Señales de Calidad

```
✅ Patient search rápida (incluso con 100k pacientes)
✅ Profile editable sin errores
✅ Hospital management intuitivo
✅ Validaciones en real-time
✅ Errores claros y accionables
✅ Audit trail completo
```

---

## 🚀 ENTREGABLES SEMANA 2

### Código
- ✅ 6 test suites nuevos (205 tests)
- ✅ 12 componentes nuevos (patient + hospital management)
- ✅ 7 hooks nuevos (search, validation, audit)
- ✅ Schema Supabase expandido (7 tablas nuevas)
- ✅ All tests PASSING

### Documentación
- ✅ README actualizado con Patient Management
- ✅ README actualizado con Hospital Management
- ✅ API docs para nuevos endpoints
- ✅ Validator documentation
- ✅ Audit logging guide

### Status
- ✅ Core: 73% → 88%
- ✅ Tests: 133 → 338 (205 nuevos)
- ✅ Ready para Semana 3

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Schema Supabase incompleto | Baja | Alto | Validar migrations |
| Tests fallan por imports | Media | Bajo | Jest config |
| Performance búsqueda lenta | Media | Medio | Índices en Supabase |
| Validadores complejos | Baja | Bajo | TDD approach |
| RLS policies no cubren casos | Media | Medio | Security review |

---

## 📞 ESCALACIÓN

**Si hay bloqueos:**
- Tests no pasan: Revisar Jest config + imports
- Schema issues: Validar Supabase migrations
- Performance issues: Crear índices, revisar queries
- Business logic unclear: Referencia GNU Tryton

---

## 📝 NOTAS IMPLEMENTACIÓN

### Validadores
- Use regex para DNI/teléfono (por país)
- Email: RFC 5322 validation
- Nombres: Allow letters + acentos + espacios
- Edades: Min 0, Max 120

### Privacy
- Búsquedas sensibles: Hash el DNI en búsqueda
- Audit logs: Nunca incluir DNI/teléfono completo
- Resultados: Mostrar solo si usuario tiene permisos

### Performance
- Índices en: patients.dni_hash, patients.full_name_upper
- Paginación: 20 resultados default
- Búsquedas: Limitar a 1000 resultados

### Testing
- E2E: Mock Supabase con datos ficticios
- Unit: Mock database calls
- Component: Mock hooks

---

## ✨ CONCLUSIÓN

```
┌─────────────────────────────────────────┐
│ SEMANA 2: Patient & Hospital Expansion   │
│                                          │
│ Entrada: 60% + 133 tests ✅             │
│ Salida: 88% + 338 tests 🎯              │
│ +205 nuevos tests                        │
│ +7 tablas Supabase                       │
│ +12 componentes React                    │
│ +7 hooks personalizados                  │
│                                          │
│ Timeline: 28 Abril - 2 Mayo             │
│ Status: READY FOR IMPLEMENTATION        │
└─────────────────────────────────────────┘
```

---

**Documento**: Plan de Acción Semana 2   
**Módulo**: 00-Core   
**Versión**: 1.0   
**Fecha**: 20 de Abril de 2026   
**Status**: ✅ LISTO PARA IMPLEMENTACIÓN   

