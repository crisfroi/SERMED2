# 📋 EDGE FUNCTIONS - GUÍA RÁPIDA DE REFERENCIA

## 🔍 Búsqueda Rápida por Categoría

### Por Tabla Principal (Queries más frecuentes)

| Tabla | Funciones que la usan | Count | Tipo |
|-------|----------------------|-------|------|
| electronic_health_record | ehr-search, ehr-sync-thalamus, sync_ehr_to_thalamus, consolidate_ehr_summary, generate_ehr_export, log_ehr_access, verify_document_signature | 7 | read/write/sync |
| admisiones | admision_crear_hospitalizacion, admision_sync_to_hospitalizacion | 2 | write/sync |
| sync_queue | sync_process_queue, sync_resolve_conflicts, sync_multicentro, sync_get_status | 4 | read/write |
| medication_interactions | check_drug_interactions, pharmacotherapy_validation | 2 | read |
| patients | create_treatment_plan, surgery-validation, generate_ehr_export, obstetric_risk_calculator | 4 | read |
| imaging_orders | export_radiology_report, sync_orthanc_dicom | 2 | read/sync |
| staff_records | sync_staff_to_thalamus | 1 | read/sync |
| vaccine_master | immunization-validation, immunization_validation | 2 | read |
| laboratory_tests | lab_validation, validate_lab_results | 2 | read |
| prescriptions | validate_medication_order, create_treatment_plan | 2 | read |
| pregnancy | obstetric_risk_calculator | 1 | read |
| treatment_plans | create_treatment_plan | 1 | write |
| diagnoses | create_treatment_plan, stage_diagnosis | 2 | read |
| payroll_processing | calculate_payroll | 1 | write |
| medicine_inventory | pharmacy_validation | 1 | read |
| ehr_document_storage | ehr-search, generate_ehr_export, verify_document_signature | 3 | read |
| patient_nutrition_assessments | nutrition_validation, nutrition-validation | 2 | read |
| sync_conflicts | sync_resolve_conflicts | 1 | read/write |
| surgerytype, surgery_schedules | surgery-validation | 2 | read |
| hospital_beds | surgery-validation | 1 | read |
| staff_members | surgery-validation, sync_staff_to_thalamus | 2 | read |
| child_growth | calculate_who_percentile | 1 | write |
| vaccination_administration | vaccination_next_dose | 1 | read |
| quirofanos, programaciones, procedimientos | cirugia_sync_to_quirofanos | 3 | read/write/sync |
| ehr_episode_links, ehr_snapshot_history | consolidate_ehr_summary, generate_ehr_export | 2 | read/write |
| critical_lab_alerts | validate_lab_results | 1 | write |

---

## 🎯 Por Caso de Uso / Módulo

### EMERGENCIA & TRIAGE
```
ENTRADA PRINCIPAL: triage_emergency_patient (CRITICAL)
  ↓ (cálculo SALT score)
  → admision_crear_hospitalizacion (CRITICAL)
    → admision_sync_to_hospitalizacion (CRITICAL)
      → sync_multicentro (CRITICAL)
        → kardex, camas asignadas
```

### OBSTETRICIA
```
pregnancy_gestational_age (DEPLOYED)
  + obstetric_risk_calculator (CRITICAL)
    + admision_crear_hospitalizacion (CRITICAL)
      + create_treatment_plan (HIGH)
        + stage_diagnosis (HIGH)
          + check_drug_interactions (DEPLOYED)
            + pharmacotherapy_validation (HIGH)
```

### PEDIATRÍA
```
calculate_who_growth_percentile (DEPLOYED)
  ↔↔ calculate_who_percentile (LOW)  [DUPLICATE - consolidar]
  ↔↔ who_growth_percentile (LOW)     [DUPLICATE - consolidar]
  + vaccination_next_dose (MEDIUM)
    + immunization-validation (HIGH)  [vs immunization_validation DUPLICATE]
```

### FARMACIA & MEDICAMENTOS
```
check_drug_interactions (DEPLOYED) ← CORE
  ↑ [used by]
  ├─ RegimensBuilder (component)
  ├─ validate_medication_order (validation)
  ├─ pharmacotherapy_validation (HIGH)
  ├─ create_treatment_plan (HIGH)
  └─ stage_diagnosis (HIGH)

pharmacy_validation (LOW) → medicine_inventory
calculate_stock_analysis (MEDIUM) → análisis local
```

### CIRUGÍA
```
cirugia_sync_to_quirofanos (CRITICAL)
  ↓ [sync to]
  ├─ procedimientos
  ├─ programaciones
  ├─ quirofanos
  └─ sync_log

surgery-validation (HIGH) → pre-op checks
  ├─ surgery_types
  ├─ surgery_schedules
  ├─ staff_members
  ├─ patients
  └─ hospital_beds
```

