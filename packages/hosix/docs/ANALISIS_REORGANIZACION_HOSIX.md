# 🏥 HOSIX - ANÁLISIS EXHAUSTIVO DE REORGANIZACIÓN

**Fecha:** Abril 16, 2026  
**Propósito:** Consolidar entendimiento antes de reestructuración total  
**Estado:** ANÁLISIS EN PROGRESS  

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual - Caos Documentado](#estado-actual---caos-documentado)
3. [Visión GNU Health](#visión-gnu-health)
4. [Plan de Reorganización (Paso a Paso)](#plan-de-reorganización-paso-a-paso)
5. [Estructura Nueva Propuesta](#estructura-nueva-propuesta)
6. [Análisis de Componentes Actuales](#análisis-de-componentes-actuales)
7. [Análisis de Funciones Edge](#análisis-de-funciones-edge)
8. [Análisis de Migraciones](#análisis-de-migraciones)
9. [Próximos Pasos](#próximos-pasos)

---

## 🎯 RESUMEN EJECUTIVO

### El Problema
HOSIX está **completamente desordenado**:
- **19 módulos parcialmente implementados** sin estructura clara
- **70+ archivos de documentación** esparcidos (marean más que ayudan)
- **32 Edge Functions** donde ~60% NO son de HOSIX
- **Componentes dispersos** en carpetas con nombres inconsistentes (ASIS_04 vs ASIS_7 vs ASIS_8_Laboratorio vs ASIS_10_Laboratorio)
- **Hooks incompletos** y mal organizados
- **Migraciones** aplicadas pero no documentadas en relación a módulos

### La Solución
Reorganizar TODO con **lógica arquitectónica clara** basada en GNU Health:

```
packages/hosix/
├── src/
│   ├── modules/              ← Nuevo: Organizados por módulo clínico
│   │   ├── core/             (Module 0)
│   │   ├── obstetrics/       (ASIS 04)
│   │   ├── pediatrics/       (ASIS 05 + módulos pediátricos)
│   │   ├── lab/              (ASIS 08)
│   │   ├── imaging/          (ASIS 15)
│   │   ├── medications/      (ASIS 10+)
│   │   ├── clinical-docs/    (ASIS 16)
│   │   ├── appointments/     (Coming Module 18)
│   │   ├── billing/          (Coming Module 19)
│   │   ├── hr/               (Coming Module 20)
│   │   └── analytics/        (Coming Module 21)
│   │
│   ├── services/             ← Compartidos entre módulos
│   ├── contexts/             ← Global state
│   ├── hooks/                ← Hooks de aplicación general
│   └── utils/                ← Utilidades comunes
│
├── functions/                ← NUEVO: Funciones Edge que SÍ son HOSIX
│   ├── clinical/
│   ├── medications/
│   ├── obstetrics/
│   ├── lab/
│   └── imaging/
│
├── docs/                     ← NUEVO: Documentación de HOSIX solamente
│   ├── architecture/
│   ├── modules/              ← MD por cada módulo
│   ├── database/
│   └── api/
│
└── README.md                 ← Entry point único para HOSIX
```

### Beneficios
✅ Claridad total sobre qué es qué
✅ Fácil agregar nuevos módulos
✅ Reducción de duplicidad ~60%
✅ Mejor mantenimiento
✅ Escalable a 50+ módulos

---

## ⚠️ ESTADO ACTUAL - CAOS DOCUMENTADO

### Componentes Duplicados/Confusos

```
Laboratorio tiene 2 ubicaciones:
├── ASIS_08_Laboratorio/      (probablemente la antigua)
└── ASIS_10_Laboratorio/      ← ¿Cuál es la correcta?

Inmunización tiene 2 ubicaciones:
├── ASIS_08_Inmunizacion/     (probablemente antigua)
└── ASIS_9_Inmunizacion/      ← ¿Cuál es actual?

Nutrición tiene 2 ubicaciones:
├── ASIS_07_Nutricion/        
└── ASIS_8_Dietetica/         ← Mismo módulo, diferente nombre

Medicamentos tiene 3 ubicaciones:
├── ASIS_09_Farmacia/
├── ASIS_10_Medicamentos/
└── ASIS_10_Regimenes/        ← Todas relacionadas, dispersas

Odontología/Cirugía:
├── ASIS_7_Cirugia/
├── ASIS_12_Farmacoterapia/
└── ASIS_11_Referencia/       ← Relación unclear

Componentes Sueltos (sin carpeta clara):
├── AuditTrailDashboard.tsx
├── ComorbidityMatrixEditor.tsx
├── DocumentEncryptionStatus.tsx
├── ExpandedDiagnosisForm.tsx
├── FollowupRecommendations.tsx
├── ICDSystemSelector.tsx
├── KitManager.tsx
├── MealPlanBuilder.tsx
├── MedicationStockDashboard.tsx
├── MilestoneTracker.tsx
├── NutritionComplianceTracker.tsx
├── ReferralTracker.tsx
├── RegimensBuilder.tsx
├── SpecialistFinder.tsx
├── VersionHistoryViewer.tsx
└── WHOPercentileChart.tsx
```

**Acción requerida:** Analizar CADA componente y averiguar a qué módulo pertenece

### Funciones Edge Confusas

```
Definitivamente HOSIX:
├── hospitalizacion_crear_kardex
├── hospitalizacion_evolucionar_paciente
├── hospitalizacion_mover_paciente_cama
├── hospitalizacion_solicitar_cirugia
├── hospitalizacion_solicitar_interconsulta
├── referral_validation
└── (posiblemente algunas más)

Probablemente RENAPROSA (NO HOSIX):
├── admin-users
├── calculate-nomina
├── calculate-nominas-from-guardias
├── check-renewal-notifications
├── detect-guardia-conflicts
├── expediente-*
├── export-*
├── generar-*
├── iachat
├── procesar-cola-carnets
├── process_*
├── send-sms-notification
├── send-user-invitation
├── sync-biometric-device
├── upload-documentos-adicionales
├── update-accreditation-status
└── (probablemente el 70% de lo que hay)

Unclear (podrían ser cualquiera):
├── ai-chat-master
├── ai_assist_detection
├── test-invite
└── (necesita análisis)
```

**Acción requerida:** Revisar CADA función y clasificar claramente

### Documentación Caótica

```
En raíz del proyecto:
├── DOCUMENTATION_HOSIX/        ← 71 archivos aquí
├── ANALISIS_*.md               ← 5+ archivos sueltos
├── ASIS_*.md                   ← 5+ archivos sueltos
├── DEPLOYMENT_*.md             ← 3+ sueltos
├── ESTADO_*.md                 ← 2+ sueltos
├── FASE_*.md                   ← 8+ sueltos
├── FINAL_*.md                  ← 2+ sueltos
├── GUIA_*.md                   ← 5+ sueltos
├── HOSIX_*.md                  ← 3+ sueltos
├── IMPLEMENTACION_*.md         ← 2+ sueltos
├── SESSION_*.md                ← 3+ sueltos
├── WEEK_*.md                   ← 20+ sueltos
└── Muchos otros...

TOTAL: 150+ archivos de documentación
PROBLEMA: Usuario no sabe por dónde empezar
```

**Acción requerida:** Crear sistema de documentación limpio dentro de packages/hosix/docs/

---

## 🏥 VISIÓN GNU HEALTH

### Módulos Core de GNU Health (53 totales)

Para HOSIX SaaS multicentro, priorizamos:

**FASE 1: MVP CRÍTICOS (8 módulos)**
1. **health** (Core) - Pacientes, encuentros, evaluaciones
2. **health_lab** - Laboratorio
3. **health_imaging** - Imagenología/DICOM
4. **health_surgery** - Quirúrgico
5. **health_inpatient** - Hospitalización
6. **health_pediatrics** - Pediatría  
7. **health_gyneco** - Obstetricia
8. **health_pharmacy** - Farmacia/Medicamentos

**FASE 2: ADMINISTRATIVOS (4 módulos)**
9. **health_services** - Servicios/Facturación
10. **health_insurance** - Seguros
11. **health_stock** - Inventario
12. **health_reporting** - Reportes

**FASE 3: AVANZADOS (6 módulos)**
13. **health_nursery** - Enfermería ambulatoria
14. **health_dentistry** - Odontología
15. **health_ems** - Emergencias
16. **health_genetics** - Genética
17. **health_crypto** - Seguridad/Criptografía
18. **health_federation** - Multicentro/Sync

**FASE 4+: ESPECIALIDADES Y EXTRAS**
19-53. Otros módulos según demanda

### Mapeo ASIS ↔ GNU Health

```
ASIS_04_Obstetricia      → health_gyneco
ASIS_05_CRED             → health_pediatrics extensions
ASIS_07_Nutricion        → (no tiene equivalente, custom)
ASIS_08_Laboratorio      → health_lab
ASIS_09_Farmacia         → health_pharmacy
ASIS_10_Medicamentos     → health_pharmacy
ASIS_11_Referencia       → (referral tracking, custom)
ASIS_12_Farmacoterapia   → (pharmaceutical therapy, custom)
ASIS_13_EHR              → health core
ASIS_14_Diagnostico      → health.evaluation + ICD-10
ASIS_15_Imagenes         → health_imaging
ASIS_7_Cirugia           → health_surgery
ADMIN_1_HR               → (HR management, custom)
ADMIN_2_WAITING_ROOMS    → (Queue management, custom)
```

---

## 🔨 PLAN DE REORGANIZACIÓN (PASO A PASO)

### FASE A: ANÁLISIS Y DOCUMENTACIÓN (1 día)

**Paso A1: Identificar qué existe**
- [ ] Listar TODOS los componentes en cada carpeta ASIS_*
- [ ] Identificar componentes sueltos
- [ ] Documentar si tienen duplicados
- [ ] Ver archivos creados (tamaño, líneas, funcionalidad)

**Paso A2: Identificar relaciones**
- [ ] Cuáles hooks sirven cada componente
- [ ] Cuáles funciones Edge sirven cada módulo
- [ ] Cuáles tablas en BD sirven cada módulo
- [ ] Qué dependencias hay entre módulos

**Paso A3: Clasificar funciones Edge**
- [ ] Revisar CÓDIGO de cada función
- [ ] Decidir: ¿Es HOSIX? ¿Es RENAPROSA? ¿Es compartida?
- [ ] Crear matriz de clasificación

**Paso A4: Verificar base de datos**
- [ ] Listar todas las migraciones en supabase/migrations/hosix/
- [ ] Comparar con tablas reales en BD
- [ ] Documentar cuáles están aplicadas
- [ ] Documentar cuáles faltan

**Paso A5: Consolidar hallazgos**
- [ ] Crear documento "ESTADO_ACTUAL.md" con análisis completo
- [ ] Crear matriz de componentes/módulos
- [ ] Crear matriz de funciones/módulos
- [ ] Crear matriz de tablas/módulos

### FASE B: DISEÑAR NUEVA ESTRUCTURA (1 día)

**Paso B1: Definir estructura de carpetas**
- [ ] Crear estructura propuesta en documento
- [ ] Decidir convención de nombres
- [ ] Decidir cómo organizar docs

**Paso B2: Definir módulos HOSIX**
- [ ] Listar módulos HOSIX (vs RENAPROSA)
- [ ] Asignar número/nombre a cada uno
- [ ] Definir dependencias entre módulos
- [ ] Definir componentes que va cada módulo

**Paso B3: Crear roadmap**
- [ ] Definir orden de implementación
- [ ] Estimar esfuerzo per módulo
- [ ] Definir hitos

**Paso B4: Documentar decisiones de arquitectura**
- [ ] Patrones de naming
- [ ] Patrones de estructura de archivos
- [ ] Patrones de importes
- [ ] Patrones de componentización

### FASE C: CREAR INFRAESTRUCTURA (1 día)

**Paso C1: Crear carpetas nuevas**
- [ ] Crear packages/hosix/modules/*
- [ ] Crear packages/hosix/docs/*
- [ ] Crear packages/hosix/functions/*
- [ ] Crear estructura interna de cada carpeta

**Paso C2: Crear archivos de índices**
- [ ] packages/hosix/README.md
- [ ] packages/hosix/modules/README.md
- [ ] packages/hosix/docs/README.md
- [ ] Índice por módulo

**Paso C3: Crear templates**
- [ ] Template de módulo (carpeta estructura)
- [ ] Template de documentación
- [ ] Template de función Edge
- [ ] Template de hook

### FASE D: MIGRAR COMPONENTES (Gradual)

**Paso D1: Por cada módulo**
1. Crear carpeta módulo (ej: packages/hosix/modules/obstetrics/)
2. Copiar componentes → packages/hosix/modules/obstetrics/components/
3. Crear hooks → packages/hosix/modules/obstetrics/hooks/
4. Crear types → packages/hosix/modules/obstetrics/types.ts
5. Crear index.ts → packages/hosix/modules/obstetrics/index.ts
6. Crear README.md → packages/hosix/modules/obstetrics/README.md

**Paso D2: Por cada función Edge**
1. Si es HOSIX: mover a packages/hosix/functions/[category]/
2. Si es RENAPROSA: dejar en supabase/functions/ (original)
3. Si es compartida: crear symlink o duplicar

**Paso D3: Actualizar importes**
1. Actualizar imports en componentes
2. Actualizar exports en index.ts
3. Actualizar referencias en documentación

### FASE E: CREAR DOCUMENTACIÓN (Paralela)

**Paso E1: Por cada módulo**
1. Crear packages/hosix/docs/modules/[module-name].md
2. Documentar:
   - Qué es el módulo
   - Cuál es su lugar en GNU Health
   - Componentes que incluye
   - Hooks que proporciona
   - Funciones Edge requeridas
   - Tablas de BD
   - Ejemplos de uso
   - Estado de implementación
   - Próximos pasos

**Paso E2: Crear documentación de arquitectura**
1. packages/hosix/docs/architecture/
2. Incluir: decisiones, patrones, diagramas

**Paso E3: Archivar DOCUMENTATION_HOSIX/**
1. Crear ZIP: DOCUMENTATION_HOSIX.backup.zip
2. Mover a carpeta archive/
3. Referenciar desde packages/hosix/docs/ si es necesario

---

## 🏗️ ESTRUCTURA NUEVA PROPUESTA

### Árbol Completo

```
packages/hosix/
│
├── README.md                          ← ENTRY POINT
│   Explica qué es HOSIX, cómo empezar
│
├── src/
│   ├── modules/                       ← CORAZÓN: Módulos clínicos
│   │   ├── 00-core/                   (Bootstrap, shared config)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 01-obstetrics/             (ASIS_04, health_gyneco)
│   │   │   ├── components/
│   │   │   │   ├── GestationalAgeCalculator.tsx
│   │   │   │   ├── RiskScoringForm.tsx
│   │   │   │   └── PrenatalMonitoring.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useObstetrics.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 02-pediatrics/             (ASIS_05, health_pediatrics, CREDtracking)
│   │   │   ├── components/
│   │   │   │   ├── GrowthChart.tsx
│   │   │   │   ├── CREDForm.tsx
│   │   │   │   └── NutritionTracker.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePediatrics.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 03-lab/                    (ASIS_08+10, health_lab)
│   │   │   ├── components/
│   │   │   │   ├── LabOrderForm.tsx
│   │   │   │   ├── ResultsViewer.tsx
│   │   │   │   └── TestTypeLookup.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLab.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 04-imaging/                (ASIS_15, health_imaging)
│   │   │   ├── components/
│   │   │   │   ├── ImagingOrderForm.tsx
│   │   │   │   ├── DICOMViewer.tsx
│   │   │   │   └── ReportGenerator.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useImaging.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 05-medications/            (ASIS_09, health_pharmacy)
│   │   │   ├── components/
│   │   │   │   ├── MedicationOrder.tsx
│   │   │   │   ├── InteractionChecker.tsx
│   │   │   │   └── PrescriptionForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useMedications.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 06-diagnoses/              (ASIS_14, health.icd10)
│   │   │   ├── components/
│   │   │   │   ├── DiagnosisSelector.tsx
│   │   │   │   ├── ComorbidityMatrix.tsx
│   │   │   │   └── ICDSearcher.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useDiagnoses.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 07-clinical-docs/          (ASIS_16+, clinical documentation)
│   │   │   ├── components/
│   │   │   │   ├── VisitNotesForm.tsx
│   │   │   │   ├── DigitalSignature.tsx
│   │   │   │   └── DocumentViewer.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useClinicalDocs.ts
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 08-appointments/           (Coming: health_schedule)
│   │   ├── 09-billing/                (Coming: health_services)
│   │   ├── 10-hr/                     (Admin: HR)
│   │   ├── 11-analytics/              (Coming: health_reporting)
│   │   │
│   │   └── shared/                    ← utils compartidas entre módulos
│   │       ├── components/
│   │       │   ├── AuditTrail.tsx
│   │       │   ├── PatientSearch.tsx
│   │       │   └── etc.
│   │       ├── hooks/
│   │       │   └── useModuleData.ts
│   │       └── utils/
│   │           └── index.ts
│   │
│   ├── services/                      ← Servicios globales
│   │   ├── supabaseClient.ts
│   │   ├── authService.ts
│   │   └── hospitalService.ts
│   │
│   ├── contexts/                      ← State management global
│   │   ├── AppContext.ts
│   │   ├── AuthContext.ts
│   │   └── HospitalContext.ts
│   │
│   ├── hooks/                         ← Hooks de aplicación general
│   │   ├── useApp.ts
│   │   ├── useAuth.ts
│   │   └── useHospital.ts
│   │
│   ├── types/                         ← Types globales
│   │   ├── common.ts
│   │   └── gnu-health.ts
│   │
│   └── utils/                         ← Utilidades globales
│       ├── formatters.ts
│       └── validators.ts
│
├── functions/                         ← Edge Functions que SÍ son HOSIX
│   ├── clinical/
│   │   ├── validate_diagnosis/
│   │   └── check_contraindications/
│   ├── medications/
│   │   ├── check_drug_interactions/
│   │   └── validate_prescription/
│   ├── obstetrics/
│   │   ├── calculate_gestational_age/
│   │   └── assess_obstetric_risk/
│   ├── lab/
│   │   ├── validate_lab_order/
│   │   └── process_lab_results/
│   └── imaging/
│       ├── process_dicom/
│       └── generate_imaging_report/
│
├── docs/                              ← Documentación limpia de HOSIX
│   ├── README.md                      ← Start here
│   ├── QUICKSTART.md                  ← Primeros pasos
│   ├── ARCHITECTURE.md                ← Decisiones arquitectónicas
│   │
│   ├── modules/                       ← Un MD por módulo
│   │   ├── 00-core.md
│   │   ├── 01-obstetrics.md
│   │   ├── 02-pediatrics.md
│   │   ├── 03-lab.md
│   │   ├── 04-imaging.md
│   │   ├── 05-medications.md
│   │   ├── 06-diagnoses.md
│   │   ├── 07-clinical-docs.md
│   │   ├── 08-appointments.md
│   │   ├── 09-billing.md
│   │   ├── 10-hr.md
│   │   └── 11-analytics.md
│   │
│   ├── database/
│   │   ├── schema.md                  ← Diagrama de tablas
│   │   ├── migrations.md              ← Cómo están aplicadas
│   │   └── rls-policies.md            ← Seguridad
│   │
│   ├── api/
│   │   ├── functions.md               ← Edge Functions
│   │   └── services.md                ← Servicios Supabase
│   │
│   ├── patterns/
│   │   ├── components.md              ← Cómo escribir componentes
│   │   ├── hooks.md                   ← Cómo escribir hooks
│   │   ├── types.md                   ← Convenciones de tipos
│   │   └── testing.md                 ← Testing strategy
│   │
│   └── GLOSSARY.md                    ← Glosario HOSIX + GNU Health

├── __tests__/                         ← Tests por módulo
│   ├── obstetrics.test.ts
│   ├── lab.test.ts
│   └── etc.

├── package.json                       ← Solo deps de HOSIX
├── tsconfig.json                      ← Config TS de HOSIX  
├── vite.config.ts                     ← Config Vite específica
└── .env.example                       ← Env vars de HOSIX
```

---

## 📊 ANÁLISIS DE COMPONENTES ACTUALES

[Continuará en siguiente sección...]

### Componentes en ASIS_04_Obstetricia
```
✅ MANTENER:
- Componentes de cálculo de edad gestacional
- Scoring de riesgo obstétrico
```

### Componentes Sueltos que Necesitan Hogar

```
AuditTrailDashboard.tsx
├─ Función: Mostrar logs de auditoría
├─ Módulo: 00-core (shared)
├─ Mantener: SÍ

ComorbidityMatrixEditor.tsx
├─ Función: matriz de comorbilidades
├─ Módulo: 06-diagnoses
├─ Mantener: SÍ

DocumentEncryptionStatus.tsx
├─ Función: Estado de encriptación de documentos
├─ Módulo: 07-clinical-docs
├─ Mantener: SÍ

ExpandedDiagnosisForm.tsx
├─ Función: Formulario expandido de diagnóstico
├─ Módulo: 06-diagnoses
├─ Mantener: SÍ
├─ Nota: Puede haber duplicado/versión anterior

FollowupRecommendations.tsx
├─ Función: Recomendaciones de seguimiento
├─ Módulo: 07-clinical-docs o shared
├─ Mantener: SÍ

ICDSystemSelector.tsx
├─ Función: Selector de sistema ICD (ICD-10, ICD-11, etc.)
├─ Módulo: 06-diagnoses
├─ Mantener: SÍ

KitManager.tsx
├─ Función: ¿Gestión de kits médicos?
├─ Módulo: 05-medications o shared
├─ REVISAR: Necesita aclaración de propósito

MealPlanBuilder.tsx
├─ Función: Constructor de planes de alimentación
├─ Módulo: 02-pediatrics (podría ser custom)
├─ Mantener: SÍ
├─ Nota: Podría ser parte de nutrition custom module

MedicationStockDashboard.tsx
├─ Función: Dashboard de stock de medicamentos
├─ Módulo: 05-medications
├─ Mantener: SÍ

MilestoneTracker.tsx
├─ Función: Rastreador de hitos (posiblemente pediátricos)
├─ Módulo: 02-pediatrics
├─ Mantener: SÍ

NutritionComplianceTracker.tsx
├─ Función: Rastreador de cumplimiento nutricional
├─ Módulo: Custom nutrition module (no es GNU Health)
├─ Mantener: SÍ (pero fuera de 05-medications)

ReferralTracker.tsx
├─ Función: Rastreador de referencias
├─ Módulo: shared (usado por múltiples)
├─ Mantener: SÍ

RegimensBuilder.tsx
├─ Función: Constructor de regímenes de medicación
├─ Módulo: 05-medications
├─ Mantener: SÍ

SpecialistFinder.tsx
├─ Función: Buscador de especialistas
├─ Módulo: shared
├─ Mantener: SÍ

VersionHistoryViewer.tsx
├─ Función: Visor de historial de versiones de documentos
├─ Módulo: 07-clinical-docs
├─ Mantener: SÍ

WHOPercentileChart.tsx
├─ Función: Gráfico de percentiles WHO (crecimiento infantil)
├─ Módulo: 02-pediatrics
├─ Mantener: SÍ
```

---

## 🔌 ANÁLISIS DE FUNCIONES EDGE

### Clasificación Inicial

```
DEFINITIVAMENTE HOSIX (Quedan en packages/hosix/functions/):
✅ hospitalizacion_crear_kardex
✅ hospitalizacion_evolucionar_paciente
✅ hospitalizacion_mover_paciente_cama
✅ hospitalizacion_solicitar_cirugia
✅ hospitalizacion_solicitar_interconsulta
✅ referral_validation

PROBABLEMENTE RENAPROSA (Quedan en supabase/functions/):
🟠 admin-users
🟠 calculate-nomina
🟠 calculate-nominas-from-guardias
🟠 check-renewal-notifications
🟠 detect-guardia-conflicts
🟠 expediente-*
🟠 export-*
🟠 generar-*
🟠 procesar-cola-carnets
🟠 process_*
🟠 send-sms-notification (podría ser shared)
🟠 send-user-invitation (podría ser shared)
🟠 sync-biometric-device
🟠 upload-documentos-adicionales
🟠 update-accreditation-status

UNCLEAR (NECESITAN REVISIÓN):
❓ ai-chat-master - Revisar: ¿Usa datos HOSIX?
❓ ai_assist_detection - Revisar: ¿Para qué?
❓ test-invite - Es un test, eliminar

ACCIÓN REQUIRED:
→ Analizar código de CADA función sin mover
→ Documentar en matriz de decisión
→ Comunicar decisión
```

---

## 💾 ANÁLISIS DE MIGRACIONES

**Necesario:**
- [ ] Listar todas las migraciones en supabase/migrations/hosix/
- [ ] Listar todas las migraciones en supabase/migrations/
- [ ] Comparar con tablas reales en Supabase
- [ ] Documentar estado: Aplicada / No aplicada / Falla

---

## 📋 PRÓXIMOS PASOS

### Ahora (antes de reorganizar):

1. **Usuario revisa este documento** y confirma:
   - [ ] Entiende el caos actual
   - [ ] Entiende la visión GNU Health
   - [ ] Está de acuerdo con estructura propuesta
   - [ ] Aprueba plan de reorganización

2. **Usuario responde preguntas clarificadoras**:
   - Qué módulos HOSIX son CRÍTICOS ahora?
   - Qué puede ignorarse por ahora?
   - Aprox. cuántas horas quieres dedicar a esto?

3. **Yo ejecuto FASE A: Análisis** (1-2 días máximo)
   - Revisar CADA función Edge
   - Revisar CADA componente
   - Crear matriz de decisiones
   - Crear documento de estado actual

4. **Yo ejecuto FASE B: Diseño** (1 día)
   - Finalizar estructura
   - Crear documentación de arquitectura
   - Crear templates

5. **Yo ejecuto FASE C-E: Migración** (3-5 días)
   - Crear infraestructura
   - Mover componentes
   - Actualizar importes
   - Crear documentación
   - Archivar DOCUMENTATION_HOSIX/

---

**Estado:** Esperando aprobación del plan antes de proceder

Los próximos cambios que harás deberán considerar esta nueva estructura.
