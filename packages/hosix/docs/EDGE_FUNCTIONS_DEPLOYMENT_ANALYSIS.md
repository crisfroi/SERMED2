# 📊 Análisis Detallado de Edge Functions - 54 Funciones Restantes

**Fecha:** 17 de Abril 2026  
**Estado:** Ya desplegadas: 3 (pregnancy_gestational_age, calculate_who_growth_percentile, check_drug_interactions)  
**Total:** 54 funciones pendientes

---

## TABLA CONSOLIDADA - TODAS LAS FUNCIONES

| # | Función | Tabla(s) Principal | Tipo | Severidad | Status | Componentes que la llaman | Módulo |
|---|---------|-------------------|------|-----------|--------|---------------------------|--------|
| 1 | admision_crear_hospitalizacion | admisiones, kardex | read-write | **CRITICAL** | ready-to-deploy | TriageForm, ASIS_04_Obstetricia | Obstetricia |
| 2 | admision_sync_to_hospitalizacion | admisiones, kardex | sync | **CRITICAL** | ready-to-deploy | Scheduled (2 min) | Obstetricia |
| 3 | analyze_refraction_data | N/A (cálculo puro) | read-only | low | ready-to-deploy | ASIS_15_Imagenes | Oftalmología |
| 4 | assess_genetic_risk | N/A (cálculo puro) | read-only | low | ready-to-deploy | ASIS_14_Diagnostico | Genética |
| 5 | audit_federation | N/A (log simulado) | validation | medium | ready-to-deploy | multi-centro sync | Admin |
| 6 | availability_check | N/A (cálculo puro) | read-only | low | ready-to-deploy | booking providers | Admin-Ops |
| 7 | calculate_icu_severity | N/A (SOFA score) | read-only | **CRITICAL** | ready-to-deploy | ICU monitoring | Clínico |
| 8 | calculate_meal_macros | N/A (base datos hardcoded) | read-only | low | ready-to-deploy | MealPlanBuilder | Nutrición |
| 9 | calculate_payroll | payroll_processing | read-write | medium | ready-to-deploy | ADMIN_1_HR payroll | HR |
| 10 | calculate_stock_analysis | N/A (cálculo puro) | read-only | medium | ready-to-deploy | MedicationStockDashboard | Farmacia |
| 11 | calculate_who_growth_percentile | N/A (cálculo puro) | read-only | **CRITICAL** | **DEPLOYED** ✓ | WHOPercentileChart | Pediatría |
| 12 | calculate_who_percentile | child_growth | read-write | medium | ready-to-deploy | WHOPercentileChart | Pediatría |
| 13 | check_drug_interactions | medication_interactions, drug_disease_interactions | read-only | **CRITICAL** | **DEPLOYED** ✓ | RegimensBuilder, ASIS_10_Medicamentos | Farmacia |
| 14 | check_referral_status | N/A (cálculo puro) | read-only | low | ready-to-deploy | ReferralTracker | Admin-Ops |
| 15 | cirugia_sync_to_quirofanos | procedimientos, programaciones, quirofanos, sync_log | sync | **CRITICAL** | ready-to-deploy | ASIS_7_Cirugia scheduled | Cirugía |
| 16 | consolidate_ehr_summary | electronic_health_record, ehr_episode_links, ehr_snapshot_history | read-write | high | ready-to-deploy | ASIS_13_EHR dashboard | EHR |
| 17 | create_treatment_plan | treatment_guidelines, clinical_procedures, diagnoses, monitoring_protocols, specialist_referrals, prescriptions, medication_contraindications, treatment_plans | read-write | high | ready-to-deploy | ExpandedDiagnosisForm | Clínico |
| 18 | dental_risk_assessment | N/A (cálculo puro) | read-only | low | ready-to-deploy | ASIS_15_Imagenes | Odontología |
| 19 | dicom_viewer | N/A (DICOM processing) | read-only | medium | needs-review | ASIS_15_Imagenes | Imágenes |
| 20 | ehr-search | ehr_document_storage | read-only | medium | ready-to-deploy | ASIS_13_EHR search | EHR |
| 21 | ehr-sync-thalamus | electronic_health_record | sync | **CRITICAL** | needs-review* | Scheduled hourly | EHR/Sync |
| 22 | estimate_bed_occupancy | N/A (cálculo puro) | read-only | medium | ready-to-deploy | admin dashboard | Admin-Ops |
| 23 | expand_icd_codes | N/A (búsqueda local) | read-only | low | ready-to-deploy | ExpandedDiagnosisForm | Diagnóstico |
| 24 | export_lab_results | patient, laboratory_orders, party | read-only | medium | ready-to-deploy | ASIS_08_Laboratorio export | Laboratorio |
| 25 | export_radiology_report | imaging_orders | read-only | medium | ready-to-deploy | ASIS_15_Imagenes export | Imágenes |
| 26 | facility_sync | N/A (simulada) | sync | low | needs-review | multi-centro sync | Admin |
| 27 | fhir-api | hosix_pacientes, hosix_prescripciones, hosix_enfermeria_constantes | read-write | high | needs-review* | FHIR integrations | EHR/Interop |
| 28 | generate_ehr_export | electronic_health_record, patients, ehr_episode_links, prescriptions, laboratory_orders, imaging_orders | read-only | medium | ready-to-deploy | ASIS_13_EHR export | EHR |
| 29 | immunization-validation | vaccine_master, vaccination_contraindications, patient_allergies, patient_medical_history | validation | high | ready-to-deploy | ASIS_08_Inmunizacion, ASIS_9_Inmunizacion | Inmunización |
| 30 | immunization_validation | vaccine_master, vaccination_contraindications, patient_allergies, patient_medical_history | validation | high | ready-to-deploy | ASIS_08_Inmunizacion, ASIS_9_Inmunizacion | Inmunización |
| 31 | lab_validation | laboratory_tests, lab_test_results | validation | high | ready-to-deploy | ASIS_08_Laboratorio, ASIS_10_Laboratorio | Laboratorio |
| 32 | log_ehr_access | electronic_health_record | read-only | medium | ready-to-deploy | AuditTrailDashboard | Auditoría |
| 33 | nutrition_validation | patient_nutrition_assessments | validation | high | ready-to-deploy | ASIS_07_Nutricion, ASIS_8_Dietetica | Nutrición |
| 34 | nutrition-validation | patient_nutrition_assessments | validation | high | ready-to-deploy | ASIS_07_Nutricion, ASIS_8_Dietetica | Nutrición |
| 35 | obstetric_risk_calculator | pregnancy, patient | read-only | **CRITICAL** | ready-to-deploy | ASIS_04_Obstetricia | Obstetricia |
| 36 | pharmacotherapy_validation | medication_master, medication_interactions | validation | high | ready-to-deploy | ASIS_12_Farmacoterapia | Farmacoterapia |
| 37 | pharmacy_validation | medicine_inventory, suppliers | read-only | low | ready-to-deploy | ASIS_09_Farmacia | Farmacia |
| 38 | pregnancy_gestational_age | N/A (cálculo puro) | read-only | **CRITICAL** | **DEPLOYED** ✓ | ASIS_04_Obstetricia | Obstetricia |
| 39 | schedule_nursing_tasks | N/A (cálculo puro) | read-only | low | ready-to-deploy | nursing schedules | Enfermería |
| 40 | segment_imaging | N/A (AI processing) | read-only | medium | needs-review | ASIS_15_Imagenes | Imágenes AI |
| 41 | send_reminders | N/A (simulated) | read-write | low | needs-review | appointment system | Admin-Ops |
| 42 | stage_diagnosis | diagnoses, patient, medical_conditions, medication_contraindications, treatment_guidelines | validation | high | ready-to-deploy | ExpandedDiagnosisForm | Diagnóstico |
| 43 | surgery-validation | surgery_types, surgery_schedules, staff_members, patients, hospital_beds | validation | high | ready-to-deploy | ASIS_7_Cirugia | Cirugía |
| 44 | sync_appointments | N/A (calendarios externos) | sync | low | needs-review | appointment system | Admin-Ops |
| 45 | sync_ehr_to_thalamus | electronic_health_record, ehr_thalamus_sync_log | sync | **CRITICAL** | needs-review* | Scheduled hourly | EHR/Sync |
| 46 | sync_get_status | sync_queue | read-only | low | ready-to-deploy | sync dashboards | Sync |
| 47 | sync_multicentro | hospitals, sync_queue, sync_log | sync | **CRITICAL** | ready-to-deploy | Scheduled (5 min) | Multi-centro |
| 48 | sync_orthanc_dicom | imaging_orders, orthanc server | sync | high | needs-review* | ASIS_15_Imagenes | Imágenes/Orthanc |
| 49 | sync_patient_data | N/A (genérica) | sync | medium | ready-to-deploy | patient data sync | Sync |
| 50 | sync_process_queue | sync_queue, sync_log | sync | high | ready-to-deploy | Scheduled (1 min) | Sync |
| 51 | sync_resolve_conflicts | sync_conflicts | sync | high | ready-to-deploy | sync conflict resolution | Sync |
| 52 | sync_staff_to_thalamus | staff_records, thalamus_sync_log | sync | medium | needs-review* | ADMIN_1_HR scheduled | HR/Sync |
| 53 | triage_emergency_patient | N/A (SALT score) | read-only | **CRITICAL** | ready-to-deploy | ASIS_02_EMERGENCIA | Emergencia |
| 54 | vaccination_next_dose | patient, vaccination_administration | read-only | medium | ready-to-deploy | ASIS_08_Inmunizacion, ASIS_9_Inmunizacion | Inmunización |
| 55 | verify_document_signature | electronic_health_record, ehr_document_storage | read-only | medium | ready-to-deploy | ASIS_13_EHR security | EHR |
| 56 | who_growth_percentile | N/A (cálculo puro) | read-only | medium | ready-to-deploy | WHOPercentileChart | Pediatría |

