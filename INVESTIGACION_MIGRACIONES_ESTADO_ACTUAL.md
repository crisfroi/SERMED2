# 🔍 INVESTIGACIÓN: Estado Actual de Migraciones - HALLAZGOS CRÍTICOS

**Fecha**: 2026-02-07  
**Investigador**: GitHub Copilot  
**Conclusión**: ⚠️ **LAS MIGRACIONES TIENEN DEPENDENCIAS ROTAS Y NO PUEDEN SER DEPLOYADAS TAL COMO ESTÁN**

---

## 📊 ESTADO ACTUAL DEL WORKSPACE

### ✅ LO QUE EXISTE EN EL REPOSITORIO

#### Archivos de Migraciones SQL (5 files)
```
supabase/migrations/
├── 20250116_001_hosix_base_schema.sql         (tablas hosix_*)
├── 20260412_001_create_obstetrics_tables.sql  (ASIS_04 - pregnancy, delivery)
├── 20260412_001_create_medication_regimens_tables.sql  (ASIS_10)
├── 20260412_002_create_cred_tables.sql        (ASIS_05)
└── 20260412_002_create_diagnosis_tables.sql   (ASIS_14 - ICD-10, diagnoses)
```

#### Componentes React (67+ files)
- ASIS_4_Obstetricia: GestationMonitor, DeliveryForm, etc.
- ASIS_5_CRED: GrowthChart, VaccinationSchedule, etc.
- ASIS_8_Nutricion: NutritionAssessmentForm
- ASIS_9_Inmunizacion: VaccinationScheduleForm
- ASIS_10_Regimenes: PharmacyManagement
- ASIS_14_Diagnostico: DiagnosisForm, ComorbidityAssessment
- ASIS_15_Imagenes: RadiologyReport, DicomViewer
- (y más)

#### Documentación (WEEKS 1-7)
- WEEK1_DELIVERY_COMPLETE.md: Obstetrics + CRED SQL + Components + Hooks + Functions
- WEEK3_DELIVERY_COMPLETE.md: Medications + Diagnoses (5 Hitos: SQL→Components→Hooks→Functions→Tests)
- 02_MASTER_IMPLEMENTACION_PLAN.md: 13-week roadmap con 5-Hito pattern

### ❌ LO QUE NO EXISTE EN SUPABASE

```
Tablas esperadas: 45+
Tablas reales en DB: 3 (electronic_health_record, ehr_episode_links, ehr_document_storage)

Faltantes:
- hosix_* tablas (base schema 20250116)
- patient, physician, hospital (tablas clínicas base)
- pregnancy, delivery, newborn_assessment (ASIS_04)
- child_growth_control, vaccination_administration (ASIS_05)
- medications, medication_orders, prescriptions (ASIS_10)
- icd10_codes, patient_diagnoses (ASIS_14)
```

---

## 🔴 PROBLEMAS CRÍTICOS EN LAS MIGRACIONES

### Problema 1: DEPENDENCIAS ROTAS (FK References)

**Migración**: `20260412_001_create_obstetrics_tables.sql`
```sql
CREATE TABLE pregnancy (
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    ...
);
```
**ERROR**: Tabla `patient` NO EXISTE en ninguna migración  
**Impacto**: Migration FALLS en línea 1 - imposible crear tabla

---

**Migración**: `20260412_001_create_obstetrics_tables.sql`
```sql
CREATE TABLE delivery (
    anesthesiologist_id UUID REFERENCES physician(id),
    ...
);
```
**ERROR**: Tabla `physician` NO EXISTE en ninguna migración  
**Impacto**: Migration FALLS - FK constraint no puede validarse

---

**Migración**: `20260412_002_create_diagnosis_tables.sql`
```sql
CREATE TABLE patient_diagnoses (
    patient_id UUID NOT NULL,
    icd10_id UUID NOT NULL REFERENCES public.icd10_codes(id) ON DELETE RESTRICT,
    ...
);
```
**ESTADO**: Asume que `patient` tabla existe (por patient_id sin REFERENCES)  
**IMPACTO**: No valida FK al momento de create, pero lógica de aplicación rompe

---

### Problema 2: ORDEN DE EJECUCIÓN INCORRECTO

**Actual**:
```
1. 20250116_001_hosix_base_schema.sql (hosix_usuarios, hosix_departamentos)
2. 20260412_001_create_obstetrics_tables.sql (pregnancy → REFERENCES patient ❌)
3. 20260412_002_create_diagnosis_tables.sql (icd10_codes ✅, pero patient ❌)
```

**Debe ser**:
```
1. Base clinical tables (patient, physician, hospital, organization)
2. 20250116_001_hosix_base_schema.sql
3. 20260412_* ASIS modules (after patient exists)
```

