# 🚀 INICIO RÁPIDO - HOSIX GNU HEALTH WEEK 1

## 🎯 OBJETIVO SEMANA 1
Implementar **ASIS 4.0 (Obstetricia)** + **ASIS 5.0 (CRED)** con BD + Componentes + Tests

**Duración**: 5 días laborales  
**Team**: 1 Full-Stack Dev + 1 Database Specialist  
**Deliverables**: 2 módulos 100% funcionales

---

## 📅 CRONOGRAMA DIARIO

### DÍA 1: Análisis + Diseño de BD

#### Mañana (T1-T3h)
```
1. Revisar struktur GNU Health Tryton
   □ Explorar health_obstetrics en /tryton/health_obstetrics/
   □ Revisar archivos: models.py, views.xml
   □ Listar tablas base: pregnancy, delivery, puerperium

2. Analizar estructura actual HOSIX
   □ Revisar tablas existentes en Supabase
   □ Entender RLS policies actuales
   □ Ver componentes React existentes (ASIS 2.0, 3.0)

3. Diseñar schema Obstetricia
   □ Crear file: docs/OBSTETRICS_SCHEMA.md
   □ Mapear entidades: Pregnancy → table
   □ Mapear relaciones: patient → pregnancy → delivery
```

#### Tarde (T3-T6h)
```
4. Diseñar schema CRED
   □ Crear file: docs/CRED_SCHEMA.md
   □ Mapear: patient → control_crecimiento → hito_desarrollo
   □ Incluir: vacunación, detección problemas

5. Definir Edge Functions necesarias
   □ obstetric_risk_calculator.ts
   □ pregnancy_gestational_age.ts
   □ who_growth_percentile.ts
   □ vaccination_next_dose.ts

Result: 2 archivos diseño + lista de functions
```

---

### DÍA 2-3: Migración SQL + BD

#### Ejecutar en Supabase

**PASO 1: Crear tablas Obstetricia**
```sql
-- Analizar: /SERMED2/tryton/copia_total_salud.sql
-- Buscar: pregnancy, delivery, puerperium tables
-- Adaptar: Estructura a Supabase + RLS

Próximo: crear migration 20260401_obstetrics.sql

Tablas a crear:
1. pregnancy
   - id UUID PRIMARY
   - patient_id UUID FK patient
   - gestational_age INT
   - fpp DATE (fecha probable de parto)
   - complications TEXT[]
   - status ENUM('ongoing', 'delivered', 'terminated')
   - created_at TIMESTAMP
   
2. delivery
   - id UUID PRIMARY
   - pregnancy_id UUID FK pregnancy
   - delivery_date TIMESTAMP
   - delivery_type ENUM('vaginal', 'cesarean', 'assisted')
   - anesthesia_type TEXT
   - complications TEXT[]
   - newborn_apgar INT
   
3. puerperium
   - id UUID PRIMARY
   - delivery_id UUID FK delivery
   - days_postpartum INT
   - healing_status TEXT
   - complications TEXT[]
   
RLS: Médicos ven sus pacientes, paciente ve propia info
```

**PASO 2: Crear tablas CRED**
```sql
Próximo: crear migration 20260402_cred.sql

Tablas:
1. growth_control
   - id, child_id, visit_date, weight, length, head_circumference
   - percentile_weight, percentile_length
   
2. developmental_milestone
   - id, child_id, age_months, milestone_name, status
   - (gross_motor, fine_motor, language, social)
   
3. vaccination_schedule
   - id, child_id, vaccine_name, scheduled_date, actual_date, batch_number
   - adverse_effects TEXT
   
4. problem_detection
   - id, child_id, age_months, problem_type, severity
   - referral_status
```

**PASO 2.5: Aplicar Migraciones**
```bash
# Terminal en SERMED2

supabase migration new obstetrics_tables
# (copiar SQL en nuevo archivo)

supabase migration up

# Verificar:
supabase db pull  # update types
npx typescript-check
```

**PASO 3: Crear RLS Policies**
```sql
-- Obstetrics
CREATE POLICY "Doctors see their pregnant patients"
  ON pregnancy FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_doctor WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "Pregnant patient sees own pregnancy"
  ON pregnancy FOR SELECT
  USING (patient_id = auth.uid());

-- Similar para CRED, delivery, puerperium

Result: RLS policies script listo para aplicar
```

---

### DÍA 4: Componentes React + Hooks

#### Frontend Development

