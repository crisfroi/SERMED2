# 🏗️ INTEGRACIÓN CROSS-PROJECT SUPABASE: RENAPROSA ↔ HOSIX

**Documento Maestro**  
**Fecha:** 15 de Abril, 2026  
**Estado:** DESIGN PHASE  
**Autor:** AI Análisis Exhaustivo  

---

## 📑 TABLA DE CONTENIDOS

1. [Contexto del Problema](#contexto)
2. [Arquitectura Actual](#arquitectura-actual)
3. [Tres Opciones de Integración](#opciones)
4. [Recomendación Final](#recomendación)
5. [Plan de Implementación](#plan)

---

## <a name="contexto"></a>🎯 CONTEXTO DEL PROBLEMA

### Objetivo
Conectar dos proyectos Supabase en la **misma organización**:
- **RENAPROSA**: Base de Datos Nacional de Profesionales Sanitarios
- **HOSIX**: Sistema Hospitalario Modular (ADMIN_1, ADMIN_2, ASIS_13+)

### Necesidades Específicas
```
RENAPROSA              HOSIX (Hospital Local)
┌──────────────────┐   ┌──────────────────┐
│ profesionales    │───│ empleados        │  (READ en RENAPROSA)
│ (licencia, etc)  │   │ medicos          │  Mostrar profesionales del hospital
└──────────────────┘   └──────────────────┘
                   
┌──────────────────┐   ┌──────────────────┐
│ especialidades   │───│ departamentos     │  (READ en RENAPROSA)
│ (datos maestros) │   │                  │  Mantener sincronizado
└──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐
│ centros_salud    │───│ hospitales       │  (READ en RENAPROSA)
│ (all Ecuador)    │   │ (solo este)      │  Filtro por hospital local
└──────────────────┘   └──────────────────┘
```

### Restricciones
- ✅ **Objetivo**: Evitar duplicación de datos de RENAPROSA en HOSIX
- ✅ **NO sobrecargues** la BD de RENAPROSA con datos transaccionales de HOSIX
- ✅ Los datos transaccionales de HOSIX (facturas, pacientes, etc.) quedan en HOSIX
- ✅ Los datos maestros (profesionales, especialidades) vienen de RENAPROSA (READ-ONLY)

---

## <a name="arquitectura-actual"></a>⚙️ ARQUITECTURA ACTUAL

### Supabase Organization
```
Supabase Org: "GEPROSTEC"
│
├─ Proyecto 1: RENAPROSA
│  ├─ DB: rena_produccion (AWS)
│  ├─ Tablas maestras: profesionales_sanitarios, centros_salud, especialidades
│  ├─ RLS: habilitado (por licencia de profesional)
│  ├─ Auth: Service Role Key disponible
│  └─ Versión: v1 (30+ migrations)
│
└─ Proyecto 2: HOSIX-SERMED2
   ├─ DB: hosix_produccion (AWS)
   ├─ Tablas transaccionales: pacientes, citas, facturas, etc.
   ├─ Tablas maestras (locales): dispositivos, departamentos
   ├─ RLS: habilitado
   ├─ Auth: JWT tokens propios
   └─ Versión: v2 (50+ migrations)
```

### Proyectos Separados = Desafío
- ❌ No se puede hacer `JOIN` directo SQL entre proyectos
- ❌ No hay `FOREIGN KEY` entre proyectos
- ❌ RLS de un proyecto NO aplica al otro
- ❌ Service roles diferentes

### Datos Actualmente en Ambos Proyectos (DUPLICACIÓN)
```json
{
  "Tabla en RENAPROSA": "profesionales_sanitarios",
  "Tabla en HOSIX": "profesionales_sanitarios",
  "Status": "❌ DUPLICADOS, desincronizados"
}
{
  "Tabla en RENAPROSA": "centros_salud",
  "Tabla en HOSIX": "centros_salud (copia local)",
  "Status": "❌ DUPLICADOS, no siempre actualizado"
}
{
  "Tabla en RENAPROSA": "especialidades",
  "Tabla en HOSIX": "especialidades (copia local)",
  "Status": "❌ DUPLICADOS, riesgo de inconsistencia"
}
```

---

## <a name="opciones"></a>🔄 TRES OPCIONES DE INTEGRACIÓN

### OPCIÓN 1: WEBHOOKS EVENT-DRIVEN (Pub/Sub)
```
                 RENAPROSA Database
                 ┌────────────────────┐
                 │  Cambio en tabla    │
                 │ profesionales_      │
                 │ sanitarios          │
                 └──────────┬──────────┘
                           │
                    [Database Trigger]
                           │
                    [Webhook POST]
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
      Edge              Edge             Edge
    Function A        Function B      Function C
    (INSERT)          (UPDATE)         (DELETE)
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                 ┌─────────▼──────────┐
                 │ HOSIX Database     │
                 │ Sync Table         │
                 │ profesionales_sync │
                 └────────────────────┘
```

**Cómo Funciona:**
1. Alguien modifica `profesionales_sanitarios` en RENAPROSA
2. Trigger en BD → dispara webhook HTTP POST
3. Webhook llama a Edge Function en HOSIX
4. Edge Function valida, transforma, inserta en tabla sync
5. HOSIX lee desde tabla sync (no directo de RENAPROSA)

### OPCIÓN 1A: Webhooks Síncronos (Supabase Realtime)
```
Cliente HOSIX (React)
       │
       │ subscribe()
       │
    ┌──▼─────────────────────┐
    │ Realtime Channel        │
    │ "renaprosa_sync"        │
    └──▲─────────────────────┘
       │
    Supabase Realtime DB (RENAPROSA)
    ┌──────────────────────────┐
    │ Broadcast cambios en     │
    │ profesionales_sanitarios │
    └──────────────────────────┘
```

**Ventajas de Opción 1:**
- ✅ Bajo acoplamiento
- ✅ Fácil de escalar
- ✅ RENAPROSA no sabe de HOSIX
- ✅ Fácil de revertir

**Desventajas:**
- ⚠️ Latencia: cambios llegan ~2-5 segundos después
- ⚠️ Necesita tabla "sync" en HOSIX (copia local)
- ⚠️ Riesgo de pérdida si Edge Function falla
- ⚠️ Debe implementar reintentos y DLQ

**Complejidad:** ⭐⭐ (Baja-Media)
**Latencia:** ~2-5 segundos
**Costo:** 💰💰 (Edge Functions + Storage búsquedas)

---

### OPCIÓN 2: FOREIGN DATA WRAPPERS (FDW) - Postgres
```
┌─────────────────────────────────────┐
│ HOSIX-SERMED2 (Postgres)            │
│                                     │
│  CREATE FOREIGN DATA WRAPPER        │
│  renaprosa_fdw                      │
│    SERVER renaprosa_prod            │
│    OPTIONS (...)                    │
│                                     │
│  CREATE FOREIGN TABLE               │
│  profesionales_rena (               │
│    LIKE profesionales_sanitarios    │
│  )                                  │
│    SERVER renaprosa_prod            │
│                                     │
│  SELECT * FROM profesionales_rena   │◄─── Lee directamente RENAPROSA
│  WHERE licencia = ?                 │
└─────────────────────────────────────┘
         │
         │ (SSH Tunnel o dirección DB)
         │
    ┌────▼──────────────────────┐
    │ RENAPROSA BD              │
    │ profesionales_sanitarios  │
    └───────────────────────────┘
```

**Cómo Funciona:**
1. Configure FDW en HOSIX apuntando a RENAPROSA
2. Cree FOREIGN TABLE con esquema de RENAPROSA
3. Query SQL normal: `SELECT * FROM profesionales_rena`
4. Postgres traduce a conexión remota automáticamente

**Ventajas:**
- ✅ Cero duplicación de datos
- ✅ Datos siempre frescos (real-time)
- ✅ SQL estándar, sin cambios en la aplicación
- ✅ Transacciones distribuidas posibles
- ✅ **RECOMENDADO para READ-ONLY**

**Desventajas:**
- ⚠️ Requiere zona de red (SSH, bastion host, o IGW en AWS)
- ⚠️ Performance: más lento que tabla local (~50-200ms vs <5ms)
- ⚠️ No soporta UPDATE directo (solo SELECT)
- ⚠️ RLS de RENAPROSA NO se aplica automáticamente
- ⚠️ Configuración inicial compleja

**Complejidad:** ⭐⭐⭐ (Media-Alta)
**Latencia:** ~50-200ms por query
**Costo:** 💰 (poco, solo conexión DB)

---

### OPCIÓN 3: EDGE FUNCTIONS + POLLING (Cron)
```
┌─────────────────────────────────┐
│ HOSIX Edge Function (Cron Job)  │
│                                 │
│ every hour:                     │
│  SELECT * FROM                  │
│  renaprosa.profesionales_       │
│  sanitarios                     │
│  WHERE updated_at > last_sync   │
│                                 │
│  UPSERT INTO hosix.prof_sync    │
└─────────────────────────────────┘
         │
    (repeat cada hora)
         │
         ▼
┌─────────────────────────────┐   ┌──────────────────────┐
│ RENAPROSA DB                │   │ HOSIX DB             │
│ (fuente de verdad)          │   │ (copia sincronizada) │
└─────────────────────────────┘   └──────────────────────┘
```

**Cómo Funciona:**
1. Edge Function se ejecuta según cronograma (hver 1 hora)
2. Se conecta a RENAPROSA via service role
3. Obtiene registros modificados desde `last_sync_timestamp`
4. UPSERT en tabla local de HOSIX
5. Registra timestamp de sincronización

**Ventajas:**
- ✅ Sin webhooks (sin deuda técnica)
- ✅ Proceso controlado y transaccional
- ✅ Fácil de monitorear y debuggear
- ✅ Reintentos nativo en Supabase Cron
- ✅ No requiere configuración de red especial

**Desventajas:**
- ⚠️ Latencia máxima: intervalo de cron (hasta 1 hora)
- ⚠️ Requiere timestamp `updated_at` en RENAPROSA (puede no existir)
- ⚠️ Consume Edge Function credits
- ⚠️ Copia local ocupa storage

**Complejidad:** ⭐⭐ (Baja-Media)
**Latencia:** ~1 segundo a 1 hora (según agenda)
**Costo:** 💰💰💰 (Edge Functions + credits)

---

## <a name="recomendación"></a>✅ RECOMENDACIÓN FINAL

### **USAR: Opción 2 (FDW) PARA DATOS MAESTROS + Opción 3 (Polling) PARA SINCRONIZACIÓN LOCAL**

```
Arquitectura Híbrida RECOMENDADA:
┌─────────────────────────────────────────────────┐
│ HOSIX Front-end (React)                         │
│                                                 │
│  ├─ Tab "Médicos": SELECT FROM profesionales   │
│  │  └─ (si no está en caché local)             │
│  └─ muestra dato real-time de RENAPROSA        │
└─────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
[FDW          [Cache
 Query]       Local]

┌──────────────────────┐   ┌──────────────────────┐
│ HOSIX DB             │   │ RENAPROSA DB         │
│                      │   │                      │
│ profesionales_caché  │   │ profesionales_       │
│ (opcional)           │◄──│ sanitarios (FDW)     │
│                      │   │                      │
└──────────────────────┘   └──────────────────────┘
```

### ¿Por Qué Esta Combinación?

| Criterio | FDW | Polling | Webhooks |
|----------|-----|---------|----------|
| Real-time | ✅ Sí | ⚠️ No | ✅ Sí |
| Sin duplicación | ✅ Sí | ❌ No | ❌ No |
| Actualizaciones RENAPROSA | ✅ Automático | ⚠️ Por schedule | ✅ Automático |
| Complejidad red | ⚠️ Alta | ✅ Baja | ✅ Baja |
| RENAPROSA desacoplada | ✅ Sí | ✅ Sí | ⚠️ No |
| **PUNTUACIÓN** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐** | **⭐⭐⭐⭐** |

### **USAR PRINCIPALMENTE: FDW**
- Para lectura de profesionales en tiempo real
- Para consultas dinámicas desde HOSIX
- Configurar una sola vez, luego transparente

### **USAR COMO BACKUP: Polling (Opción 3)**
- Para mantener caché local si FDW lento
- Para logs de auditoría y análisis
- Para datos que no cambian frecuente

### **EVITAR: Webhooks**
- Añaden deuda técnica
- Riesgo de desincronización
- Más complicado de debuggear

---

## <a name="plan"></a>📋 PLAN DE IMPLEMENTACIÓN (4 FASES)

### FASE 1: Configuración de Red (Week 1)
**Tiempo: 1-2 días**

1. **Permitir acceso entre proyectos Supabase**
   ```bash
   # En Supabase:
   # 1. Ir a Settings → Database → Network
   # 2. Añadir IP de HOSIX RDS al allowlist de RENAPROSA
   # 3. Tomar nota de connection string RENAPROSA (sin password visible)
   ```

2. **Crear usuario de sincronización en RENAPROSA**
   ```sql
   -- En RENAPROSA:
   CREATE USER fdw_user WITH PASSWORD '${SECURE_PASSWORD}';
   GRANT SELECT ON profesionales_sanitarios TO fdw_user;
   GRANT SELECT ON centros_salud TO fdw_user;
   GRANT SELECT ON especialidades TO fdw_user;
   GRANT USAGE ON SCHEMA public TO fdw_user;
   ```

3. **Almacenar credenciales en HOSIX**
   ```
   Supabase Secrets (HOSIX):
   RENAPROSA_DB_HOST = "...rds.amazonaws.com"
   RENAPROSA_DB_PORT = 5432
   RENAPROSA_DB_NAME = "rena_produccion"
   RENAPROSA_DB_USER = "fdw_user"
   RENAPROSA_DB_PASSWORD = "..." (guardar en vault)
   ```

---

### FASE 2: Configurar FDW en HOSIX (Week 1-2)
**Tiempo: 1 día**

1. **Crear Foreign Data Wrapper**
   ```sql
   -- En HOSIX (como superusuario):
   CREATE EXTENSION IF NOT EXISTS postgres_fdw;
   
   CREATE SERVER renaprosa_server
     FOREIGN DATA WRAPPER postgres_fdw
     OPTIONS (
       host '${RENAPROSA_DB_HOST}',
       port '5432',
       dbname '${RENAPROSA_DB_NAME}'
     );
   ```

2. **Crear Foreign Tables**
   ```sql
   -- En HOSIX:
   IMPORT FOREIGN SCHEMA public
     LIMIT TO (profesionales_sanitarios, centros_salud, especialidades)
     FROM SERVER renaprosa_server
     INTO renaprosa_fdw;
   
   -- Ahora puedes:
   SELECT * FROM renaprosa_fdw.profesionales_sanitarios
   WHERE licencia = '12345';
   ```

3. **Validar Conexión**
   ```sql
   -- Query de prueba:
   SELECT COUNT(*) as total_profesionales 
   FROM renaprosa_fdw.profesionales_sanitarios;
   
   -- Debe retornar cantidad sin errores
   ```

---

### FASE 3: actualizar App HOSIX (Week 1-2)
**Tiempo: 1-2 días**

1. **Actualizar Hooks de React**
   ```typescript
   // useStaffDirectory.ts
   export const useStaffDirectory = () => {
     return useQuery({
       queryKey: ['staff-directory'],
       queryFn: async () => {
         // ANTES: leyó de copia local
         // AHORA: Lee de FDW en tiempo real
         const { data, error } = await supabase
           .from('staff_directory_view')  // Vista que reads from FDW
           .select('*')
           .eq('centro_salud_id', currentHospital.id);
         
         if (error) throw error;
         return data;
       }
     });
   };
   ```

2. **Crear Vistas SQL que Usen FDW**
   ```sql
   -- En HOSIX, crear VISTA que oculte complejidad:
   CREATE VIEW staff_directory_view AS
     SELECT 
       id,
       nombre,
       apellidos,
       licencia,
       especialidad,
       centro_salud_id
     FROM renaprosa_fdw.profesionales_sanitarios
     WHERE activo = true;
   
   -- Ahora la app simplemente SELECT * FROM staff_directory_view
   ```

3. **Remover tablas locales redundantes**
   ```sql
   -- Solo DESPUÉS de validar que FDW funciona:
   DROP TABLE IF EXISTS profesionales_sanitarios;
   DROP TABLE IF EXISTS especialidades;
   ```

---

### FASE 4: Polling Opcional (Week 2)
**Tiempo: 1 día (opcional)**

Si FDW es lento, mantener caché local:

```typescript
// Edge Function HOSIX (Cron: cada hora)
import { createClient } from '@supabase/supabase-js'

const renaprosaClient = createClient(
  process.env.RENAPROSA_URL,
  process.env.RENAPROSA_SERVICE_ROLE
)
const hosixClient = createClient(
  process.env.HOSIX_URL,
  process.env.HOSIX_SERVICE_ROLE
)

export default async (req: Request) => {
  try {
    // 1. Get datos from RENAPROSA
    const { data: profesionales, error } = await renaprosaClient
      .from('profesionales_sanitarios')
      .select('*')
      .gt('updated_at', req.headers.get('last-sync') || '2020-01-01')
    
    if (error) throw error
    
    // 2. UPSERT en HOSIX cache
    const { error: upsertError } = await hosixClient
      .from('prof_cache_local')
      .upsert(profesionales, { onConflict: 'id' })
    
    if (upsertError) throw upsertError
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: profesionales.length 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### RLS (Row Level Security)
```sql
-- En HOSIX, para Views que usan FDW:
ALTER TABLE renaprosa_fdw.profesionales_sanitarios 
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_their_hospital_staff"
  ON renaprosa_fdw.profesionales_sanitarios
  FOR SELECT
  USING (
    centro_salud_id = (
      SELECT hospital_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );
```

### Auditoría Cruzada
```sql
-- Registrar accesos a RENAPROSA desde HOSIX:
CREATE TABLE audit_cross_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  table_name VARCHAR(255),
  record_count INT,
  accessed_at TIMESTAMP DEFAULT NOW(),
  query_hash VARCHAR(64)
);
```

---

## 💾 MIGRACIONES REQUERIDAS

```sql
-- Archivo: migrations/999_fdw_integration.sql

-- 1. Crear extensión (ya debería estar en Supabase)
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Crear servidor remoto
CREATE SERVER renaprosa_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'renaprosa-db.rds.amazonaws.com',
    port '5432',
    dbname 'rena_produccion'
  );

-- 3. User mapping
CREATE USER MAPPING FOR service_role
  SERVER renaprosa_server
  OPTIONS (user 'fdw_user', password 'VAULT[renaprosa_password]');

-- 4. Import tables
IMPORT FOREIGN SCHEMA public
  LIMIT TO (
    profesionales_sanitarios,
    centros_salud,
    especialidades,
    departamentos,
    servicios
  )
  FROM SERVER renaprosa_server
  INTO renaprosa_fdw;

-- 5. Crear vistas para la app
CREATE VIEW v_staff AS
  SELECT * FROM renaprosa_fdw.profesionales_sanitarios
  WHERE activo = true;

CREATE VIEW v_centers AS
  SELECT * FROM renaprosa_fdw.centros_salud
  WHERE active = true;
```

---

## 🎯 TIMELINE RECOMENDADO

```
Week 1:
  Day 1: Configurar red + FDW
  Day 2-3: Validar conectividad
  
Week 2:
  Day 1-2: Actualizar componentes React
  Day 3-4: Testing exhaustivo
  Day 5: Deploy a staging
  
Week 3:
  Day 1-2: Validación en staging
  Day 3-4: Polling setup (opcional)
  Day 5: Deploy a producción
```

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| FDW lento | Media | Medio | Caché local + polling |
| Firewall bloquea | Baja | Alto | Validar antes (ping, telnet) |
| Credenciales comprometidas | Baja | Alto | Rotate user FDW, auditar accesos |
| RLS no funciona | Baja | Alto | Validar políticas en staging |
| Desincronización datos | Media | Medio | Polling + checksums |

---

## 📊 MONITOREO POST-IMPLEMENTACIÓN

```sql
-- Tabla de monitoreo:
CREATE TABLE fdw_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name VARCHAR(255),
  execution_time_ms FLOAT,
  rows_affected INT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar después de cada query:
INSERT INTO fdw_performance (query_name, execution_time_ms, rows_affected, status)
VALUES ('get_professionals', 145, 250, 'success');
```

---

## ✅ PRÓXIMOS PASOS

1. **Confirmar con DevOps**: ¿Se puede permitir acceso entre RDS?
2. **Crear usuario FDW** en RENAPROSA
3. **Configurar FDW** en HOSIX
4. **Validar queries** con datos reales
5. **Actualizar componentes**
6. **Deploy staging → producción**

---

**Documento generado por**: AI Analysis (Copilot)  
**Requiere revisión por**: Database Architect + Security Team