---

## 📋 CLASIFICACIÓN POR SEVERIDAD Y STATUS

### 🔴 CRITICAL (Desplegar PRIMERO) - 10 funciones

| Función | Tipo | Status | Razón | Deploy Order |
|---------|------|--------|-------|--------------|
| pregnancy_gestational_age | read-only | **✓ DEPLOYED** | Base para obstetricia | 1 |
| calculate_who_growth_percentile | read-only | **✓ DEPLOYED** | Base para pediatría | 1 |
| check_drug_interactions | read-only | **✓ DEPLOYED** | Seguridad medicamentos | 1 |
| admision_crear_hospitalizacion | read-write | ready-to-deploy | Flujo urgente: admisiones | **2** |
| admision_sync_to_hospitalizacion | sync | ready-to-deploy | Flujo urgente: hospitalizaciones | **2** |
| obstetric_risk_calculator | read-only | ready-to-deploy | Obstetricia crítica | **3** |
| calculate_icu_severity | read-only | ready-to-deploy | ICU: SOFA score | **3** |
| triage_emergency_patient | read-only | ready-to-deploy | Emergencia: SALT score | **4** |
| cirugia_sync_to_quirofanos | sync | ready-to-deploy | Quirófanos scheduling | **4** |
| ehr-sync-thalamus | sync | needs-review | Interoperabilidad crítica | **5*** |
| sync_ehr_to_thalamus | sync | needs-review | Interoperabilidad crítica | **5*** |
| sync_multicentro | sync | ready-to-deploy | Multi-centro coordinación | **4** |

