# 🔗 MAPEO ASIS HOSIX ↔ GNU HEALTH MODULES

## Objetivo
Definir exactamente qué módulos Tryton/GNU Health corresponden a cada módulo ASIS de HOSIX y qué falta implementar.

---

## MATRIZ DE CORRESPONDENCIA

### MÓDULO ASIS 1.0 - Médicos
```
STATUS: ✅ 100% COMPLETADO

HOSIX Componentes:
├─ DoctorsList.tsx (lista médicos)
├─ DoctorProfile.tsx (perfil médico)
├─ DoctorSchedule.tsx (horarios)
├─ ConsultationForm.tsx (consulta médica)
└─ DoctorOrdersPanel.tsx (órdenes médicas)

GNU Health Alignment:
├─ health/party.py (Physician)
├─ health/physician.py (metadata médico)
├─ health/appointment.py (consultation)
└─ health/patient.py (medical history)

BD Supabase:
✅ physician tabla existe
✅ consultation tabla existe
✅ appointment tabla existe
✅ RLS policies aplicadas

Next: Nada pendiente - COMPLETADO
```

---

### MÓDULO ASIS 2.0 - Enfermería
```
STATUS: ✅ 100% COMPLETADO

HOSIX Componentes:
├─ NursingDashboard.tsx
├─ PatientMonitoring.tsx (signos vitales)
├─ MedicationAdministration.tsx
├─ CarePlan.tsx
└─ NurseNotes.tsx

GNU Health Alignment:
├─ health_nursing/nursing.py
├─ health_nursing/care_plan.py
├─ health_nursing/nursing_procedures.py
└─ health/patient.py (medication track)

BD Supabase:
✅ nursing_order tabla
✅ care_plan tabla
✅ medication_administration tabla
✅ vital_signs tabla

Next: Integrar monitoreo real-time con Realtime
```

---

### MÓDULO ASIS 3.0 - Quirófanos
```
STATUS: ✅ 100% COMPLETADO

HOSIX Componentes:
├─ OperatingRoomScheduler.tsx
├─ SurgeryRegistration.tsx (procedimiento)
├─ AnesthesiaForm.tsx
├─ SurgicalTeamPanel.tsx
└─ SurgeryTimeline.tsx

GNU Health Alignment:
├─ health_surgery/surgery.py
├─ health_surgery/anesthesia.py
├─ health_surgery/surgical_team.py
├─ health_surgery/surgical_supplies.py
└─ health_surgery/surgical_protocols.py

BD Supabase:
✅ operating_room tabla
✅ surgery tabla
✅ anesthesia tabla
✅ surgical_supplies tabla

Next: Integrar protocols y checklists pre-quirúrgicos
```

---

### MÓDULO ASIS 4.0 - OBSTETRICIA ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes REQUERIDOS:
├─ PregnancyRegistry.tsx (registro gestación)
├─ GestationMonitor.tsx (seguimiento)
├─ DeliveryForm.tsx (parto)
├─ PostpartumForm.tsx (puerperio)
├─ NewbornAssessment.tsx (recién nacido)
└─ ObstetricRisk.tsx (cálculo riesgo)

GNU Health Modules:
├─ health_obstetrics/pregnancy.py
│  ├─ pregnancy model
│  ├─ pregnancy_complication
│  ├─ pregnancy_delivery
│  ├─ pregnancy_puerperium
│  └─ newborn_birth_weight
├─ health_obstetrics/partition_mode.py
├─ health_obstetrics/delivery_data.py
├─ health_obstetrics/labor_partograph.py
├─ health_obstetrics/anesthesia_obstetric.py
└─ health_obstetrics/obstetric_protocols.py

Key Tables in Tryton (from copia_total_salud.sql):
  gnuhealth_pregnancy:
  - id, patient, lmp (last menstrual period)
  - gestational_age, edd (expected delivery date)
  - status, complications[], critical_condition, state

  gnuhealth_delivery:
  - id, pregnancy, delivery_datetime
  - delivery_mode (vaginal/cesarean/assisted)
  - anesthesia_used, anesthesia_notes
  - complications[], maternal_complications[]

  gnuhealth_puerperium:
  - id, delivery, lochia, bleeding_amount
  - infection_sign, thrombo_embolism, eclampsia
  - state, notes

  gnuhealth_newborn_birth_weight:
  - id, delivery, weight, length, head_circumference
  - apgar_score, apgar_color, apgar_heart_rate, apgar_reflex, apgar_tone, apgar_respiration

