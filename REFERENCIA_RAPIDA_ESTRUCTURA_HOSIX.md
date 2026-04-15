# 🎯 GUÍA RÁPIDA DE REFERENCIA: ESTRUCTURA HOSIX + MIGRACIONES

**Preparado para:** Team GEPROSTEC  
**Fecha:** 15 de Abril, 2026  
**Status:** LISTOS PARA IMPLEMENTAR  

---

## ✅ LO QUE EXISTE (NO MOVER, USAR)

### Módulos Completamente Funcionales

```
ADMIN_1: Recursos Humanos (HR Management)
├── src/components/ADMIN_1_HR/
│   ├── HRDashboard.tsx ✅
│   ├── PayrollManagement.tsx ✅
│   ├── StaffDirectory.tsx ✅
│   ├── ReportsAndAnalytics.tsx ✅
│   └── SchedulingBoard.tsx ✅
└── Documentación: DOCUMENTATION_UNIFIED/WEEK_11_ADMIN_1_*.md

ADMIN_2: Salas de Espera (Queue Management)
├── src/components/ADMIN_2_WAITING_ROOMS/
│   ├── WaitingRoomDashboard.tsx ✅
│   ├── PatientWaitingScreen.tsx ✅
│   ├── QueueManagementPanel.tsx ✅
│   ├── RoomConfigurationPage.tsx ✅
│   └── QueueAnalyticsReport.tsx ✅
└── Documentación: DOCUMENTATION_UNIFIED/WEEK_14_FACTURACION_DELIVERY.md

ASIS_13: Historia Médica Electrónica
├── src/components/ASIS_13_EHR/
│   ├── ElectronicHealthRecordDashboard.tsx ✅
│   ├── ResumenClinico.tsx ✅
│   ├── DocumentStorage.tsx ✅
│   ├── EHRTimeline.tsx ✅
│   └── AuditLog.tsx ✅
└── Documentación: ASIS_13_DELIVERY_COMPLETE.md

ASIS_04-15: Módulos Clínicos (14 módulos)
├── ASIS_04_Obstetricia ✅
├── ASIS_05_CRED ✅
├── ASIS_07_Nutricion ✅
├── ... (11 más)
└── Cada uno en src/components/ASIS_*/

ASISTENCIA: Control de Asistencia Biométrica
├── src/components/asistencia/
│   ├── AsistenciaDashboard.tsx ✅
│   ├── CuadrantesPanel.tsx ✅
│   ├── DispositivosPanel.tsx ✅
│   ├── FichajesList.tsx ✅
│   └── ... (9 más)
└── WORKING / FUNCIONAL
```

### Contextos Disponibles

```javascript
// ✅ Usar estos siempre:
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/contexts/HospitalContext';

// Proporcionan:
const { user, userRole, login, logout } = useAuth();
const { currentHospital, professionals, loadProfessionals } = useHospital();
```

---

## ⚠️ TABLAS FALTANTES EN SUPABASE (ACCIÓN URGENTE)

**Estas 4 tablas deben crearse ANTES de usar los módulos:**

### 1️⃣ electronic_health_record (CRÍTICA)
```
Módule: ASIS_13 (Historia Médica)
Archivo SQL: MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md
Prioridad: 🔴 MÁXIMA - Bloquea ASIS_13
```

### 2️⃣ ehr_episode_links
```
Módulo: ASIS_13 (Timeline)
Archivo SQL: MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md
Prioridad: 🟠 ALTA - Útil para línea de tiempo
```

### 3️⃣ ehr_document_storage
```
Módulo: ASIS_13 (Almacenamiento de documentos)
Archivo SQL: MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md
Prioridad: 🟠 ALTA - Para adjuntos
```

### 4️⃣ cuadrantes_maestros
```
Módulo: ASISTENCIA (Turnos biométricos)
Archivo SQL: MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md
Prioridad: 🟠 ALTA - Para gestión de cuadrantes
```

**ACCIÓN:** Copiar SQL desde `MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md` y ejecutar en Supabase SQL Editor.

---

## 🔄 INTEGRACIONES CROSS-PROJECT (RENAPROSA ↔ HOSIX)

### Problema: Duplicación de Datos

```
❌ ANTES (problema):
RENAPROSA:              HOSIX:
profesionales_          profesionales_
sanitarios              sanitarios (copia local)
└─ DESINCRONIZADOS ────────┘

✅ DESPUÉS (recomendado):
RENAPROSA:              HOSIX:
profesionales_          (Lee via FDW - Real-time)
sanitarios ─────────────┘
└─ ÚNICA VERSIÓN
```

### Solución Recomendada: Foreign Data Wrapper (FDW)

**Archivo:** `INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md`

**Resumen:**
- 📊 HOSIX lee datos maestros de RENAPROSA en tiempo real
- 🔒 No hay duplicación
- ⚡ RLS funciona correctamente
- 🛠️ Requiere 1-2 días de configuración

**Tablas que necesitan sincronización:**
```
RENAPROSA ────► HOSIX (via FDW)
├─ profesionales_sanitarios
├─ centros_salud
├─ especialidades
└─ departamentos
```

**Próximos pasos:**
1. Permitir acceso entre BD (DevOps)
2. Crear usuario FDW en RENAPROSA
3. Configurar FDW en HOSIX (SQL)
4. Actualizar React hooks
5. Deploy y test