---

### 🟠 HIGH (Desplegar en FASE 2) - 15 funciones

| Función | Tipo | Status | Módulo |
|---------|------|--------|--------|
| consolidate_ehr_summary | read-write | ready-to-deploy | EHR |
| create_treatment_plan | read-write | ready-to-deploy | Clínico |
| fhir-api | read-write | needs-review* | EHR/Interop |
| immunization-validation | validation | ready-to-deploy | Inmunización |
| immunization_validation | validation | ready-to-deploy | Inmunización |
| lab_validation | validation | ready-to-deploy | Laboratorio |
| nutrition_validation | validation | ready-to-deploy | Nutrición |
| nutrition-validation | validation | ready-to-deploy | Nutrición |
| pharmacotherapy_validation | validation | ready-to-deploy | Farmacoterapia |
| stage_diagnosis | validation | ready-to-deploy | Diagnóstico |
| surgery-validation | validation | ready-to-deploy | Cirugía |
| sync_process_queue | sync | ready-to-deploy | Sync |
| sync_resolve_conflicts | sync | ready-to-deploy | Sync |
| sync_orthanc_dicom | sync | needs-review* | Imágenes |
| sync_staff_to_thalamus | sync | needs-review* | HR/Sync |

---

### 🟡 MEDIUM (Desplegar en FASE 3) - 20 funciones