IMPLEMENTATION PRIORITY: HIGH (WEEK 1)

Databases to create:
1. pregnancy
   id UUID PRIMARY KEY
   patient_id UUID FK
   lmp_date DATE
   gestational_age INT
   edd DATE
   status ENUM
   complications TEXT[]
   critical_condition BOOLEAN
   risk_level INT (0-100)
   created_at TIMESTAMP
   updated_at TIMESTAMP

2. delivery
   id UUID PRIMARY
   pregnancy_id UUID FK
   delivery_datetime TIMESTAMP
   delivery_mode ENUM('vaginal', 'cesarean', 'assisted')
   anesthesia_used VARCHAR
   anesthesia_notes TEXT
   maternal_complications TEXT[]
   fetal_complications TEXT[]
   blood_loss INT (ml)
   episiotomy BOOLEAN

3. puerperium
   id UUID PRIMARY
   delivery_id UUID FK
   lochia VARCHAR
   bleeding_amount INT (ml)
   infection_sign BOOLEAN
   thromboembolism_sign BOOLEAN
   eclampsia BOOLEAN
   status ENUM
   notes TEXT

4. newborn_assessment
   id UUID PRIMARY
   delivery_id UUID FK
   weight INT (grams)
   length INT (cm)
   head_circumference INT (cm)
   apgar_score INT (0-10)
   apgar_color, apgar_hr, apgar_reflex, apgar_tone, apgar_resp INT

Edge Functions:
- calculate_gestational_age(lmp_date)
- calculate_edd(lmp_date)
- obstetric_risk_calculator(pregnancy_id)
- apgar_score_interpreter(scores)

Components:
- PregnancyForm, GestationMonitor, DeliveryForm, etc. (see QUICK_START)

NEXT: Start Week 1
```

---

### MÓDULO ASIS 5.0 - CRED (Crecimiento y Desarrollo) ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes REQUERIDOS:
├─ ChildGrowthTracker.tsx
├─ MilestoneChecker.tsx (hitos del desarrollo)
├─ VaccinationSchedule.tsx (carné)
├─ DevelopmentScreening.tsx (detección problemas)
└─ ReferralForm.tsx (derivaciones)

GNU Health Modules:
├─ health_pediatrics/pediatrics.py
│  ├─ pediatric_evaluation
│  ├─ pediatric_vital_signs
│  └─ pediatric_vaccination
├─ health_pediatrics_growth_charts_who/
│  ├─ growth_data_who.py
│  └─ who_growth_standards.py
├─ health_pediatrics_growth_charts/
│  └─ growth_charts.py

Key Tables in Tryton:
  gnuhealth_pediatric_evaluation:
  - id, patient, child_age, parent_name
  - nutritional_status, motor_development, language, behavior
  - congenital_disease, prenatal_disease, danger_signs

  gnuhealth_growth_chart:
  - id, patient, age_months, weight, height
  - head_circumference, growth_velocity

  gnuhealth_vaccination:
  - id, patient, vaccine_name, date_given
  - batch_number, site, contra_indication, adverse_effects

IMPLEMENTATION PRIORITY: HIGH (WEEK 1)

Databases to create:
1. child_growth_control
   id UUID PRIMARY
   patient_id UUID FK
   visit_date DATE
   weight FLOAT (kg)
   length FLOAT (cm)
   head_circumference FLOAT (cm)
   age_months INT
   who_percentile_weight FLOAT
   who_percentile_length FLOAT
   nutritional_status VARCHAR

2. developmental_milestone
   id UUID PRIMARY
   patient_id UUID FK
   age_months INT
   gross_motor ENUM('achieved', 'expected', 'delayed')
   fine_motor ENUM
   language ENUM
   social_emotional ENUM

3. vaccination_administration
   id UUID PRIMARY
   patient_id UUID FK
   vaccine_name VARCHAR
   scheduled_date DATE
   actual_date DATE
   batch_number VARCHAR
   manufacturer VARCHAR
   site VARCHAR (arm, leg, etc)
   adverse_effects TEXT[]
   given_by_id UUID FK (nurse)

4. problem_detection
   id UUID PRIMARY
   patient_id UUID FK
   problem_type VARCHAR (hearing, vision, motor, etc)
   severity VARCHAR (mild, moderate, severe)
   detection_date DATE
   referral_status VARCHAR (pending, referred, reviewed)
   notes TEXT

Edge Functions:
- who_growth_percentile(weight, height, age, sex)
- vaccination_next_dose(patient_id)
- milestone_evaluator(age_months, responses)
- referral_generator(problem_type, severity)

NEXT: Start Week 1
```