**PASO 1: Crear componentes base OBSTETRICS**
```
Archivo: src/components/ASIS_04_Obstetricia/

1. GestationMonitor.tsx
   Props: {pregnancyId: string}
   - Display: gestational_age, FPP, risk alerts
   - Chart: crecimiento uterino
   - Actions: actualizar complicaciones

2. DeliveryForm.tsx
   Props: {pregnancyId: string, onSubmit}
   - Form: delivery_type, anesthesia, anesthesiologist
   - Newborn apgar score
   - Complications select
   - Save to DB

3. PostpartumCareForm.tsx
   Props: {deliveryId: string}
   - Days checklist: sutura, sangrado, infección
   - Alerts: si hemorragia postparto

4. ObstetricRiskAlert.tsx
   Props: {risk: number}
   - Color coded: <10% green, 10-30% yellow, >30% red
   - Clickable para ver detalles

5. PregnancyTimeline.tsx
   Props: {pregnancyId}
   - Visualización: etapas gestación
   - Eventos: controles, complicaciones
```

**PASO 2: Crear componentes base CRED**
```
Archivo: src/components/ASIS_05_CRED/

1. GrowthChart.tsx
   Props: {childId: string}
   - Integración: WHO growth curves (weight, height, PC)
   - Multiple series: percentiles 5, 25, 50, 75, 95
   - Marker points: cada control
   - Alert: si fuera de percentiles

2. MilestoneTracker.tsx
   Props: {childId, ageMonths}
   - Checklist: motricidad gruesa, fina, lenguaje, social
   - Status: logrado, esperado, retrasado
   - Guidance: actividades para mejorar

3. VaccinationSchedule.tsx
   Props: {childId}
   - Tabla: vacunas, edades programadas, aplicadas
   - Calendar: próximas vacunas
   - Alert: si vencida
   - PDF export: carné vakuna

4. DevelopmentQuiz.tsx
   Props: {childId, ageMonths}
   - Interactive: responder sobre hitos
   - Auto-save responses
   - Suggestions para especialista si desviación

5. ProblemDetection.tsx
   Props: {childId}
  - Screening: audición, visión, motor
   - Recommended actions
   - Referral button → especialista
```

**PASO 3: Custom Hooks**
```
Archivo: src/hooks/

1. useObstetricPatient.ts
   - Hook: fetchPregnancy, updatePregnancy
   - Estado: pregnancy data + complications
   - Cacheado con React Query

2. useCREDChild.ts
   - Hook: fetchGrowthData, getMilestones, getVaccinations
   - Calcula WHO percentiles on fly
   - Alerts automáticas

3. useObstetricRisk.ts
   - Hook: calculateRisk(pregnancy)
   - Usa edge function: obstetric_risk_calculator
   - Returns: riskScore, alerts[], recommendations[]

4. useWHOGrowth.ts
   - Hook: getPercentile(weight, height, age, sex)
   - Integra data WHO embedded
   - Returns: percentile, status, alert

5. useVaccinationSchedule.ts
   - Hook: getNextVaccines(childId, nextMonths)
   - Returns: scheduled vaccines, overdue
```

---

### DÍA 5: Edge Functions + Testing

#### PASO 1: Crear Edge Functions

```typescript
// supabase/functions/obstetric_risk_calculator/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { pregnancyId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY")
  );
  
  // Validate pregnancy
  const { data: pregnancy, error } = await supabase
    .from("pregnancy")
    .select("*")
    .eq("id", pregnancyId)
    .single();
  
  if (error) return new Response(JSON.stringify({ error }), { status: 400 });
  
  // Calculate risk factors
  let riskScore = 0;
  const risks = [];
  
  if (pregnancy.age > 35) {
    riskScore += 10;
    risks.push("Advanced maternal age");
  }
  
  if (pregnancy.complications?.length > 0) {
    riskScore += pregnancy.complications.length * 15;
    risks.push(`${pregnancy.complications.length} complications`);
  }
  
  if (pregnancy.gestational_age < 37) {
    riskScore += 20;
    risks.push("Preterm pregnancy");
  }
  
  return new Response(JSON.stringify({
    riskScore: Math.min(riskScore, 100),
    riskLevel: riskScore > 30 ? "high" : riskScore > 10 ? "medium" : "low",
    risks,
    recommendations: generateRecommendations(riskScore)
  }));
});
```

