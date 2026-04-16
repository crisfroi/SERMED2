// ============================================================================
// SEMANA 3: PLAN MAESTRO
// ASIS 10.0 (Regímenes) + ASIS 14.0 (Diagnóstico)
// ============================================================================

## 🗓️ **SEMANA 3: IMPLEMENTACIÓN**
**Objetivos**: Regímenes de medicación + Gestión centralizada de diagnósticos  
**Patrón**: 5 Hitos (SQL → React → Hooks → Edge Functions → Tests)  
**Target**: 7,500+ líneas de código, 100+ tests  

---

## 📋 **ASIS 10.0: REGÍMENES DE MEDICACIÓN**

### Funcionalidades Principales
1. **Crear Prescripciones**
   - Seleccionar medicamento (base de datos de 5,000+ fármacos)
   - Dosis y frecuencia (cada 4-6-8-12-24 horas)
   - Vía de administración (oral, IV, IM, tópica, etc.)
   - Duración del tratamiento
   - Indicaciones clínicas

2. **Gestionar Regímenes**
   - Combinar múltiples medicamentos en régimen
   - Detectar interacciones farmacológicas
   - Ajustar dosis por renal/hepática
   - Verificar alergias a medicamentos
   - Historial de cambios

3. **Adherencia del Paciente**
   - Registro de dosis tomadas
   - Alertas de incumplimiento
   - Recordatorios automáticos
   - Historial de adherencia

### Estructura SQL (850 líneas)

```sql
-- TABLAS PRINCIPALES
medication_types (5,000+ medicamentos precolados)
  - id, name, generic_name, therapeutic_class, manufacturer
  - contraindications, side_effects, interactions

prescriptions
  - id, patient_id, medication_id, dose, frequency, route
  - indication, start_date, end_date, status
  - prescriber_id, created_at

prescription_schedules
  - id, prescription_id, scheduled_time, day_of_week
  - dosage_amount

medication_regimens
  - id, patient_id, regimen_name, status
  - created_by, created_at, modified_at

regimen_items
  - id, regimen_id, prescription_id, sequence

medication_interactions
  - id, drug_a_id, drug_b_id, severity, description
  - management_strategy

adherence_logs
  - id, prescription_id, patient_id, taken_date, taken_time
  - status (taken, missed, taken_late)

-- RLS POLICIES (6 total)
-- Patient: Ver sus propios medicamentos
-- Clinician: Crear, modificar, ver regímenes
-- Pharmacist: Ver interacciones, adherencia
-- Admin: Ver todos
```

---

## 📋 **ASIS 14.0: DIAGNÓSTICO UNIFICADO**

### Funcionalidades Principales
1. **Crear Diagnósticos**
   - Seleccionar de ICD-10 (10,000+ códigos)
   - Diagnóstico principal vs secundarios
   - Fecha de diagnóstico
   - Estado (activo, resuelto, crónico)
   - Complicaciones

2. **Gestión de Diagnósticos**
   - Actualizar estado (nuevo → crónico → resuelto)
   - Vincular a episodios clínicos
   - Historial completo
   - Comorbilidades
   - Factores de riesgo

3. **Análisis y Reportes**
   - Prevalencia de diagnósticos
   - Comorbilidades más comunes
   - Tendencias históricas
   - Alertas por diagnósticos críticos

### Estructura SQL (800 líneas)

```sql
-- TABLAS PRINCIPALES
icd10_codes (10,000+ códigos precargados)
  - id, code, description, category, parent_code
  - severity, chronicity

diagnoses
  - id, patient_id, icd10_code_id, status
  - diagnosis_date, resolution_date
  - primary_diagnosis, rank
  - clinician_id, created_at

diagnosis_history
  - id, diagnosis_id, old_status, new_status
  - changed_date, changed_by

comorbidities
  - id, patient_id, diagnosis_id_1, diagnosis_id_2
  - significance_level, management_notes

diagnosis_alerts
  - id, patient_id, diagnosis_id, alert_type
  - alert_message, action_required

-- RLS POLICIES (5 total)
-- Patient: Ver sus diagnósticos
-- Clinician: CRUD completo
-- Specialist: Ver por especialidad
-- Admin: Ver todos
```

---

## 🧩 **HITOS SEMANA 3**

### **Hito 1: SQL Migrations** (1,650 líneas)
- Medicamentos (5,000+ precolados)
- Prescripciones y régimenes
- Diagnósticos ICD-10 (10,000+ precolados)
- Interacciones farmacológicas
- 11 RLS policies

**Output**: 2 archivos SQL, listo para `supabase db push`

### **Hito 2: React Components** (3,400 líneas)
**Regímenes (4 componentes)**:
1. MedicationForm: Seleccionar medicamento + dosis
2. RegimensList: Ver y gestionar regímenes
3. InteractionChecker: Detectar interacciones
4. AdherenceTracker: Registro de tomas