| Función | Tipo | Status | Razón |
|---------|------|--------|-------|
| calculate_payroll | read-write | ready-to-deploy | HR: nominas |
| calculate_stock_analysis | read-only | ready-to-deploy | Farmacia: stock |
| dicom_viewer | read-only | needs-review | Imágenes: viewer |
| ehr-search | read-only | ready-to-deploy | EHR: búsqueda |
| estimate_bed_occupancy | read-only | ready-to-deploy | Ops: occupancy |
| export_lab_results | read-only | ready-to-deploy | Lab: export |
| export_radiology_report | read-only | ready-to-deploy | Imágenes: export |
| generate_ehr_export | read-only | ready-to-deploy | EHR: export |
| log_ehr_access | read-only | ready-to-deploy | Auditoría |
| pharmacy_validation | read-only | ready-to-deploy | Farmacia |
| schedule_nursing_tasks | read-only | ready-to-deploy | Enfermería |
| segment_imaging | read-only | needs-review | Imágenes: AI |
| sync_patient_data | sync | ready-to-deploy | Sync: genérica |
| sync_staff_to_thalamus | sync | needs-review* | HR/Sync |
| vaccination_next_dose | read-only | ready-to-deploy | Inmunización |
| verify_document_signature | read-only | ready-to-deploy | EHR: seguridad |
| audit_federation | validation | ready-to-deploy | Admin: audit |
| facility_sync | sync | needs-review | Multi-centro |
| send_reminders | read-write | needs-review | Appointments |
| sync_get_status | read-only | ready-to-deploy | Sync: status |

---

### 🟢 LOW (Desplegar en FASE 4) - 9 funciones

| Función | Tipo | Status | Razón |
|---------|------|--------|-------|
| analyze_refraction_data | read-only | ready-to-deploy | Oftalmología: análisis |
| assess_genetic_risk | read-only | ready-to-deploy | Genética: riesgo |
| availability_check | read-only | ready-to-deploy | Booking: disponibilidad |
| calculate_meal_macros | read-only | ready-to-deploy | Nutrición: macros |
| calculate_who_percentile | read-write | ready-to-deploy | Pediatría: percentiles |
| check_referral_status | read-only | ready-to-deploy | Ops: referrals |
| dental_risk_assessment | read-only | ready-to-deploy | Odontología: riesgo |
| expand_icd_codes | read-only | ready-to-deploy | Diagnóstico: búsqueda ICD |
| who_growth_percentile | read-only | ready-to-deploy | Pediatría: percen |
| sync_appointments | sync | needs-review | Ops: calendarios externos |

---

