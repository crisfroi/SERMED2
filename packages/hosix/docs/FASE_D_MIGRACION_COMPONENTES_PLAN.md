# 🚚 FASE D: MIGRACIÓN DE COMPONENTES - PLAN EJECUCIÓN

**Fecha:** Abril 16, 2026  
**Fase:** D - Migración Física de Componentes  
**Duración Estimada:** 4-6 horas  
**Status:** INICIANDO AHORA  

---

## 📋 PLAN DE MIGRACIÓN

### Estrategia

1. **Lote 1 - Componentes P0 (20):** Module 14, 15, 16 → nuevos módulos
2. **Lote 2 - Componentes Sueltos (16):** Asignar a módulos sin home
3. **Lote 3 - ASIS Components (67):** Migrar desde src/components/ASIS_* → módulos
4. **Lote 4 - Hooks antiguos (25+):** Migrar a módulos correspondientes

### Orden de Ejecución

```
PASO 1: Mover componentes P0 (Auth, Patient, Clinical-docs)
        └─> packages/hosix/src/components/auth/*
            → packages/hosix/src/modules/00-core/auth/components/
        └─> packages/hosix/src/components/patient/*
            → packages/hosix/src/modules/00-core/patients/components/
        └─> packages/hosix/src/components/clinical/*
            → packages/hosix/src/modules/07-clinical-docs/components/

PASO 2: Mover componentes sueltos (16)
        └─> packages/hosix/src/components/AuditTrailDashboard.tsx
            → packages/hosix/src/modules/00-core/shared/components/
        └─> [15 más según matriz]

PASO 3: Mover ASIS components (67)
        └─> src/components/ASIS_04_Obstetricia/*
            → packages/hosix/src/modules/01-obstetrics/components/
        └─> [10+ más según matriz]

PASO 4: Mover hooks antiguos (25+)
        └─> src/hooks/useMealPlan.ts
            → packages/hosix/src/modules/03-nutrition/hooks/
        └─> [24+ más]
```

---

## 🔄 DETALLE POR LOTE

### LOTE 1: Componentes P0 (20 componentes)

**Ubicación Actual → Nueva**

#### Module 00-core/auth (6 componentes)
```
packages/hosix/src/components/auth/
├── EnhancedLoginForm.tsx 
    → packages/hosix/src/modules/00-core/auth/components/
├── RegistrationForm.tsx
├── PasswordResetForm.tsx
├── PermissionGuard.tsx
├── RoleBasedRoute.tsx
└── UserProfileForm.tsx
```

#### Module 00-core/patients (7 componentes)
```
packages/hosix/src/components/patient/
├── PatientSearchForm.tsx
    → packages/hosix/src/modules/00-core/patients/components/
├── PatientProfileView.tsx
├── PatientDemographicsForm.tsx
├── MedicalHistoryCard.tsx
├── PatientListTable.tsx
├── PatientDetailsTabs.tsx
└── index.ts
```

#### Module 07-clinical-docs (7 componentes)
```
packages/hosix/src/components/clinical/
├── VisitNotesForm.tsx
    → packages/hosix/src/modules/07-clinical-docs/components/
├── DiagnosisForm.tsx
├── PrescriptionForm.tsx
├── DocumentSigningInterface.tsx
├── DocumentViewer.tsx
├── ClinicalDocumentationTabs.tsx
└── index.ts
```

**Acción:** Copiar + Actualizar imports

---

### LOTE 2: Componentes Sueltos (16 componentes)

**Matriz de Asignación:**

| Componente | Líneas | Destino | Acción |
|-----------|--------|---------|--------|
| AuditTrailDashboard | 85 | 00-core/shared/components/ | Copiar |
| ComorbidityMatrixEditor | 120 | 08-diagnoses/components/ | Copiar |
| DocumentEncryptionStatus | 95 | 07-clinical-docs/components/ | Copiar |
| ExpandedDiagnosisForm | 160 | 08-diagnoses/components/ | Copiar |
| FollowupRecommendations | 105 | 00-core/shared/components/ | Copiar |
| ICDSystemSelector | 90 | 08-diagnoses/components/ | Copiar |
| KitManager | 110 | 06-medications/components/ | Copiar |
| MealPlanBuilder | 140 | 03-nutrition/components/ | Copiar |
| MedicationStockDashboard | 130 | 06-medications/components/ | Copiar |
| MilestoneTracker | 100 | 02-pediatrics/components/ | Copiar |
| NutritionComplianceTracker | 125 | 03-nutrition/components/ | Copiar |
| ReferralTracker | 140 | 00-core/shared/components/ | Copiar |
| RegimensBuilder | 135 | 06-medications/components/ | Copiar |
| SpecialistFinder | 120 | 00-core/shared/components/ | Copiar |
| VersionHistoryViewer | 145 | 07-clinical-docs/components/ | Copiar |
| WHOPercentileChart | 160 | 02-pediatrics/components/ | Copiar |

