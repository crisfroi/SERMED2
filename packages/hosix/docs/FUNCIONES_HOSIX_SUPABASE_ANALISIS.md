# ANÁLISIS: Funciones HOSIX Supabase - Desplegadas vs Faltantes

## 📊 RESUMEN GENERAL

**Total de carpetas en `packages/hosix/src/functions hosix supabase/`**: 52
**Total de funciones desplegadas en Supabase**: 73
**Funciones NO desplegadas de esa carpeta**: 26

---

## ✅ FUNCIONES DESPLEGADAS (desde `functions hosix supabase/`)

| Nombre | Estado | Versión |
|--------|--------|---------|
| admision_crear_hospitalizacion | ACTIVE | 1 |
| calculate_meal_macros | ACTIVE | 1 |
| check_drug_interactions | ACTIVE | 1 |
| check_referral_status | ACTIVE | 1 |
| cirugia_sync_to_quirofanos | ACTIVE | 1 |
| consolidate_ehr_summary | ACTIVE | 1 |
| dental_risk_assessment | ACTIVE | 1 |
| dicom_viewer | ACTIVE | 1 |
| expand_icd_codes | ACTIVE | 1 |
| export_lab_results | ACTIVE | 1 |
| export_radiology_report | ACTIVE | 2 |
| fhir-api | ACTIVE | 1 |
| immunization-validation | ACTIVE | 2 |
| lab_validation | ACTIVE | 1 |
| nutrition-validation | ACTIVE | 1 |
| obstetric_risk_calculator | ACTIVE | 1 |
| pharmacotherapy_validation | ACTIVE | 1 |
| pharmacy_validation | ACTIVE | 1 |
| pregnancy_gestational_age | ACTIVE | 1 |
| schedule_nursing_tasks | ACTIVE | 1 |
| segment_imaging | ACTIVE | 1 |
| surgery-validation | ACTIVE | 1 |
| sync_appointments | ACTIVE | 1 |
| sync_get_status | ACTIVE | 1 |
| sync_orthanc_dicom | ACTIVE | 1 |
| sync_patient_data | ACTIVE | 1 |
| vaccination_next_dose | ACTIVE | 1 |
| verify_document_signature | ACTIVE | 1 |
| who_growth_percentile | ACTIVE | 1 |

**Total**: 29 funciones del directorio `functions hosix supabase` están desplegadas

---

## ❌ FUNCIONES NO DESPLEGADAS (todavía en carpeta)

| Nombre | Ubicación | Descripción |
|--------|-----------|------------|
| admision_sync_to_hospitalizacion | admision_sync_to_hospitalizacion/ | Sincronizar admisión a hospitalización |
| analyze_refraction_data | analyze_refraction_data/ | Analizar datos de refracción óptica |
| assess_genetic_risk | assess_genetic_risk/ | Evaluar riesgo genético |
| audit_federation | audit_federation/ | Auditar federación de datos |
| availability_check | availability_check/ | Verificar disponibilidad |
| calculate_icu_severity | calculate_icu_severity/ | Calcular severidad en ICU |
| calculate_payroll | calculate_payroll/ | Calcular nóminas |
| calculate_stock_analysis | calculate_stock_analysis/ | Análisis de inventario |
| calculate_who_growth_percentile | calculate_who_growth_percentile/ | Percentil crecimiento OMS |
| calculate_who_percentile | calculate_who_percentile/ | Percentil OMS |
| create_treatment_plan | create_treatment_plan/ | Crear plan de tratamiento |
| ehr-sync-thalamus | ehr-sync-thalamus/ | Sincronizar EHR con Thalamus |
| estimate_bed_occupancy | estimate_bed_occupancy/ | Estimar ocupación de camas |
| facility_sync | facility_sync/ | Sincronizar facilidades |
| generate_ehr_export | generate_ehr_export/ | Generar exportación EHR |
| immunization_validation | immunization_validation/ | Validar inmunización |
| log_ehr_access | log_ehr_access/ | Registrar acceso a EHR |
| nutrition_validation | nutrition_validation/ | Validar nutrición |
| sync_ehr_to_thalamus | sync_ehr_to_thalamus/ | Sincronizar EHR a Thalamus |
| sync_multicentro | sync_multicentro/ | Sincronizar múltiples centros |
| sync_process_queue | sync_process_queue/ | Procesar cola de sincronización |
| sync_resolve_conflicts | sync_resolve_conflicts/ | Resolver conflictos de sync |
| sync_staff_to_thalamus | sync_staff_to_thalamus/ | Sincronizar personal a Thalamus |
| triage_emergency_patient | triage_emergency_patient/ | Triaje de paciente emergencia |
| validate_lab_results | validate_lab_results/ | Validar resultados de laboratorio |
| validate_medication_order | validate_medication_order/ | Validar orden de medicamento |

**Total**: 26 funciones aún NO desplegadas

---

## 📝 OBSERVACIONES

1. **Funciones ya desplegadas**: 29 de 52 (56%)
2. **Funciones faltantes**: 26 de 52 (50%)
3. **Algunos slugs diferentes**: Hay variaciones entre nombres de carpeta y slug desplegado
   - Carpeta: `immunization-validation` → Slug: `immunization-validation` ✓
   - Carpeta: `immunization_validation` → Slug: `immunization_validation` ✓
   - Carpeta: `nutrition-validation` → Slug: `nutrition-validation` ✓
   - Carpeta: `nutrition_validation` → Slug: `nutrition_validation` ✓

4. **Conflictos potenciales**: Hay dos versiones de algunas funciones
   - `immunization-validation` y `immunization_validation`
   - `nutrition-validation` y `nutrition_validation`

---

## 🚀 PRÓXIMOS PASOS

**Opción 1**: Desplegar todas las 26 funciones faltantes
- Tiempo estimado: 5-10 minutos
- Impacto: Sistema HOSIX completo

**Opción 2**: Desplegar solo funciones críticas
- Sincronización: `admision_sync_to_hospitalizacion`, `ehr-sync-thalamus`, etc.
- Cálculos: `calculate_payroll`, `calculate_icu_severity`

**Opción 3**: Continuar con login test primero
- Validar que el login funciona
- Luego desplegar funciones incrementalmente

---

## 📋 INSTRUCCIONES PARA DESPLEGAR

Para desplegar una función específica, necesitamos:
1. Leer el archivo `index.ts` de la carpeta
2. Verificar que sea una función Deno válida
3. Usar `mcp_supabase_deploy_edge_function` con el nombre correcto

¿Deseas que despliegue las 26 funciones faltantes ahora?