## 🎯 PLAN DE DESPLIEGUE RECOMENDADO

### TIER 1A - FASE URGENTE (Ya en producción)
✓ pregnancy_gestational_age  
✓ calculate_who_growth_percentile  
✓ check_drug_interactions  

### TIER 1B - FASE INMEDIATA (Deploy próximos 3 días)
**Crítico para flujo de admisiones:**
- admision_crear_hospitalizacion
- admision_sync_to_hospitalizacion
- admision_sync_to_hospitalizacion

**Deploy order:**
1. admision_crear_hospitalizacion (base para kardex)
2. admision_sync_to_hospitalizacion (sync automático)
3. obstetric_risk_calculator (validación obs)
4. calculate_icu_severity (ICU monitoring)
5. triage_emergency_patient (emergencia)

### TIER 2 - FASE DE VALIDACIONES (Deploy próximos 7 días)
**6-15 funciones - Validaciones clínicas:**
- cirugia_sync_to_quirofanos
- sync_multicentro
- immunization-validation / immunization_validation
- lab_validation
- nutrition_validation / nutrition-validation
- stage_diagnosis
- surgery-validation
- create_treatment_plan
- consolidate_ehr_summary

### TIER 3 - PHASE DE SINCRONIZACIÓN (Deploy próximas 2 semanas)
**Depende de Thalamus y sistemas externos:**
- sync_process_queue
- sync_resolve_conflicts
- sync_patient_data
- sync_get_status
- ehr-sync-thalamus (reviews)
- sync_ehr_to_thalamus (reviews)
- fhir-api (reviews)

### TIER 4 - FASE COMPLEMENTARIA (Deploy próximas 4 semanas)
**Funciones complementarias y análisis avanzados:**
- Imágenes: dicom_viewer, segment_imaging, sync_orthanc_dicom
- Reportes: export_lab_results, export_radiology_report, generate_ehr_export
- Audit/Admin: log_ehr_access, audit_federation
- Others: calculate_meal_macros, dental_risk_assessment, etc.

---

## ⚠️ FUNCIONES CON ISSUES (needs-review)

### Tabla de Issues

| Función | Issue | Recomendación |
|---------|-------|----------------|
| fhir-api | Usa tablas hosix_* (deprecated) | Revisar si tablas siguen activas o mapear a nuevas |
| ehr-sync-thalamus | Depende de Thalamus API | Validar credentials y endpoints antes de deploy |
| sync_ehr_to_thalamus | Depende de Thalamus API | Validar credentials y endpoints antes de deploy |
| sync_orthanc_dicom | Depende de Orthanc server | Validar URL y acceso antes de deploy |
| sync_staff_to_thalamus | Depende de Thalamus API | Validar credentials y endpoints antes de deploy |
| dicom_viewer | Requiere DICOM processing lib | Confirmar si cornerstonejs está disponible |
| segment_imaging | Requiere AI model deployment | Pendiente: ¿modelo en PyTorch, TensorFlow, o ONNX? |
| send_reminders | Función simulada | Integrar SMS/Email/Push providers |
| facility_sync | Datos simulados | Implementar lógica real de sincronización |
| sync_appointments | Usa calendarios externos | Verificar OAuth y APIs de Google/Microsoft |

---

## 📊 ANÁLISIS POR MÓDULO

### Obstetricia (5 funciones)
- **Críticas:** pregnancy_gestational_age ✓, admision_crear_hospitalizacion, admision_sync_to_hospitalizacion, obstetric_risk_calculator
- **Validación:** stage_diagnosis (secundaria)
- **Total:** 5 → Deploy Tier 1B/2

### Pediatría (4 funciones)
- **Bases:** calculate_who_growth_percentile ✓, who_growth_percentile, calculate_who_percentile
- **Vacunación:** vaccination_next_dose
- **Total:** 4 → Deploy Tier 3/4