**Diagnóstico (3 componentes)**:
5. DiagnosisForm: ICD-10 search + crear diagnóstico
6. DiagnosisList: Listado con estado
7. ComorbidityAnalyzer: Comorbilidades y alertas

**UI**: Shadcn/UI + React Select (autocomplete) + Recharts

### **Hito 3: Custom Hooks** (1,600 líneas)
**Regímenes (4 hooks)**:
1. useMedications: CRUD medicamentos, búsqueda
2. usePrescriptions: Crear, editar, listar prescripciones
3. useInteractionChecker: Validar interacciones
4. useAdherence: Registro de adherencia, estadísticas

**Diagnóstico (3 hooks)**:
5. useDiagnosis: CRUD diagnósticos, búsqueda ICD-10
6. useComorbidities: Análisis de comorbilidades
7. useDiagnosisHistory: Historial y evolución

### **Hito 4: Edge Functions** (900 líneas)
1. **check_drug_interactions**: Validar interacciones, retornar severidad
2. **adjust_medication_dose**: Ajustar por renal/hepática
3. **generate_adherence_report**: PDF con estadísticas de adherencia
4. **analyze_comorbidities**: Análisis de comorbilidades + recomendaciones

### **Hito 5: Tests** (110+ tests)
- 20: useMedications tests
- 15: usePrescriptions tests
- 12: useInteractionChecker tests
- 18: useAdherence tests
- 20: useDiagnosis tests
- 12: useComorbidities tests
- 8: useDiagnosisHistory tests
- 14: Component tests (MedicationForm, DiagnosisForm)
- 15+: E2E scenarios

---

## 📊 **ESTIMACIONES SEMANA 3**

| Hito | Líneas | Tiempo | Status |
|------|--------|--------|--------|
| SQL | 1,650 | 45 min | ⏳ Starting |
| React | 3,400 | 60 min | ⏳ Pending |
| Hooks | 1,600 | 45 min | ⏳ Pending |
| Edge Fn | 900 | 30 min | ⏳ Pending |
| Tests | 110+ | 90 min | ⏳ Pending |
| **TOTAL** | **7,550+** | **240 min (4h)** | ⏳ **In Progress** |

---

## 🔍 **DATOS PRECOLADOS**

### Medicamentos (5,000+)
- Antibióticos: Amoxicilina, Aloxicilina, Ciprofloxacina, etc.
- Antihipertensivos: Metoprolol, Amlodipino, Lisinopril, etc.
- Antiinflamatorios: Ibuprofeno, Naproxeno, Prednisona, etc.
- Hipoglucemiantes: Metformina, Insulina, Glibenclamida, etc.
- Cardiovasculares: Atorvastatina, Warfarina, Aspirina, etc.
- + 4,990 más (Farmacopea Ecuatoriana)

### ICD-10 Códigos (10,000+)
- A00-B99: Enfermedades infecciosas
- C00-D49: Neoplasias
- E00-E89: Enfermedades endocrinas y metabólicas
- I00-I99: Enfermedades del sistema circulatorio
- J00-J99: Enfermedades del sistema respiratorio
- + Sistema nervioso, digestivo, genitourinario, etc.

---

## 🎯 **FLUJOS DE USUARIO**

### Enfoque Clínico: Prescrición de Medicamentos
```
1. Paciente presenta síntoma
2. Clinician diagnostica (ICD-10)
3. Clinician selecciona medicamento
4. Sistema valida:
   - Interacciones con otros medicamentos
   - Alergias del paciente
   - Dosis apropiada por renal/hepática
   - Contraindicaciones
5. Clinician ingresa dosis, frecuencia, duración
6. Medicamento se añade al régimen
7. Régimen se guarda y se notifica a paciente
8. Paciente registra dosis tomadas
9. Sistema monitorea adherencia
10. Reportes de adherencia para seguimiento
```

### Enfoque Administrativo: Comorbilidades
```
1. Clinician crea/actualiza diagnósticos
2. Sistema automáticamente:
   - Detecta comorbilidades (múltiples diagnósticos)
   - Busca guías de manejo para comorbilidades
   - Genera alertas si combinaciones críticas
3. Comorbidities view muestra:
   - Diagnósticos del paciente
   - Relaciones entre ellos
   - Factores de riesgo combinados
   - Recomendaciones de manejo
4. Reportes de prevalencia de comorbilidades
```

---

## 🚀 **COMENZANDO**

**Status**: ✅ Plan listo  
**Next Action**: Hito 1 - SQL Migrations (Regímenes + Diagnóstico)  
**ETA**: 4 horas (240 minutos)  

```
SEMANA 3 HITO 1 (SQL):
├── Tabla medications (5000+ medicamentos)
├── Tabla diagnoses (10000+ ICD-10 codes)
├── Tablas de regímenes, prescripciones, adherencia
├── RLS policies (11 total)
└── Ready for supabase db push
```

¿Continuamos con Hito 1? 🔧