**Acción:** Copiar todos a nuevos módulos

---

### LOTE 3: ASIS Components (67 componentes)

**Carpetas a Migrar:**

| Carpeta | # Files | Destino | Acción |
|---------|---------|---------|--------|
| ASIS_04_Obstetricia | 8 | 01-obstetrics/ | Copiar |
| ASIS_05_CRED | 6 | 02-pediatrics/ | Copiar |
| ASIS_8_Dietetica | 3 | 03-nutrition/ | Copiar |
| ASIS_9_Inmunizacion | 3 | 05-immunization/ | Copiar |
| ASIS_10_Medicamentos | 4 | 06-medications/ | Copiar |
| ASIS_7_Cirugia | 3 | 04-surgery/ | Copiar |
| ASIS_13_EHR | 5 | 00-core/ehr/ | Copiar |
| ASIS_14_Diagnostico | 6 | 08-diagnoses/ | Copiar |
| ASIS_15_Imagenes | 3 | 09-imaging/ | Copiar |
| ... (más) | 21 | Varios | Copiar |

**Acción:** Copiar carpetas completas

---

### LOTE 4: Hooks Antiguos (25+ hooks)

**Migración de Hooks:**

| Hook | Líneas | Destino | Acción |
|------|--------|---------|--------|
| useAuditIntegration | 150 | 00-core/shared/hooks/ | Copiar |
| useChildGrowthWHO | 180 | 02-pediatrics/hooks/ | Copiar |
| useComorbidityMatrix | 140 | 08-diagnoses/hooks/ | Copiar |
| useDiagnosisExpanding | 160 | 08-diagnoses/hooks/ | Copiar |
| useDiagnosisManagement | 170 | 08-diagnoses/hooks/ | Copiar |
| useDocumentEncryption | 95 | 07-clinical-docs/hooks/ | Copiar |
| useEHRVersioning | 120 | 00-core/ehr/hooks/ | Copiar |
| useICDSystemSwitch | 90 | 08-diagnoses/hooks/ | Copiar |
| useMealPlan | 140 | 03-nutrition/hooks/ | Copiar |
| useMedicationKit | 110 | 06-medications/hooks/ | Copiar |
| useMedicationRegimen | 135 | 06-medications/hooks/ | Copiar |
| useMilestoneTracking | 100 | 02-pediatrics/hooks/ | Copiar |
| useNutritionAssessment | 125 | 03-nutrition/hooks/ | Copiar |
| useNutritionCompliance | 145 | 03-nutrition/hooks/ | Copiar |
| usePediatricInfo | 130 | 02-pediatrics/hooks/ | Copiar |
| useReferralFollowup | 115 | 00-core/shared/hooks/ | Copiar |
| useReferralManagement | 140 | 00-core/shared/hooks/ | Copiar |
| useSpecialistLookup | 120 | 00-core/shared/hooks/ | Copiar |
| useStockReservation | 95 | 06-medications/hooks/ | Copiar |
| useStockVariants | 110 | 06-medications/hooks/ | Copiar |
| ... (5+ más) | - | Varios | Copiar |

**Acción:** Copiar a módulos correspondientes

---

## ⚠️ ACTUALIZACIÓN DE IMPORTS

**Patrones a Actualizar:**

```typescript
// ANTES (old path)
import { Component } from '@/components/auth'
import { useHook } from '@/hooks'

// DESPUÉS (new path)
import { Component } from '@/modules/00-core/auth/components'
import { useHook } from '@/modules/00-core/auth/hooks'

// O usando exports del módulo
import { Component, useHook } from '@/modules/00-core/auth'
```

---

## 📊 TRACKING

| Lote | Componentes | Status | Tiempo Est. |
|------|-------------|--------|------------|
| 1 - P0 | 20 | ⏳ | 45 min |
| 2 - Sueltos | 16 | ⏳ | 30 min |
| 3 - ASIS | 67 | ⏳ | 2-3 horas |
| 4 - Hooks | 25+ | ⏳ | 1-2 horas |
| **Actualizar imports + verificación** | - | ⏳ | 1 hora |

**TOTAL: 5-7 horas**

---

## ✅ CHECKLIST PRE-MIGRACIÓN

- [x] Estructura de destino creada (FASE C)
- [x] Matriz de migración definida (FASE A)
- [ ] Backup de archivos originales (git)
- [ ] Migración LOTE 1 (P0)
- [ ] Migración LOTE 2 (Sueltos)
- [ ] Migración LOTE 3 (ASIS)
- [ ] Migración LOTE 4 (Hooks)
- [ ] Actualizar todos los imports
- [ ] Crear archivo de mapeo de imports
- [ ] Validar estructura (SIN BUILD)

---

## 🚀 INICIANDO MIGRACIÓN LOTE 1

Próximo paso: Copiar componentes P0 → nuevos módulos

**SIN npm run build al final ✓**