---

## 📊 ESTADO DE MÓDULOS

### Completamente Listo
```
✅ ADMIN_1_HR - Recursos Humanos
✅ ADMIN_2_WAITING - Colas & Salas
✅ ASIS_04 a ASIS_15 - Módulos Clínicos
✅ ASISTENCIA - Control Biométrico
✅ Componentes Base (hosix, Layout, etc)
✅ AuthContext, HospitalContext
```

### Listo con Mitigaciones
```
⚠️ ASIS_13_EHR - Requiere 3 tablas SQL (ver migraciones)
⚠️ ASISTENCIA - Requiere tabla cuadrantes_maestros
```

### NO Listo (Fuera del Scope)
```
❌ Movimiento de archivo del Lovable (ya se hizo)
❌ Monorepo pnpm workspaces (depende de DevOps)
❌ Webhooks sincronización (deprecado - usar FDW lugar)
```

---

## 🚀 PLAN DE ACCIÓN (PRÓXIMAS 2 SEMANAS)

### Esta Semana (Week 1)
```
[ ] Revisar INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md
[ ] Coordinar con DevOps para acceso entre DBs
[ ] Aplicar migraciones SQL de MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md
[ ] Validar tablas creadas: SELECT * FROM electronic_health_record;
[ ] Testing ASIS_13 en staging
```

### Próxima Semana (Week 2)
```
[ ] Configurar FDW (Foreign Data Wrapper)
[ ] Actualizar React hooks para usar FDW
[ ] Testing de integraciones RENAPROSA ↔ HOSIX
[ ] Deploy a producción
[ ] Monitorialización de performance
```

---

## 🔍 CÓMO ENCONTRAR INFORMACIÓN

### Si necesitas...

**Entender la arquitectura completa:**
→ Archivo: `DOCUMENTATION_UNIFIED/01_GNU_HEALTH_INTEGRATION.md`

**Ver plan de migraciones:**
→ Archivo: `MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md`

**Aprender sobre integraciones RENAPROSA:**
→ Archivo: `INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md`

**Revisar análisis de componentes:**
→ Archivo: `ANALISIS_MIGRACIONES_EXHAUSTIVO.json`

**Ver resumen de lo que ya existe:**
→ Archivo: `RESUMEN_MIGRACIONES_EJECUTIVO.md`

**Historial de cambios recientes:**
→ Git commits últimos 7 días

---

## ⚡ COMANDOS ÚTILES

### Validar Estructura
```bash
# Ver qué tablas existen en HOSIX:
supabase db pull

# Ver migraciones aplicadas:
supabase migration list

# Verificar si tabla existe:
supabase sql "SELECT COUNT(*) FROM electronic_health_record;"
```

### Instalar Dependencias
```bash
# Limpiar y reinstalar (si hay errores):
rm -rf node_modules package-lock.json
npm install

# Build:
npm run build

# Dev:
npm run dev
```

### Verificar RLS Policies
```sql
-- En Supabase SQL Editor:
SELECT table_name, policyname, permissive 
FROM pg_policies 
WHERE table_name IN ('electronic_health_record', 'ehr_episode_links', 'ehr_document_storage');
```

---

## 📞 ESCALADAS

Si encuentras:

**Error: "could not load HospitalContext"**
→ npm install limpio (borrar node_modules)

**Error: "table electronic_health_record does not exist"**
→ Aplicar migraciones (ver MIGRACIONES_SQL_LISTAS_PARA_SUPABASE.md)

**RLS bloquea mis datos**
→ Revisar policy en Supabase UI → Security → Policies

**FDW muy lento**
→ Ver sección performance en INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md

**Necesito reververt migraciones**
→ ⚠️ CREA BACKUP PRIMERO, luego contact DBA

---

## 📋 CHECKLIST NUEVO DEVELOPER

- [ ] Cloned repo
- [ ] `npm install` exitoso
- [ ] `npm run dev` funciona
- [ ] Leído: GUÍA RÁPIDA (este archivo)
- [ ] Leído: INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md
- [ ] Leído: DOCUMENTACION_UNIFIED/README.md
- [ ] Revisado: Estructura modular (src/components/ADMIN_1_*, ASIS_*, etc)
- [ ] Conectado a Supabase correcto (staging o prod)
- [ ] Validado que tablas maestras existen: `SELECT * FROM centros_salud LIMIT 1;`
- [ ] Revisado componentes del módulo asignado
- [ ] Entendido patrón de 5-Hito (SQL → Components → Hooks → Edge Functions → Tests)

---

## 🎓 PATRÓN DE ARQUITECTURA (5-HITO)

Todos los módulos HOSIX siguen este patrón:

```
HITO 1: SQL Migrations
└─ Crear tablas, índices, RLS policies

HITO 2: React Components
└─ Componentes visuales usables (sin lógica compleja)

HITO 3: React Hooks (con lógica)
└─ useXXX() que manejan estado, queries, mutations

HITO 4: Edge Functions
└─ Lógica backend compleja, validaciones, transacciones

HITO 5: Tests
└─ Unit + Integration + E2E

Resultado: Módulo LISTO PARA PRODUCCIÓN
```

---

**Versión:** 1.0  
**Última actualización:** 15 de Abril, 2026  
**Próxima revisión:** 30 de Abril, 2026
