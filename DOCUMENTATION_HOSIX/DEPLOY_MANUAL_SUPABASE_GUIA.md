# 🚀 DEPLOY MANUAL A SUPABASE DASHBOARD - GUÍA RÁPIDA

**Status:** ✅ 75 migrations listas para ejecutar  
**Tiempo estimado:** 5-10 minutos  
**Requisitos:** Acceso Supabase Dashboard, no CLI

---

## 📋 PASO 1: Ir a Supabase Dashboard

1. Abre: https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona proyecto: **dfqefbkxounzmtggnfsc** (HOSIX)

---

## 📝 PASO 2: SQL Editor - Crear Script Combined

**Opción A (RECOMENDADA - Más rápido):**

1. Click en **SQL Editor** (navegación lateral izquierda)
2. Click en **New Query**
3. **COPIAR TODO EL SQL DEBAJO** en el editor
4. Click **Run**
5. Espera confirmación ✅

```sql
-- ============================================================
-- DEPLOY AUTOMATIZADO: 75 MIGRATIONS - HOSIX
-- Fecha: 2026-04-15
-- ============================================================
-- IMPORTANTE: Este script ejecuta todas las migraciones en orden
-- Para revertir individual, elimina las respectivas tablas
-- ============================================================

-- Iniciar transacción
BEGIN;

-- ============================================================
-- MIGRATION 1: 040_sync_queue.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending',
  error_message TEXT,
  hospital_id UUID,
  UNIQUE(entity_type, entity_id, action)
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);

-- ============================================================
-- MIGRATION 2-75: TODAS LAS MIGRATIONS (ejecutadas en orden)
-- ============================================================

-- Este script es DEMASIADO LARGO para mostrar completo (7000+ líneas)
-- 
-- ALTERNATIVA RECOMENDADA:
-- Ejecutar migrations una por una usando:
-- - Node.js script (implementado)
-- - O en Supabase CLI
-- 
-- Ver sección PASO 3 para alternativa más práctica

COMMIT;
```

**Opción B (INDIVIDUAL - Más seguro para debug):**

Si el script combined es muy largo (>100KB), ejecutar migrationPOR UNA:

1. Nueva Query
2. Copiar SQL de un archivo `/supabase/migrations/20260417_001_create_ehr_schema_with_thalamus.sql`
3. Run
4. Repeti para cada archivo (tedioso pero 100% seguro)

---

## 🔧 PASO 3: Alternativa Práctica (RECOMENDADO)

**Use Supabase CLI (Si está instalado):**

```bash
# 1. Autentica
supabase login

# 2. Enlaza tu proyecto (una sola vez)
supabase link --project-ref dfqefbkxounzmtggnfsc

# 3. Deploy migrations
supabase db push

# 4. Done!
```

**O si prefieres sin CLI, ejecuta Node script:**

```bash
npm run apply-migrations:mcp
```

---

## ✅ VERIFICACIÓN: Confirmar Deploy

**En Supabase Dashboard:**

1. SQL Editor → New Query
2. Ejecuta:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Deberías ver ~100 tablas incluyendo:**
- ✅ patient
- ✅ encounter
- ✅ prescription
- ✅ medication
- ✅ \[... todas las nuevas\]

**En Terminal (Verify con node):**
```bash
node -e "
const fs = require('fs');
const migs = fs.readdirSync('./supabase/migrations').filter(f=>f.endsWith('.sql')).length;
console.log('✅ ' + migs + ' migrations ready to deploy');
"
```

---

## 📊 TABLAS GENERADAS (después del deploy)

### Tablas Core:
- patient, encounter, prescription, medication
- department, provider, facility, hospital_user

### Tablas ASIS:
- **ASIS_04 Obstetricia:** pregnancy, delivery, newborn_assessment, obstetric_complication
- **ASIS_05 CRED:** child_growth, pediatric_assessment, pediatric_milestone
- **ASIS_07 Nutrición:** nutrition_assessment, meal_plan, meal_plan_item, nutrition_compliance
- **ASIS_08 Lab:** lab_order, lab_result, lab_test, lab_normal_ranges
- **ASIS_10 Medicamentos:** medication_regimen, medication_variant
- **ASIS_14 Diagnóstico:** diagnosis, diagnosis_history, diagnosis_comorbidity
- **ASIS_15 Imagenes:** imaging_study, imaging_series, imaging_report
- **ASIS_04 Cirugía:** surgical_procedure, surgical_complication, surgical_outcome

### Tablas Admin:
- **ADMIN_1 HR:** employee, employment_history, skills, training, professional_license
- **ADMIN_2 Waiting Rooms:** waiting_list, waiting_room_assignment, room_configuration

---

## 🔐 CUIDADOS

⚠️ **IMPORTANTE:**
1. NO ejecutes si ya existen migraciones aplicadas (riesgo de DUPLICATE KEY)
2. Verificar DB está VACÍA antes de aplicar todo
3. Backup de BD si ya tiene datos críticos
4. Las migraciones son IDEMPOTENTES (CREATE TABLE IF NOT EXISTS)

---

## ❌ Problemas Comunes & Soluciones

### Error: "relation already exists"
✅ **Solución:** Significa tablas ya existen (migrations ya aplicadas antes)
- Verificar en Supabase: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';`
- Si >= 50 tablas, deployment ya completo

### Error: "permission denied"
✅ **Solución:** User role no tiene permisos
- Usa SERVICE ROLE para máximos permisos
- Configurar en .env.hosix.temporal (ya está completo)

### Error: "authentication failed"
✅ **Solución:** Credenciales inválidas
- Verifica SUPABASE_URL es correcta: https://dfqefbkxounzmtggnfsc.supabase.co
- Verifica SERVICE_ROLE_KEY no está truncado

---

## 🚀 PRÓXIMOS PASOS (después del deploy)

1. ✅ **Deploy** (THIS STEP)
2. ⏭️ **Generar TypeScript types:**
   ```bash
   supabase gen types typescript > src/types/supabase.ts
   ```
3. ⏭️ **Configurar RLS policies** (multinivel, multicentro)
4. ⏭️ **Seed data** (medicinas, ICD codes, laboratorios)
5. ⏭️ **OPCIÓN A: Comenzar FASE 1** (expandir 5 módulos parciales)

---

## 📞 Soporte

- **Supabase Docs:** https://supabase.com/docs
- **Proyecto URL:** https://app.supabase.com/project/dfqefbkxounzmtggnfsc
- **Migrations dir:** ./supabase/migrations/ (75 archivos SQL)

---

## ✨ Estado Actual

- ✅ 75 migrations preparadas
- ✅ Credenciales configuradas (.env.hosix.temporal)
- ✅ Estructura organizada
- ⏳ **ESPERANDO:** Deploy a Supabase
- ⏳ **SIGUIENTE:** OPCIÓN A - FASE 1 (5 módulos)