---

### MÓDULO ASIS 6.0 - TRIAGE MANCHESTER ✅ 100%
```
STATUS: ✅ 100% COMPLETADO

GNU Health Module: health.py + health_asis_emergency.py (custom)

Implemented:
✅ ManchesterTriageSystem.tsx
✅ TriageCalculator.ts (5 colors)
✅ EmergencyAlert.tsx
```

---

### MÓDULO ASIS 7.0 - CPOE Prescripción ✅ 100%
```
STATUS: ✅ 100% COMPLETADO

GNU Health Modules:
├─ health/medication.py
├─ health/prescription.py
├─ health/cpoe_medication.py
└─ health/cpoe_monitoring.py

Implemented:
✅ PrescriptionForm.tsx
✅ MedicationInteractionChecker.tsx
✅ DosageCalculator.ts
✅ Edge Function: drug_interaction_checker.ts
```

---

### MÓDULO ASIS 8.0 - LABORATORIO ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes REQUERIDOS:
├─ LabOrderForm.tsx
├─ SampleTracker.tsx
├─ ResultsViewer.tsx
├─ TrendAnalysis.tsx
└─ CriticalValueAlert.tsx

GNU Health Modules:
├─ health_lab/lab.py
│  ├─ lab_test_critearea (criteria, normal range)
│  ├─ lab_test (test definition)
│  ├─ gnuhealth_lab_order
│  ├─ gnuhealth_lab_result
│  ├─ gnuhealth_patient_lab_test
│  └─ lab_automation (LIS integration)
├─ health_lab/lab_interfaces.py (LIS interfaces)
└─ health_lab/equipment.py (analyzers)

Key Tables in Tryton:
  gnuhealth_lab_test_critearea:
  - id, test, age_from, age_to, gender
  - lower_limit, upper_limit, normal_range
  - units, multiplier, critical_lower, critical_upper

  gnuhealth_patient_lab_test:
  - id, patient, test, date
  - result_text, result, units
  - result_range, state (waiting, done, abnormal)

  gnuhealth_lab_order:
  - id, patient, ordered_by, ordered_date
  - test_ids, priority, state (pending, collected, processed)

IMPLEMENTATION PRIORITY: HIGH (WEEK 2)

Databases to create:
1. lab_test
   id UUID PRIMARY
   code VARCHAR UNIQUE
   name VARCHAR
   category VARCHAR
   units VARCHAR
   sample_type VARCHAR (blood, urine, csf, etc)
   automation_possible BOOLEAN
   notes TEXT

2. lab_test_criteria
   id UUID PRIMARY
   lab_test_id UUID FK
   age_from INT
   age_to INT
   gender CHAR(1)
   lower_limit FLOAT
   upper_limit FLOAT
   critical_lower FLOAT
   critical_upper FLOAT
   units VARCHAR

3. lab_order
   id UUID PRIMARY
   patient_id UUID FK
   ordered_by_id UUID FK (physician)
   ordered_date TIMESTAMP
   priority VARCHAR (routine, urgent)
   test_ids UUID[] (FK lab_tests)
   notes TEXT
   status ENUM (pending, collected, processing, completed, cancelled)