### Farmacia (7 funciones)
- **Crítica:** check_drug_interactions ✓
- **Validación:** pharmacotherapy_validation, pharmacy_validation
- **Stock:** calculate_stock_analysis
- **Diagnóstico:** stage_diagnosis (interacción)
- **Total:** 7 → Deploy Tier 2/3

### EHR/Documentos (9 funciones)
- **Búsqueda:** ehr-search
- **Consolidación:** consolidate_ehr_summary
- **Export:** generate_ehr_export, export_lab_results, export_radiology_report
- **Sync:** ehr-sync-thalamus, sync_ehr_to_thalamus, fhir-api, log_ehr_access
- **Total:** 9 → Deploy Tier 2/3 (algunos con reviews)

### Cirugía (3 funciones)
- **Sync:** cirugia_sync_to_quirofanos
- **Validación:** surgery-validation
- **Planificación:** create_treatment_plan
- **Total:** 3 → Deploy Tier 1B/2

### Diagnóstico (4 funciones)
- **Validación:** stage_diagnosis
- **Planificación:** create_treatment_plan
- **ICD:** expand_icd_codes
- **Genética:** assess_genetic_risk
- **Total:** 4 → Deploy Tier 2/4

### Laboratorio (4 funciones)
- **Validación:** lab_validation
- **Export:** export_lab_results
- **Validación resultados:** validate_lab_results
- **Búsqueda:** ehr-search
- **Total:** 4 → Deploy Tier 2/3

### Imágenes (6 funciones)
- **Viewer:** dicom_viewer
- **Segmentación:** segment_imaging
- **DICOM Sync:** sync_orthanc_dicom
- **Export:** export_radiology_report
- **Análisis:** analyze_refraction_data
- **Total:** 6 → Deploy Tier 3/4 (algunos con reviews)

### Inmunización (3 funciones)
- **Validación:** immunization-validation, immunization_validation (DUPLICADAS)
- **Schedule:** vaccination_next_dose
- **Total:** 3 → Deploy Tier 2 (consolidar duplicados)

### Nutrición (3 funciones)
- **Validación:** nutrition_validation, nutrition-validation (DUPLICADAS)
- **Macros:** calculate_meal_macros
- **Total:** 3 → Deploy Tier 3/4 (consolidar duplicados)

### Multi-centro/Sync (8 funciones)
- **Orquestación:** sync_multicentro
- **Procesar:** sync_process_queue
- **Conflictos:** sync_resolve_conflicts
- **Status:** sync_get_status
- **Datos:** sync_patient_data
- **Thalamus:** sync_ehr_to_thalamus, ehr-sync-thalamus, sync_staff_to_thalamus
- **Total:** 8 → Deploy Tier 1B/2/3

### Admin/HR (3 funciones)
- **Nominas:** calculate_payroll
- **Staff:** sync_staff_to_thalamus
- **Audit:** audit_federation
- **Total:** 3 → Deploy Tier 3/4

### Admin/Ops (5 funciones)
- **Confirmación:** availability_check
- **Referrals:** check_referral_status
- **Ocupancy:** estimate_bed_occupancy
- **Appointments:** sync_appointments
- **Reminders:** send_reminders
- **Total:** 5 → Deploy Tier 3/4

### Enfermería (1 función)
- **Scheduling:** schedule_nursing_tasks
- **Total:** 1 → Deploy Tier 4

### Emergencia (1 función)
- **Triage:** triage_emergency_patient
- **Total:** 1 → Deploy Tier 1B

### Odontología (1 función)
- **Risk:** dental_risk_assessment
- **Total:** 1 → Deploy Tier 4

### Oftalmología (1 función)
- **Analysis:** analyze_refraction_data
- **Total:** 1 → Deploy Tier 4

### Auditoría (1 función)
- **Access Log:** log_ehr_access
- **Total:** 1 → Deploy Tier 3/4

---

## 🚨 CRITICAL ISSUES FOUND