### Problema 3: NO EXISTEN TABLAS CLINICAS BASE

**Faltantes completamente**:
- `patient` - Registro de pacientes (core requirement)
- `physician` - Registro de médicos (core requirement)
- `hospital` o `organization` - Centros de salud
- `clinic` - Consultorios
- `department` - Departamentos clínicos
- `encounter` o `visit` - Visitas/consultas

**¿De dónde vienen?**
- NO documentadas en ninguna migración
- NO referenciadas en WEEK deliverables
- Probablemente: Olvidadas, o asumidas de GNU Health/Tryton

---

## 📋 LISTA DE MIGRACIONES POR ESTADO

| Archivo | Estado | Problema |
|---------|--------|----------|
| 20250116_001_hosix_base_schema.sql | ⚠️ **WAIT** | Depende de tablas clínicas base (patient, physician) |
| 20260412_001_create_obstetrics_tables.sql | ❌ **BROKEN** | FK: REFERENCES patient(id) - tabla no existe |
| 20260412_001_create_medication_regimens_tables.sql | ❌ **BROKEN** | FK: REFERENCES patient(id) - tabla no existe |
| 20260412_002_create_cred_tables.sql | ❌ **BROKEN** | FK: REFERENCES patient(id) - tabla no existe |
| 20260412_002_create_diagnosis_tables.sql | ❌ **BROKEN** | Asume patient tabla pero no define FK |

---

## ✅ CÓMO ARREGLAR

### OPCIÓN A: Crear Base Clinical Schema
**Crear archivo**: `supabase/migrations/20260300_000_clinical_base_schema.sql`

```sql
-- Tablas clínicas base (necesarias para todo el sistema)
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    ...
);

CREATE TABLE IF NOT EXISTS hospital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id),
    nombre VARCHAR(255) NOT NULL,
    ...
);

CREATE TABLE IF NOT EXISTS physician (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    ...
);

CREATE TABLE IF NOT EXISTS patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    ...
);
```

**Orden de ejecución**:
```
1. 20260300_000_clinical_base_schema.sql ← CREAR PRIMERO
2. 20250116_001_hosix_base_schema.sql
3. 20260412_* ASIS modules
```

### OPCIÓN B: Usar Schema de GNU Health/Tryton
Si el proyecto es fork de GNU Health, importar schema original primero

### OPCIÓN C: Revisar Documentación de Diseño
Leer `PLAN_MAESTRO_GNU_HEALTH_IMPLEMENTACION.md` para entender qué tablas se esperaba crear

---

## 🤔 PREGUNTAS SIN RESPONDER

1. **¿Las tablas `patient` y `physician` deben venir de GNU Health?**
   - Si sí: Hay que importar GNU Health schema primero
   - Si no: Hay que crear nuestra propia definición

2. **¿Alguien intentó deployar estas migraciones alguna vez?**
   - Si sí: ¿Cuál fue el error?
   - Si no: ¿Por qué nadie las deployó?

3. **¿Los WEEK deliverables incluyen crear `patient` table?**
   - Revisé WEEK1 y WEEK3 docs: NO mencionan creación de patient/physician
   - ¿Fue un error de documentación?

4. **¿Las tablas base (patient, physician) están en otro archivo?**
   - Buscado: NO
   - ¿En repo antiguo?

---

## 🎯 RECOMENDACIÓN

**ANTES de deployar cualquier migración**:

1. ✅ **Definir** qué tablas clínicas base necesitas (patient, physician, hospital, etc.)
2. ✅ **Crear** migration file con estas tablas
3. ✅ **Validar** que TODAS las migraciones ASIS referencien tablas que existen
4. ✅ **Probar** migrations en orden correcto (sin FK errors)
5. ✅ **Deploy** a Supabase

**Mi recomendación**: Crear `20260300_000_clinical_base_schema.sql` PRIMERO, que defina patient, physician, hospital, y luego las demás migraciones funcionarán.

---

## 📝 PRÓXIMOS PASOS (Esperando tu decisión)

1. ¿De dónde debo obtener el schema para `patient` y `physician`?
   - GNU Health/Tryton existing schema?
   - O crear simple schema propio?

2. ¿Quieres que:
   - [ ] Cree 20260300_000_clinical_base_schema.sql?
   - [ ] Revise todas las otras migraciones para asegurar FK correctas?
   - [ ] Prepare un deployment plan con orden correcto?
   - [ ] Cree testing SQL para validar migraciones antes de deploy?

---

**Conclusión**: El usuario estaba en lo correcto - **"NO PUEDES APLICAR ESAS MIGRACIONES PORQUE NO CREO QUE ESTEN CORRECTAS"**. Tienen dependencias rotas. Necesitamos bajar estas migraciones antes de poder desplegar.