### EHR & DOCUMENTOS
```
electronic_health_record [CORE TABLE]
  ├─ ehr-search (MEDIUM) → búsqueda
  ├─ ehr-sync-thalamus (CRITICAL*) → sync Thalamus
  ├─ sync_ehr_to_thalamus (CRITICAL*) → sync Thalamus alt
  ├─ consolidate_ehr_summary (HIGH) → consolidación
  ├─ generate_ehr_export (MEDIUM) → export
  ├─ log_ehr_access (MEDIUM) → auditoria
  └─ verify_document_signature (MEDIUM) → seguridad

fhir-api (HIGH*) → FHIR interface (deprecated tablas?)
```

### LABORATORIO
```
laboratory_tests / laboratory_orders
  ├─ export_lab_results (MEDIUM) → export
  ├─ lab_validation (HIGH) → validar resultados
  └─ validate_lab_results (HIGH) → flags críticos
    → critical_lab_alerts (INSERT)
```

### IMÁGENES
```
imaging_orders
  ├─ export_radiology_report (MEDIUM) → export
  ├─ sync_orthanc_dicom (HIGH*) → Orthanc sync
  ├─ dicom_viewer (MEDIUM*) → visualization
  ├─ segment_imaging (MEDIUM*) → AI segmentation
  └─ analyze_refraction_data (LOW) → refrazione

ORTHANC (external) ← sync point
```

### MULTI-CENTRO SYNC (BACKBONE)
```
sync_multicentro (CRITICAL) ← ORCHESTRATOR (5-min scheduled)
  ├─ sync_process_queue (HIGH) → execute operations
  ├─ sync_resolve_conflicts (HIGH) → conflict resolution
  ├─ sync_get_status (LOW) → status reporting
  └─ hospitals.estado = 'activo'

Sync by hospital:
  ├─ admision_sync_to_hospitalizacion
  ├─ cirugia_sync_to_quirofanos
  ├─ ehr-sync-thalamus (via Thalamus)
  ├─ sync_staff_to_thalamus (via Thalamus)
  └─ facility_sync (inter-facility)

THALAMUS (external) ← central hub
```

### NUTRICIÓN
```
patient_nutrition_assessments
  ├─ nutrition_validation (HIGH)     [guión bajo]
  ├─ nutrition-validation (HIGH)     [guión]  [DUPLICATE]
  ├─ calculate_meal_macros (LOW)
  └─ MealPlanBuilder (component)
```

### INMUNIZACIÓN
```
vaccine_master
  ├─ immunization-validation (HIGH)   [guión]
  ├─ immunization_validation (HIGH)   [guión bajo]  [DUPLICATE]
  └─ vaccination_next_dose (MEDIUM)
```

### DIAGNÓSTICO
```
diagnoses table
  ├─ stage_diagnosis (HIGH) → validar diagnóstico
  ├─ create_treatment_plan (HIGH) → plan terapéutico
  ├─ expand_icd_codes (LOW) → búsqueda ICD
  └─ assess_genetic_risk (LOW) → riesgo genético
```

### PLANIFICACIÓN & SCHEDULING
```
schedule_nursing_tasks (LOW) → nursing schedule calcs
availability_check (LOW) → provider availability
sync_appointments (LOW*) → calendar sync (Google/Office)
send_reminders (LOW*) → SMS/Email/Push (simulada)
```

### ADMIN
```
payroll_processing
  └─ calculate_payroll (MEDIUM) → nóminas

staff_records
  └─ sync_staff_to_thalamus (MEDIUM*) → Thalamus

hospitals
  └─ sync_multicentro (CRITICAL)
  └─ facility_sync (MEDIUM*)

admisiones
  └─ admision_crear_hospitalizacion (CRITICAL)
```

---

## 🔗 DEPENDENCIAS EXTERNAS

### Sistemas que DEBEN estar disponibles:

| Sistema | Funciones | Criticidad | Status |
|---------|-----------|------------|--------|
| **Thalamus API** | ehr-sync-thalamus, sync_ehr_to_thalamus, sync_staff_to_thalamus, fhir-api | CRITICAL | ⚠️ needs-review |
| **Orthanc PACS Server** | sync_orthanc_dicom, dicom_viewer, segment_imaging | HIGH | ⚠️ needs-review |
| **Google Calendar API** | sync_appointments | LOW | ⚠️ needs-review |
| **Microsoft Office 365 API** | sync_appointments | LOW | ⚠️ needs-review |
| **SMS Provider** (Twilio/similar) | send_reminders | LOW | ⚠️ not-implemented |
| **Email Provider** (SendGrid/similar) | send_reminders | LOW | ⚠️ not-implemented |
| **Push Notification Service** | send_reminders | LOW | ⚠️ not-implemented |
| **PyTorch/TensorFlow Models** | segment_imaging (AI) | MEDIUM | ⚠️ needs-review |

