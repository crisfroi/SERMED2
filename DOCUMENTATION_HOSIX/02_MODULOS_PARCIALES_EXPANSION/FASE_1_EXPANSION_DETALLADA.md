# 📌 FASE 1: MÓDULOS PARCIALES - EXPANSIÓN DETALLADA

*Plan de expansión para 5 módulos HOSIX existentes (Weeks 1-5)*

---

## 🎯 MÓDULO 1: ASIS_05_CRED (health_pediatrics) - EXPANSIÓN

**Estado actual:** 60% - Child growth charts básico  
**TRYTON base:** health_pediatrics + health_pediatrics_growth_charts + health_pediatrics_growth_charts_who  
**Brecha:** WHO percentile charts, milestone tracking

### Tareas de expansión:

#### 1.1 Base: Newborn informaticsWHO (NEW)
```sql
-- New tables to add
CREATE TABLE newborn_info (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  birth_weight DECIMAL(5,2),
  birth_length DECIMAL(5,2),
  apgar_1min INT,
  apgar_5min INT,
  congenital_anomalies TEXT,
  hospital_id UUID
);

CREATE TABLE pediatric_milestone (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  milestone_type VARCHAR (head_control, sociable, words, walking),
  expected_age_months INT,
  achieved_date DATE,
  notes TEXT
);
```

#### 1.2 React Hooks needed (NEW):
```typescript
// hooks/usePediatricInfo.ts - Extract & standardize
export const usePediatricInfo = (patientId: string) => {...}

// hooks/useNewbornData.ts - Apgar, birth stats
export const useNewbornData = (patientId: string) => {...}

// hooks/useMilestoneTracking.ts - WHO development milestones
export const useMilestoneTracking = (patientId: string) => {...}

// hooks/useChildGrowthWHO.ts - WHO percentile curves (CRITICAL)
export const useChildGrowthWHO = (patientId: string, gender: string) => {...}
```

#### 1.3 Edge Functions needed (NEW):
```typescript
// obstetric_risk_calculator.ts - EXPAND for pediatric risk
// calculate_who_percentile.ts - WHO curves (Z-score calculation)
// generate_growth_report.ts - Visual growth analysis
```

#### 1.4 Components existing:
- ✅ ChildGrowthChart
- ✅ PediatricAssessmentForm
- ⚠️ NEW: MilestoneTracker
- ⚠️ NEW: NewbornAssessmentExpanded
- ⚠️ NEW: WHOPercentileChart

#### 1.5 RLS Policies (NEW):
```sql
-- Usuario pediatra puede ver solo sus pacientes pediátricos
CREATE POLICY pediatric_access ON newborn_info
  USING (auth.uid() IN (
    SELECT user_id FROM hospital_user WHERE hospital_id = newborn_info.hospital_id
  ));
```

**Deliverables:**
- [ ] 3 SQL migrations (newborn_info, pediatric_milestone, pediatric_assessment_expanded)
- [ ] 4 React hooks
- [ ] 3 Edge Functions
- [ ] 3 new components
- [ ] RLS policies
- **Effort:** 2-3 days | 1 developer

---

## 🎯 MÓDULO 2: ASIS_07_Nutrición (health_lifestyle) - EXPANSIÓN

**Estado actual:** 50% - Components have inline logic  
**TRYTON base:** health_lifestyle  
**Brecha:** Nutrition assessment persistence, meal planning, macronutrient tracking

### Tareas de expansión:

#### 2.1 Schema: Nutrition assessment & meal planning (NEW)
```sql
CREATE TABLE nutrition_assessment (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  assessment_date TIMESTAMP,
  bmi DECIMAL(5,2),
  nutritional_status VARCHAR (normal, overweight, underweight, obese),
  dietary_habits TEXT,
  allergies TEXT,
  supplements TEXT,
  hospital_id UUID,
  created_by UUID,
  created_at TIMESTAMP
);

CREATE TABLE meal_plan (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  encounter_id UUID REFERENCES encounter(id),
  start_date DATE,
  end_date DATE,
  kcal_target INT,
  protein_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  notes TEXT,
  status VARCHAR (draft, active, completed, cancelled),
  hospital_id UUID
);

CREATE TABLE meal_plan_item (
  id UUID PRIMARY KEY,
  meal_plan_id UUID REFERENCES meal_plan(id),
  meal_type VARCHAR (breakfast, lunch, snack, dinner),
  food_item VARCHAR,
  quantity DECIMAL(10,2),
  unit VARCHAR (g, ml, portion),
  kcal_contributed DECIMAL(8,2),
  protein_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2)
);

CREATE TABLE nutrition_compliance (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  meal_plan_id UUID REFERENCES meal_plan(id),
  compliance_date DATE,
  meals_completed INT,
  meals_planned INT,
  compliance_pct DECIMAL(5,2),
  notes TEXT
);
```