```typescript
// supabase/functions/who_growth_percentile/index.ts

serve(async (req) => {
  const { weight, height, age_months, sex } = await req.json();
  
  // Usar WHO data embedded (o API)
  const percentile = calculatePercentile(weight, height, age_months, sex);
  
  let status = "normal";
  if (percentile < 5) status = "failure_to_thrive";
  if (percentile > 95) status = "overweight";
  
  return new Response(JSON.stringify({
    percentile,
    status,
    alert: status !== "normal" ? `Growth ${status}` : null
  }));
});
```

#### PASO 2: Testing

**Unit Tests**
```bash
npm run test -- ASIS_04 ASIS_05

Test files:
✅ GestationMonitor.test.tsx
✅ DeliveryForm.test.tsx
✅ useObstetricRisk.test.ts
✅ GrowthChart.test.tsx
✅ VaccinationSchedule.test.tsx

Cobertura mínima: 80%
```

**E2E Tests**
```bash
npm run e2e -- --spec=tests/OBSTETRICS_FLOW.e2e.ts

Flows:
✅ Create pregnancy
✅ Update complications
✅ Record delivery
✅ Track postpartum
✅ CRED: Record growth
✅ CRED: Track milestones
✅ CRED: Vaccination schedule

Success: 20/20 tests ✅
```

---

## 🎬 EJECUTAR AHORA

### Paso 1: Preparar BD (30 min)
```bash
cd SERMED2

# 1. Crear migrations
touch supabase/migrations/20260401_obstetrics.sql
touch supabase/migrations/20260402_cred.sql

# 2. Copiar SQL structure de Tryton
# (revisar copia_total_salud.sql, adaptar tablas)

# 3. Apply migrations
supabase migration up

# 4. Pull schema
supabase db pull
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Paso 2: Crear componentes (2 horas)
```bash
# 1. Crear folders
mkdir -p src/components/ASIS_04_Obstetricia
mkdir -p src/components/ASIS_05_CRED
mkdir -p src/hooks/useObstetrics
mkdir -p src/hooks/useCRED

# 2. Scaffolding (template component)
# src/components/ASIS_04_Obstetricia/GestationMonitor.tsx

# 3. Repeat para otros componentes
```

### Paso 3: Crear Hooks (1 hora)
```bash
# src/hooks/useObstetricPatient.ts
# src/hooks/useCREDChild.ts
# src/hooks/useWHOGrowth.ts
# src/hooks/useVaccinationSchedule.ts
```

### Paso 4: Deploy Edge Functions (30 min)
```bash
supabase functions deploy obstetric_risk_calculator
supabase functions deploy who_growth_percentile
supabase functions deploy vaccination_next_dose
```

### Paso 5: Test (1 hora)
```bash
npm test -- --coverage ASIS_04 ASIS_05
npm run e2e
```

---

## 📋 CHECKLIST WEEK 1

**LUNES:**
- [ ] BD schema diseño (Obstetrics + CRED)
- [ ] Edge Functions lista de funciones

**MARTES-MIÉRCOLES:**
- [ ] Migraciones SQL creadas
- [ ] RLS policies aplicadas
- [ ] Types generados

**JUEVES:**
- [ ] 5 componentes React Obstetrics
- [ ] 5 componentes React CRED
- [ ] Hooks implementados

**VIERNES:**
- [ ] Edge Functions desplegadas
- [ ] Tests creaods (100% pass)
- [ ] Demo al team listo

---

## 🔗 REFERENCIAS RÁPIDAS

### Arquivos Clave
- **Plan Maestro**: PLAN_MAESTRO_GNU_HEALTH_IMPLEMENTACION.md
- **Tryton Obstetrics**: /tryton/health_obstetrics/
- **Tryton Pediatrics**: /tryton/health_pediatrics/
- **Tryton CRED**: /tryton/health_pediatrics_growth_charts_who/

### SQL Templates
```bash
# Ver estructura Tryton
grep -r "class Pregnancy" /tryton/health_obstetrics/
grep -r "table_name" /tryton/health_pediatrics/

# Adaptar a Supabase
# (PostgreSQL sintaxis, ADD RLS)
```

### Componentes Referencia
- Mirar ASIS 2.0 (Enfermería) para patrones
- Mirar ASIS 3.0 (Quirófanos) para formularios
- Copiar hooks existentes (usePatient, useHCE)

---

## 📞 CONTACTO SOPORTE

**Dudas SQL**: DB Specialist  
**Dudas React**: Frontend Lead  
**Dudas RLS**: Security Officer  

Slack: #hosix-week1-implementation

---

**GO! 🚀 Comienza en 5 minutos**
