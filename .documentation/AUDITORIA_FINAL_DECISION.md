# 🔴 AUDITORÍA FINAL: ESTADO REAL DE LA INFRAESTRUCTURA

**Fecha**: 15 Abril 2026  
**Nivel de Alerta**: 🔴 CRÍTICO

---

## 📊 REALIDAD ACTUAL

### Tablas en Supabase HOSIX-SERMED2
```
✅ electronic_health_record     (ASIS_13 - aplicada HOY)
✅ ehr_episode_links            (ASIS_13 - aplicada HOY)
✅ ehr_document_storage         (ASIS_13 - aplicada HOY)

❌ TODAS las demás tablas        (NO EXISTEN)
```

### Componentes React sin Soporte
| Módulo | Componente | Requiere | Status |
|--------|-----------|----------|--------|
| ADMIN_1 | PayrollManagement | payroll_processing | ❌ NO EXISTE |
| ADMIN_1 | StaffDirectory | staff_records | ❌ NO EXISTE |
| ADMIN_1 | SchedulingBoard | staff_schedules | ❌ NO EXISTE |
| ADMIN_2 | WaitingRoomDashboard | waiting_queue | ❌ NO EXISTE |
| ADMIN_2 | QueueManagementPanel | waiting_rooms | ❌ NO EXISTE |
| ASIS_04 | Obstetricia | pregnancy, delivery | ❌ NO EXISTE |
| ASIS_05 | CRED | hosix_cred_* | ❌ NO EXISTE |
| ASIS_08 | Laboratorio | hosix_laboratorio_* | ❌ NO EXISTE |
| ASIS_09 | Imagenología | hosix_imagenologia_* | ❌ NO EXISTE |
| ASIS_10 | Farmacia | hosix_farmacia_* | ❌ NO EXISTE |
| ASIS_11 | Interconsultas | hosix_interconsultas_* | ❌ NO EXISTE |

---

## 🔧 RAÍZ DEL PROBLEMA

### Problema 1: Migraciones NO Aplicadas
**Realidad**: Existen archivos SQL en `supabase/migrations/` pero NO fueron ejecutados en Supabase.

**Tenemos**:
- `migrations/002_admin_1_hr_schema.sql` ← SQL listo
- `migrations/003_admin_2_waiting_rooms_schema.sql` ← SQL listo
- `supabase/migrations/20260412_*.sql` ← SQL listo (ASIS_04-11)

**Pero**: Nunca se ejecutaron en Supabase

### Problema 2: Dependencias Circulares
**Migraciones dependen de tablas base** que tampoco existen:

```
migrations/002_admin_1_hr_schema.sql necesita:
  ├─ CREATE TABLE staff_records (hospital_id UUID)
  └─ ❌ Tabla `hospitals` no existe

migrations/003_admin_2_waiting_rooms_schema.sql necesita:
  ├─ FOREIGN KEY (hospital_id) REFERENCES hospitals
  ├─ FOREIGN KEY (patient_id) REFERENCES patients
  └─ ❌ Tablas base no existen
```

### Problema 3: Mixed Schema Names
Hay inconsistencia de nombres:

```
ANTIGUO (20250116_001):  hosix_departamentos, hosix_usuarios
NUEVO (002_admin_1):    staff_records, staff_positions
ASIS (20260412):        pregnancy, delivery
```

**Resultado**: Migraciones no pueden correr porque referencian tablas con nombres inconsistentes

---

## 🎯 SOLUCIÓN REQUERIDA

### OPCIÓN A: Crear Migración BASE COMPLETA (RECOMENDADO)
1. Crear `migrations/001_base_schema.sql` con TODAS las tablas base:
   - hospitals
   - patients
   - users (wrapper de auth.users)
   - clinics
   - physician
   - staff (etc)

2. Aplicar en este orden:
   ```
   001_base_schema.sql
   → 002_admin_1_hr_schema.sql
   → 003_admin_2_waiting_rooms_schema.sql
   → 20260412_001_create_obstetrics_tables.sql
   → ... (todas las demás)
   ```

### OPCIÓN B: Normalizar todas las migraciones (LARGO)
1. Reescribir todas las migraciones para usar nombres consistentes
2. Resolver todas las FOREIGN KEY dependencies
3. Aplicar en orden correcto

---

## 🔴 BLOCKERS

| Blocker | Impacto | Solución |
|---------|---------|----------|
| No exists `hospitals` table | ❌ BLOQUEA todo | Crear 001_base_schema |
| No exists `patients` table | ❌ BLOQUEA ADMIN_2, ASIS | Crear 001_base_schema |
| FDW no configurado | ⚠️ RENAPROSA sync pendiente | Después (no bloquea) |
| Build error (HospitalContext) | ⚠️ npm run build falla | YA RESUELTO (caché) |

---

## 📋 DECISION POINT

**¿Qué hacemos?**

### OPCIÓN 1: RÁPIDO (Recomendado)
```
1. ✅ Crear migrations/001_base_schema.sql (tablas base)
2. ✅ Aplicar TODO de una vez:
   - 001_base_schema
   - 002_admin_1
   - 003_admin_2
   - Todas las ASIS_* migrations
3. ✅ Verificar build pasa sin errores
4. 🚀 DONE - Todos los módulos funcionales
```

**Tiempo**: ~1-2 horas  
**Complejidad**: Media

### OPCIÓN 2: MANUAL (Lento)
```
1. Crear tablas base manualmente en Supabase UI
2. Ejecutar cada migración manualmente (copiar-pegar SQL)
3. Actualizar imports en componentes si cambian nombres
4. Test cada módulo uno a uno
```

**Tiempo**: ~4-6 horas  
**Complejidad**: Alta

### OPCIÓN 3: SKIP (NO RECOMENDADO)
```
- Continuar solo con ASIS_13 (que YA funciona)
- Los demás módulos quedan "dead code"
- Riesgo: Componentes React sin BD subyacente
```

**Riesgo**: 🔴 MUY ALTO

---

## ✅ RECOMENDACIÓN FINAL

**→ OPCIÓN 1: RÁPIDO**

**Pasos**:
1. Yo creo → `migrations/001_base_schema.sql` (tablas base)
2. Yo aplico → Todas las migraciones con MCP Supabase
3. You verify → npm run build (0 errors?)
4. Result → Todas las tablas + hooks + Edge Functions = FUNCIONAL

**¿Continuamos?** SÍ/NO