#### 2.2 React Hooks (NEW - to create ASAP):
```typescript
// hooks/useNutritionAssessment.ts - Get/save assessment
export const useNutritionAssessment = (patientId: string) => {...}

// hooks/useMealPlan.ts - Create, update, retrieve meal plans
export const useMealPlan = (patientId: string) => {...}

// hooks/useMealPlanItems.ts - Add/remove items, calculate macros
export const useMealPlanItems = (mealPlanId: string) => {...}

// hooks/useNutritionCompliance.ts - Track adherence
export const useNutritionCompliance = (patientId: string) => {...}

// hooks/useNutrientDatabase.ts - Query foods, macros, kcals
export const useNutrientDatabase = (foodName: string) => {...}
```

#### 2.3 Edge Functions (NEW):
```typescript
// calculate_macros.ts - Parse food quantity → macros
// generate_meal_plan.ts - Auto-generate from dietary requirements
// track_compliance.ts - Daily update compliance tracking
// nutrition_alert.ts - Alert if compliance < 70%
```

#### 2.4 Components (to enhance):
- ✅ MealPlanViewer - Enhance with edit capability
- ✅ NutritionAssessmentForm - Add BMI auto-calc
- ✅ NutritionComplianceTracker - Add date range filters
- ⚠️ NEW: MealPlanBuilder (drag & drop meal planning)
- ⚠️ NEW: NutrientSearch (food database search)

#### 2.5 RLS Policies:
```sql
-- Dieticia ve meal plans de su hospital & pacientes asignados
CREATE POLICY nutrition_access ON meal_plan
  USING (hospital_id = current_hospital_id());
```

**Deliverables:**
- [ ] 4 SQL migrations (nutrition_assessment, meal_plan, meal_plan_item, nutrition_compliance)
- [ ] 5 React hooks
- [ ] 4 Edge Functions
- [ ] 2 new components
- [ ] Nutrient database (seed data: 500+ foods)
- **Effort:** 4-5 days | 1 developer

---

## 🎯 MÓDULO 3: ASIS_10_Medicamentos (health_stock) - EXPANSIÓN

**Estado actual:** 70% - Basic stock, missing variants  
**TRYTON base:** health_stock + health_stock_inpatient + health_stock_nursing + health_stock_surgery  
**Brecha:** Inpatient stock, surgical kits, nursing supplies, expiration management

### Tareas de expansión:

#### 3.1 Schema: Stock variants (NEW Tables)
```sql
CREATE TABLE medication_variant (
  id UUID PRIMARY KEY,
  medication_id UUID REFERENCES medication(id),
  batch_number VARCHAR UNIQUE,
  expiration_date DATE,
  quantity_units INT,
  location VARCHAR (warehouse, inpatient_pharmacy, surgical_kit, nursing_station),
  cost_per_unit DECIMAL(10,2),
  supplier_id UUID REFERENCES supplier(id),
  hospital_id UUID,
  created_at TIMESTAMP
);

CREATE TABLE surgical_kit (
  id UUID PRIMARY KEY,
  kit_name VARCHAR,
  hospital_id UUID,
  created_at TIMESTAMP
);

CREATE TABLE surgical_kit_item (
  id UUID PRIMARY KEY,
  surgical_kit_id UUID REFERENCES surgical_kit(id),
  medication_id UUID REFERENCES medication(id),
  quantity INT,
  units VARCHAR
);

CREATE TABLE inpatient_medication_stock (
  id UUID PRIMARY KEY,
  medication_id UUID REFERENCES medication(id),
  floor INT,
  room_number INT,
  quantity INT,
  min_threshold INT,
  hospital_id UUID,
  last_audit_date DATE
);

CREATE TABLE stock_expiration_alert (
  id UUID PRIMARY KEY,
  medication_variant_id UUID REFERENCES medication_variant(id),
  days_until_expiry INT,
  alert_level VARCHAR (critical, warning, info),
  alert_date TIMESTAMP,
  status VARCHAR (pending, acknowledged, expired),
  hospital_id UUID
);
```