4. lab_result
   id UUID PRIMARY
   lab_order_id UUID FK
   lab_test_id UUID FK
   result_value FLOAT
   result_text VARCHAR
   units VARCHAR
   result_status ENUM (normal, abnormal, critical)
   entered_by_id UUID FK
   entered_date TIMESTAMP
   critical_alert BOOLEAN

5. lab_sample
   id UUID PRIMARY
   lab_order_id UUID FK
   sample_type VARCHAR
   collection_datetime TIMESTAMP
   collected_by_id UUID FK
   status ENUM (collected, processing, analyzed, rejected)
   rejection_reason TEXT
   sample_integrity_check BOOLEAN

Edge Functions:
- validate_lab_result(result_id)
- critical_alert_generator(result_id)
- trend_analyzer(patient_id, test_id, num_results)
- reference_range_calculator(result_id)
- lis_interface_receiver() (LIS integration)

Components:
- LabOrderForm, ResultsViewer, TrendChart, etc.

NEXT: Start Week 2
```

---

### MÓDULO ASIS 9.0 - FARMACIA ⏳ 40%
```
STATUS: ⏳ 40% IMPLEMENTADO

Partially Complete:
✅ PharmacyInventory.tsx
✅ MedicationDispensing.tsx
⏳ PharmacistPrescriptionReview (IN PROGRESS)

GNU Health Modules:
├─ health_stock/ (basic inventory)
└─ health_stock_pharmacy/ (pharmacy specific, if exists)

Pending:
□ PharmacyControls (expiry, recalls)
□ DrugInteractionChecker (advanced)
□ PharmacyReporting
□ PatientEducation (medication adherence)

NEXT: Complete Week 2-3
```

---

### MÓDULO ASIS 10.0 - DIABETES E HTA ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING

GNU Health would use:
├─ health/chronic_disease.py
└─ health/clinical_procedures.py (custom disease protocols)

To Implement:
□ DiabetesRegistry - glucose tracking, medication, complications
□ HTARegistry - BP tracking, medication, organ damage
□ Risk calculator for both
□ Medication adherence tracking
□ Complication monitoring

NEXT: Week 3
```

---

### MÓDULO ASIS 11.0 - INTERCONSULTAS ⏳ 60%
```
STATUS: ⏳ 60% IMPLEMENTADO

GNU Health Módule:
├─ health/consultation.py
└─ health/referral.py

Implemented:
✅ ConsultationRequest.tsx
✅ ConsultationHistory.tsx
✅ RequestTracking.tsx

Pending:
□ ConsultationApprovalFlow
□ ResponseDocumentation
□ ConsultationMetrics

NEXT: Complete Week 3
```

---

### MÓDULO ASIS 12.0 - DIAGNÓSTICO ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes REQUERIDOS:
├─ DiagnosisCodeSearcher.tsx (ICD-10/11)
├─ ComorbidityPlanner.tsx
├─ DifferentialDiagnosis.tsx
└─ CodingValidator.tsx

GNU Health Modules:
├─ health/diagnosis.py
├─ health/icd10.py (ICD-10 tables)
├─ health/icd11.py (ICD-11 tables, optional)
└─ health/comorbidity.py

Key Tables:
  gnuhealth_pathology (diagnosis):
  - id, code (ICD10), description, category
  - abbreviation, notes

Key Tables to Create in Supabase:
1. diagnosis
   id UUID PRIMARY
   code_icd10 VARCHAR UNIQUE
   code_icd11 VARCHAR
   name VARCHAR
   category VARCHAR
   description TEXT

2. patient_diagnosis
   id UUID PRIMARY
   patient_id UUID FK
   diagnosis_id UUID FK
   diagnosis_date DATE
   diagnosis_type ENUM (primary, secondary, comorbidity)
   status ENUM (active, resolved, ruled_out)
   notes TEXT

3. comorbidity_relation
   id UUID PRIMARY
   diagnosis1_id UUID FK
   diagnosis2_id UUID FK
   frequency_percentage FLOAT
   risk_factor BOOLEAN

Edge Functions:
- icd_code_search(term)
- comorbidity_suggester(diagnosis_id)
- differential_diagnosis_list(symptoms)