### 1. **DUPLICADAS - Nombres inconsistentes**
```
immunization-validation (con guión)  ← Use this
immunization_validation (con guión bajo)  ← DUPLICATE - consolidar

nutrition-validation (con guión)  ← Use this
nutrition_validation (con guión bajo)  ← DUPLICATE - consolidar

calculate_who_percentile  ← Similar to calculate_who_growth_percentile
who_growth_percentile  ← DUPLICATE naming
```
**Acción:** Consolidar y eliminar duplicados antes de deploy.

### 2. **Dependencias Criticas Externas** 
- **Thalamus API:** ehr-sync-thalamus, sync_ehr_to_thalamus, sync_staff_to_thalamus
- **Orthanc PACS:** sync_orthanc_dicom
- **External Calendars:** sync_appointments (Google, Microsoft, iCal)
- **SMS/Email/Push:** send_reminders

**Acción:** Validar endpoints, credenciales y disponibilidad ANTES de deploy.

### 3. **Funciones Simuladas (No Listas para Producción)**
- send_reminders: Usa datos mock
- facility_sync: Datos simulados
- sync_appointments: No integra calendarios reales

**Acción:** Implementar integraciones reales o limitar a testing.

### 4. **Tablas DEPRECATED**
- fhir-api usa: hosix_pacientes, hosix_prescripciones, hosix_enfermeria_constantes
- Estas tablas pueden estar deprecated vs. electronic_health_record schema

**Acción:** Revisar migrations y esquema actual.

### 5. **Missing Table References** (posibles issues)
- send_reminders: No consulta appointments table directamente
- facility_sync: No referencias de tablas
- audit_federation: Log simulado, sin guardar en BD

**Acción:** Revisar implementaciones antes de deploy.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Para CADA función:

- [ ] **Código completamente escrito** (no stubs)
- [ ] **Tabla(s) existen en Supabase** (verificar migrations)
- [ ] **RLS Policies confirmadas** (si aplica)
- [ ] **Service Role permissions OK** (si usa SERVICE_ROLE_KEY)
- [ ] **Dependencias externas disponibles** (APIs, servers)
- [ ] **Testeable localmente** (deno test)
- [ ] **Error handling completo** (no crashes)
- [ ] **CORS headers correctos** (si es HTTP)
- [ ] **No secrets hardcodeados** (usar Deno.env)
- [ ] **Documentación actualizada**

### Deploy Order By Dependency:

1. **Read-only calculators first** → No dependencies
2. **Database reads** → Then validations
3. **Database writes** → Then syncs
4. **External syncs** → Last (Thalamus, Orthanc)

---

## 🔧 RECOMENDACIONES INMEDIATAS

### Week 1:
1. ✓ Deploy Tier 1A (ya hecho)
2. **Consolidar duplicados** (immunization, nutrition, WHO percentiles)
3. **Limpiar funciones simuladas**
4. **Deploy Tier 1B urgente** (admisiones, triage)

### Week 2:
5. **Validar Thalamus/Orthanc endpoints**
6. **Deploy Tier 2 validaciones**
7. **Test sync multicentro**

### Week 3-4:
8. **Deploy Tier 3 complementarias**
9. **Implementar send_reminders real**
10. **Deploy Tier 4 nice-to-have**

---

## 📝 NOTAS FINALES

- **Total Funciones:** 56 (incluyendo 3 ya deployed)
- **Funciones restantes por desplegar:** 53
- **Funciones críticas a desplegar AHORA:** 8
- **Funciones con issues críticos:** 10 (necesitan review)
- **Funciones duplicadas:** 4 (consolidar)

**Estimated Deployment Timeline:**
- **Tier 1B:** 3-5 días (critical)
- **Tier 2:** 7-14 días (validaciones)
- **Tier 3:** 14-28 días (sync/complementarias)
- **Tier 4:** 28-45 días (nice-to-have)

**Total:** ~6-8 semanas para deployment completo del sistema.