---

## 📊 DEPLOYMENT DEPENDENCY GRAPH

```
TIER 1A (DEPLOYED):
  ✓ pregnancy_gestational_age
  ✓ calculate_who_growth_percentile
  ✓ check_drug_interactions

TIER 1B (IMMEDIATE - depends on nothing):
  → admision_crear_hospitalizacion
    → admision_sync_to_hospitalizacion → sync_multicentro
  → triage_emergency_patient
  → obstetric_risk_calculator
  → calculate_icu_severity
  → cirugia_sync_to_quirofanos

TIER 2 (depends on Tier 1):
  → immunization-validation (needs vaccine_master)
  → lab_validation (needs lab tables)
  → nutrition_validation (needs nutrition tables)
  → pharmacotherapy_validation (depends on check_drug_interactions)
  → stage_diagnosis (depends on diagnoses)
  → surgery-validation (multiple table dependencies)
  → create_treatment_plan (complex multi-table)
  → consolidate_ehr_summary (depends on EHR tables)

TIER 3 (depends on Tier 2 + external systems):
  → sync_process_queue (depends on sync_queue)
  → sync_resolve_conflicts (depends on sync_conflicts)
  → ehr-sync-thalamus (NEEDS: Thalamus API)
  → sync_ehr_to_thalamus (NEEDS: Thalamus API)
  → sync_staff_to_thalamus (NEEDS: Thalamus API)
  → sync_orthanc_dicom (NEEDS: Orthanc server)
  → fhir-api (DEPRECATED tables - needs review)

TIER 4 (nice-to-have):
  → dicom_viewer (NEEDS: DICOM lib)
  → segment_imaging (NEEDS: AI model)
  → send_reminders (NEEDS: SMS/Email providers)
  → sync_appointments (NEEDS: Calendar APIs)
  → ... and all LOW priority functions
```

---

## 🔴 BLOCKING ISSUES

### BEFORE YOU DEPLOY:

1. **❌ DO NOT DEPLOY without consolidating:**
   - immunization-validation + immunization_validation
   - nutrition-validation + nutrition_validation
   - calculate_who_percentile + who_growth_percentile
   - calculate_who_growth_percentile (confusión de nombres)

2. **❌ DO NOT DEPLOY without validating:**
   - ✓✓✓ fhir-api (tablas hosix_* deprecated?)
   - ✓✓✓ Thalamus API endpoint y credentials
   - ✓✓✓ Orthanc server connectivity
   - ✓✓✓ RLS Policies en todas las tablas

3. **❌ DO NOT DEPLOY estas (simuladas):**
   - send_reminders (implementar integraciones reales)
   - facility_sync (datos mock)
   - sync_appointments (sin APIs configuradas)

4. **⚠️ Verificar antes:**
   - SERVICE_ROLE_KEY permisos correctos
   - Deno version compatibility
   - CORS headers en funciones HTTP

---

## 📋 QUICK CHECKLIST

### Deploy Tier 1B checklist:
- [ ] admision_crear_hospitalizacion - Ready
- [ ] admision_sync_to_hospitalizacion - Ready
- [ ] triage_emergency_patient - Ready
- [ ] obstetric_risk_calculator - Ready
- [ ] calculate_icu_severity - Ready
- [ ] cirugia_sync_to_quirofanos - Ready
- [ ] sync_multicentro - Ready
- [ ] consolidate duplicates (4 funciones) - REQUIRED

### External Systems to validate:
- [ ] Thalamus API - URL, credentials, available?
- [ ] Orthanc PACS - URL, authentication available?
- [ ] Supabase RLS - All tables, all roles configured?
- [ ] Service role - Permissions granted for all operations?

---

## 🚀 NEXT STEPS

1. **TODAY:** Consolidate duplicates + validate external systems
2. **THIS WEEK:** Deploy Tier 1B critical functions
3. **NEXT WEEK:** Deploy Tier 2 validation functions
4. **WEEKS 3-4:** Deploy Tier 3 sync functions
5. **WEEK 5+:** Deploy Tier 4 complementary functions

---

**See full analysis:** `EDGE_FUNCTIONS_DEPLOYMENT_ANALYSIS.md`