NEXT: Start Week 3
```

---

### MÓDULO ASIS 13.0 - INFORMES ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes:
├─ ReportBuilder.tsx
├─ PDFExporter.tsx
├─ HL7Exporter.tsx
└─ ArchiveManager.tsx

GNU Health would use:
├─ health/report.py (custom templates)
└─ health/hl7_export.py (HL7 export)

To Implement:
□ DynamicReportTemplates
□ PDF generation (with Puppeteer/Konva)
□ HL7 message generation
□ FHIR R4 export
□ Digital signature
□ Report archiving

NEXT: Week 4
```

---

### MÓDULO ASIS 14.0 - REGÍMENES ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING

To Implement:
□ TreatmentProtocols registry
□ ProtocolPrescriber (assign to patient)
□ AdhereanceMonitor
□ ProtocolDeviation alerts
□ ProtocolCompletion tracking

Links to GNU Health:
├─ health/medication.py
├─ health_mdg6/ (specific protocols for HIV, TB, etc)

NEXT: Week 3-4
```

---

### MÓDULO ASIS 15.0 - IMÁGENES ⏳ PENDIENTE

```
STATUS: ⏳ 0% - PENDING IMPLEMENTATION

HOSIX Componentes:
├─ ImagingOrderForm.tsx
├─ DicomViewer.tsx (with Orthanc)
├─ RadiologyReport.tsx
└─ SeriesComparison.tsx

GNU Health Modules:
├─ health_imaging/imaging.py
├─ health_imaging_worklist/
├─ health_orthanc/ (PACS integration)

Key Tables:
  gnuhealth_imaging_order:
  - id, patient, ordered_by, ordered_date
  - procedure_type, indication, priority

  gnuhealth_imaging_report:
  - id, imaging_order, radiologist, report_text
  - findings, impression, date_reported

To Implement:
□ ImagingOrder creation
□ DICOM study storage (Orthanc backend)
□ DICOM Worklist integration
□ Radiology report generation
□ Auto-routing to radiologist

NEXT: Week 2-3
```

---

## 📊 RESUMEN DE IMPLEMENTACIÓN

| ASIS | Módulo | GNU Health | Estado | Week | Priority |
|------|--------|-----------|--------|------|----------|
| 1.0 | Médicos | health | ✅ 100% | - | - |
| 2.0 | Enfermería | health_nursing | ✅ 100% | - | - |
| 3.0 | Quirófanos | health_surgery | ✅ 100% | - | - |
| **4.0** | **Obstetricia** | **health_obstetrics** | **⏳ 0%** | **1** | **HIGH** |
| **5.0** | **CRED** | **health_pediatrics** | **⏳ 0%** | **1** | **HIGH** |
| 6.0 | Triage | health | ✅ 100% | - | - |
| 7.0 | CPOE | health | ✅ 100% | - | - |
| **8.0** | **Laboratorio** | **health_lab** | **⏳ 0%** | **2** | **HIGH** |
| 9.0 | Farmacia | health_stock | ⏳ 40% | 2-3 | HIGH |
| 10.0 | Diabetes/HTA | health | ⏳ 0% | 3 | MEDIUM |
| 11.0 | Interconsultas | health | ⏳ 60% | 3 | MEDIUM |
| **12.0** | **Diagnóstico** | **health/icd10** | **⏳ 0%** | **3** | **HIGH** |
| **13.0** | **Informes** | **health** | **⏳ 0%** | **4** | **HIGH** |
| **14.0** | **Regímenes** | **health/mdg6** | **⏳ 0%** | **3-4** | **HIGH** |
| **15.0** | **Imágenes** | **health_imaging** | **⏳ 0%** | **2-3** | **HIGH** |

**Total Completado**: 7/15 (47%)  
**Total Pendiente**: 8/15 (53%)  
**Total Parcial**: 1/15  
**Próxima Semana**: +2 módulos ASIS (Obstetrics, CRED) = 60% en Week 1

---

## 🚀 NEXT ACTIONS

1. **Confirmar**prioridades
2. **Asignar** desarrolladores por módulo
3. **Iniciar** Week 1 con Obstetricia + CRED
4. **Ejecutar** QUICK_START_WEEK1_OBSTETRICS_CRED.md

¡LET'S GO!