#### 3.2 React Hooks (to create + test):
```typescript
// hooks/useInventoryManagement.ts - Stock levels (created but verify)
// hooks/useExpirationTracking.ts - Expiration alerts (created but verify)
// hooks/useMedicationVariant.ts - Track batches
// hooks/useSurgicalKits.ts - Kit inventory
// hooks/useInpatientPharmacy.ts - Floor-level stock
```

#### 3.3 Edge Functions (to verify + enhance):
```typescript
// inventory_low_stock_alert.ts - Alert < min_threshold
// expiration_approaching.ts - Alert 30/14/7 days before exp
// surgical_kit_compliance.ts - Verify kit items present
// generate_stock_audit_report.ts - Periodic inventory audit
```

#### 3.4 Components:
- ✅ SupplierOrderManager - Enhance with batch tracking
- ✅ InventoryDashboard - Enhance to show variants/locations
- ✅ ExpirationAlertViewer - Already exists
- ⚠️ NEW: SurgicalKitBuilder
- ⚠️ NEW: InpatientPharmacyManager

#### 3.5 RLS Policies:
```sql
-- Farmacéutico ve stock su hospital
-- Inpatient nurses ven solo su piso/unidad
-- Cirujano ve surgical kits
```

**Deliverables:**
- [ ] 5 SQL migrations
- [ ] 4 React hooks
- [ ] 4 Edge Functions
- [ ] 2 new components
- [ ] Seed data: 50 surgical kits templates
- **Effort:** 5-6 days | 1-2 developers

---

## 🎯 MÓDULO 4: ASIS_13_EHR (health + health_history) - EXPANSIÓN

**Estado actual:** 80% - EHR exists, missing history/versions  
**TRYTON base:** health + health_history (partial coverage)  
**Brecha:** Document versioning, full audit trail, encrypted sensitive data

### Tareas de expansión:

#### 4.1 Schema: Document versioning & encrypted storage (NEW)
```sql
CREATE TABLE electronic_health_record_version (
  id UUID PRIMARY KEY,
  ehr_id UUID REFERENCES electronic_health_record(id),
  version INT,
  content JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP,
  change_reason VARCHAR,
  is_encrypted BOOLEAN DEFAULT false,
  encryption_key_id UUID
);

CREATE TABLE ehr_sensitive_data (
  id UUID PRIMARY KEY,
  ehr_id UUID REFERENCES electronic_health_record(id),
  field_name VARCHAR,
  encrypted_value TEXT,
  encryption_algorithm VARCHAR DEFAULT 'AES-256-GCM',
  key_id UUID,
  access_log JSONB,
  hospital_id UUID
);
```

#### 4.2 React Hooks (NEW):
```typescript
// hooks/useEHRVersioning.ts - Get/compare versions
// hooks/useEHRHistory.ts - Full timeline
// hooks/useEHREncryption.ts - Encrypt/decrypt sensitive
// hooks/useEHRAccessAudit.ts - Who accessed what & when
```

#### 4.3 Edge Functions:
```typescript
// create_ehr_version.ts - Auto-version on changes
// encrypt_sensitive_ehr.ts - Encrypt PII fields automatic
// track_ehr_access.ts - Log all reads (CRITICAL audit)
// generate_ehr_audit_report.ts - Full document history
```

#### 4.4 Components:
- ✅ EHRTimeline - Already exists
- ✅ ElectronicHealthRecordDashboard - Already exists
- ✅ AuditLog - Already exists
- ⚠️ ENHANCE: Version comparison view
- ⚠️ NEW: EncryptionStatusIndicator

#### 4.5 RLS + Encryption:
```sql
-- Only patient + authorized doctors + auditor can read EHR
-- Sensitive fields encrypted
-- Access logged to ehr_sensitive_data.access_log
```

**Deliverables:**
- [ ] 2 SQL migrations (ehr_version, ehr_sensitive_data)
- [ ] 4 React hooks
- [ ] 4 Edge Functions
- [ ] 1 new component
- [ ] Encryption key management
- **Effort:** 4-5 days | 1-2 developers

---

## 🎯 MÓDULO 5: ASIS_14_Diagnóstico (health_icd10) - EXPANSIÓN

**Estado actual:** 75% - ICD-10 exists, missing ICD-11/9/10-PCS  
**TRYTON base:** health_icd10 + health_icd11 + health_icd9procs + health_icd10pcs  
**Brecha:** Multiple ICD standards, comorbidity matrix, complexity scores

### Tareas de expansión:

#### 5.1 Schema: ICD-11 & comorbidity matrix (NEW)
```sql
CREATE TABLE diagnosis_icd11 (
  id UUID PRIMARY KEY,
  icd11_code VARCHAR UNIQUE,
  icd11_description TEXT,
  icd10_equivalent VARCHAR,
  hospital_id UUID
);

CREATE TABLE diagnosis_comorbidity_matrix (
  id UUID PRIMARY KEY,
  primary_diagnosis_id UUID REFERENCES diagnosis(id),
  secondary_diagnosis_id UUID REFERENCES diagnosis(id),
  comorbidity_score DECIMAL(5,2),
  interaction_warning TEXT,
  shared_medications TEXT[],
  hospital_id UUID
);

CREATE TABLE diagnosis_complexity_score (
  id UUID PRIMARY KEY,
  diagnosis_id UUID REFERENCES diagnosis(id),
  icd_version VARCHAR (ICD10, ICD11, ICD9),
  complexity_level INT,
  patient_morbidity_index DECIMAL(5,2),
  resource_intensity_weight DECIMAL(10,2),
  calculated_at TIMESTAMP
);
```

#### 5.2 React Hooks (NEW + verify existing):
```typescript
// hooks/useDiagnosisForm.ts - Already exists, verify
// hooks/useComorbidityAnalysis.ts - Assess interactions (created but verify)
// hooks/useDiagnosisICD11.ts - ICD-11 search & map
// hooks/useDiagnosisComplexity.ts - Calculate morbidity index
```

#### 5.3 Edge Functions:
```typescript
// analyze_comorbidities.ts - Check interactions
// calculate_morbidity_index.ts - Charlson/Elixhauser score
// map_icd_versions.ts - ICD-10 ↔ ICD-11 conversion
// alert_high_complexity.ts - Alert if complexity > threshold
```

#### 5.4 Components:
- ✅ DiagnosisForm
- ✅ ComorbidityAnalyzer
- ⚠️ NEW: MorbidityIndexCard
- ⚠️ NEW: ICD11SearchDialog

#### 5.5 RLS:
```sql
-- Médico ve diagnósticos de sus pacientes
-- Analyzer (role) puede ver aggregate comorbidity patterns
```

**Deliverables:**
- [ ] 3 SQL migrations
- [ ] 4 React hooks
- [ ] 4 Edge Functions
- [ ] 2 new components
- [ ] ICD-11 reference data (import WHO file)
- **Effort:** 3-4 days | 1 developer

---

## ✅ FASE 1: SÍNTESIS

| Módulo | Tables | Hooks | Components | Functions | Days | Dev |
|--------|--------|-------|------------|-----------|------|-----|
| ASIS_05_CRED | 3 | 4 | 3 | 3 | 2.5 | 1 |
| ASIS_07_Nutrición | 4 | 5 | 2 | 4 | 4.5 | 1 |
| ASIS_10_Medicamentos | 5 | 4 | 2 | 4 | 5 | 1-2 |
| ASIS_13_EHR | 2 | 4 | 1 | 4 | 4 | 1-2 |
| ASIS_14_Diagnóstico | 3 | 4 | 2 | 4 | 3.5 | 1 |
| **TOTAL FASE 1** | **17** | **21** | **10** | **19** | **19.5** | **2-3** |

---

## 🚀 SIGUIENTE: CREAR MÓDULOS NUEVOS (FASE 2)

**¿Comenzamos a documentar FASE 2 (Clínicos)?**
- ⏰ Estimado: 6 módulos (inpatient, icu, nursing, pediatrics full, genetics, ems)
- 📍 Código: DOCUMENTATION_HOSIX/03_MODULOS_NUEVOS_TRYTON/FASE_2_CLINICOS/

**¿Confirmas FASE 1 detalle & entiendes FASE 2 próxima?**
