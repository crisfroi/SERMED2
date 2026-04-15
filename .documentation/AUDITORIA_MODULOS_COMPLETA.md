# 🔍 AUDITORIA COMPLETA: MÓDULOS vs INFRAESTRUCTURA

**Fecha**: 15 Abril 2026  
**Objetivo**: Verificar que CADA módulo tenga: Tablas + Hooks + Edge Functions + Migraciones

---

## 📊 MÓDULO: ADMIN_1_HR (Recursos Humanos)

### Componentes
- ✅ HRDashboard.tsx
- ✅ PayrollManagement.tsx
- ✅ StaffDirectory.tsx
- ✅ ReportsAndAnalytics.tsx
- ✅ SchedulingBoard.tsx

### Tablas Supabase Requeridas
| Tabla | Descripción | Status | Migración |
|-------|-------------|--------|-----------|
| payroll_processing | Nóminas mensuales | ❓ VERIFICAR | ? |
| staff_schedules | Turnos de personal | ❓ VERIFICAR | ? |
| professional_indicators | KPIs / Indicadores | ✅ EXISTE | 20241201 |
| profesionales_sanitarios | (FDW de RENAPROSA) | ⚠️ PENDIENTE FDW | - |

### Hooks Disponibles
```
useStaffManagement()          ✅ EXISTE
useStaffScheduling()          ✅ EXISTE  
useTurnosBio()                ✅ EXISTE
useTurnosOptimizados()        ✅ EXISTE
```

### Edge Functions
| Función | Status | Localización |
|---------|--------|--------------|
| validar-horario-conflictos | ? | ? |
| generar-nómina-xlm | ? | ? |
| exportar-reportes-payroll | ? | ? |

### Gap Analysis
- ⚠️ Consultas API usan `/api/v1/hr/payroll` (NO Supabase directo)
- ⚠️ Falta verificar si `payroll_processing` existe en DB
- ⚠️ FDW para `profesionales_sanitarios` aún PENDIENTE
- ⚠️ Edge functions para nómina NOT CLEAR

---

## 📊 MÓDULO: ADMIN_2_WAITING_ROOMS (Colas)

### Componentes
- ✅ WaitingRoomDashboard.tsx
- ✅ PatientWaitingScreen.tsx
- ✅ QueueManagementPanel.tsx
- ✅ RoomConfigurationPage.tsx
- ✅ QueueAnalyticsReport.tsx

### Tablas Supabase Requeridas
| Tabla | Descripción | Status | Migración |
|-------|-------------|--------|-----------|
| waiting_queue | Cola de pacientes | ❓ VERIFICAR | ? |
| queue_rooms | Salas de espera config | ❓ VERIFICAR | ? |
| queue_analytics | Estadísticas de colas | ⚠️ PENDIENTE | - |

### Hooks Disponibles
```
useWaitingQueue()             ✅ EXISTE
```

### Edge Functions
| Función | Status | Localización |
|---------|--------|--------------|
| obtener-siguiente-paciente | ? | ? |
| actualizar-estado-cita | ? | ? |
| cancelar-paciente | ? | ? |

### Gap Analysis
- ⚠️ Usa queryKey `waiting-queue` (tabla debe existir)
- ⚠️ Falta verificar estructura de `waiting_queue`
- ⚠️ Edge functions para queue management NOT CLEAR
- ⚠️ Realtime updates (Supabase) configuration NOT CLEAR

---

## 📊 MÓDULO: ASIS_13_EHR (Historia Médica Electrónica)

### Componentes
- ✅ ElectronicHealthRecordDashboard.tsx
- ✅ ResumenClinico.tsx
- ✅ DocumentStorage.tsx
- ✅ EHRTimeline.tsx
- ✅ AuditLog.tsx

### Tablas Supabase Requeridas
| Tabla | Descripción | Status | Migración |
|-------|-------------|--------|-----------|
| electronic_health_record | Historia médica | ✅ APLICADA | 20260415_001 |
| ehr_episode_links | Episodios clínicos | ✅ APLICADA | 20260415_002 |
| ehr_document_storage | Documentos médicos | ✅ APLICADA | 20260415_003 |

### Hooks Creados Hoy
```
useEHR()                      ✅ CREADO HSTE HOY
useEHREpisodes()              ✅ CREADO HOY
useEHRDocuments()             ✅ CREADO HOY
useEHRDocumentUpload()        ✅ CREADO HOY
useEHRDocumentSign()          ✅ CREADO HOY
```

### Edge Functions Creados Hoy
```
ehr-sync-thalamus             ✅ CREADO HOY (scaffold)
ehr-search                    ✅ CREADO HOY (scaffold)
```

### Gap Analysis
- ✅ COMPLETO - Migraciones aplicadas
- ✅ COMPLETO - Hooks creados
- ⚠️ PARCIAL - Edge functions scaffold, necesita implementación real

---

## 📊 MÓDULOS: ASIS_04-15 (14 Módulos Clínicos)

### Lista de Módulos
```
ASIS_04: Obstetricia         ✅ EXISTE
ASIS_05: CRED                ✅ EXISTE
ASIS_06: Inmunización        ✅ EXISTE
ASIS_07: Nutrición           ✅ EXISTE
ASIS_08: Laboratorio         ✅ EXISTE
ASIS_09: Imagenología        ✅ EXISTE
ASIS_10: Farmacia            ✅ EXISTE
ASIS_11: Interconsultas      ✅ EXISTE
ASIS_12: Unknown             ⚠️ VERIFICAR
ASIS_13: EHR                 ✅ PROCESADO
ASIS_14: Unknown             ⚠️ VERIFICAR
ASIS_15: Unknown             ⚠️ VERIFICAR
```

### Tablas por Módulo

#### ASIS_04: Obstetricia
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_obstetricia_tipos_parto | ✅ EXISTE | 20250206_012 |
| hosix_obstetricia_partos | ✅ EXISTE | 20250206_012 |
| hosix_obstetricia_complicaciones | ✅ EXISTE | 20250206_012 |
| hosix_obstetricia_recien_nacidos | ✅ EXISTE | 20250206_012 |
| hosix_obstetricia_cuidados_posparto | ✅ EXISTE | 20250206_012 |

#### ASIS_05: CRED
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_cred_controles | ✅ EXISTE | 20250206_013 |
| hosix_cred_vacunas_catalogo | ✅ EXISTE | 20250206_013 |
| hosix_cred_vacunaciones | ✅ EXISTE | 20250206_013 |
| hosix_cred_esquema_vacunacion | ✅ EXISTE | 20250206_013 |
| hosix_cred_valoracion_desarrollo | ✅ EXISTE | 20250206_013 |

#### ASIS_08: Laboratorio
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_laboratorio_pruebas_catalogo | ✅ EXISTE | 20250206_014 |
| hosix_laboratorio_solicitudes | ✅ EXISTE | 20250206_014 |
| hosix_laboratorio_muestras | ✅ EXISTE | 20250206_014 |
| hosix_laboratorio_resultados | ✅ EXISTE | 20250206_014 |
| hosix_laboratorio_interpretacion | ✅ EXISTE | 20250206_014 |

#### ASIS_09: Imagenología
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_imagenologia_modalidades | ✅ EXISTE | 20250206_015 |
| hosix_imagenologia_protocolos | ✅ EXISTE | 20250206_015 |
| hosix_imagenologia_solicitudes | ✅ EXISTE | 20250206_015 |
| hosix_imagenologia_estudios | ✅ EXISTE | 20250206_015 |
| hosix_imagenologia_reportes | ✅ EXISTE | 20250206_015 |

#### ASIS_10: Farmacia
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_farmacia_dispensario | ✅ EXISTE | 20250206_016 |
| hosix_farmacia_dispensaciones | ✅ EXISTE | 20250206_016 |
| hosix_farmacia_medicamentos_restringidos | ✅ EXISTE | 20250206_016 |
| hosix_farmacia_farmacovigilancia | ✅ EXISTE | 20250206_016 |
| hosix_farmacia_reacciones_adversas | ✅ EXISTE | 20250206_016 |

#### ASIS_11: Interconsultas
| Tabla | Status | Migración |
|-------|--------|-----------|
| hosix_interconsultas_solicitudes | ✅ EXISTE | 20250206_017 |
| hosix_interconsultas_respuestas | ✅ EXISTE | 20250206_017 |
| hosix_interconsultas_seguimiento | ✅ EXISTE | 20250206_017 |
| hosix_interconsultas_derivaciones | ✅ EXISTE | 20250206_017 |

### Hooks por Módulo (VERIFICAR)
```
ASIS_04 Obstetricia.tsx        ⚠️ VERIFICAR
ASIS_05 CRED.tsx               ⚠️ VERIFICAR
ASIS_08 Laboratorio.tsx        ⚠️ VERIFICAR
ASIS_09 Imagenologia.tsx       ⚠️ VERIFICAR
ASIS_10 Farmacia.tsx           ⚠️ VERIFICAR
ASIS_11 Interconsultas.tsx     ⚠️ VERIFICAR
```

### Edge Functions (VERIFICAR)
```
Obstetricia                    ⚠️ ?
CRED                          ⚠️ ?
Laboratorio                   ⚠️ ?
Imagenología                  ⚠️ ?
Farmacia                      ⚠️ ?
Interconsultas                ⚠️ ?
```

### Gap Analysis
- ⚠️ TABLAS: Existen en migraciones **pero NO VERIFICADO** que estén en Supabase
- ⚠️ HOOKS: Existen pero DESCONOCIDOS cuáles mapean a cada módulo
- ⚠️ EDGE FUNCTIONS: Existen pero DESCONOCIDOS cuáles mapean a cada módulo
- 🔴 CRÍTICO: Sin verificar que hooks/functions tengan queries correctas

---

## 📊 MÓDULO: ASISTENCIA (Control Biométrico)

### Componentes
- ✅ AsistenciaDashboard.tsx (14 componentes totales)
- ✅ CuadrantesPanel.tsx
- ✅ DispositivosPanel.tsx
- ✅ FichajesList.tsx

### Tablas Supabase Requeridas
| Tabla | Descripción | Status | Migración |
|-------|-------------|--------|-----------|
| cuadrantes_maestros | Turnos biométricos | ❌ NO APLICA (RENAPROSA) | - |
| dispositivos_biometricos | Equipos biométricos | ❓ VERIFICAR | ? |
| fichajes_biometricos | Registros de asistencia | ❓ VERIFICAR | ? |

### Hooks Disponibles
```
useTurnosBio()                ✅ EXISTE
useTurnosOptimizados()        ✅ EXISTE
```

### Edge Functions
```
sync-biometric-device         ✅ EXISTE
```

### Gap Analysis
- ❌ cuadrantes_maestros NO debe estar en HOSIX (pertenece a RENAPROSA)
- ⚠️ Falta verificar si `dispositivos_biometricos` existe
- ⚠️ Falta verificar si `fichajes_biometricos` existe
- ⚠️ Edge function `sync-biometric-device` existe pero necesita verificación

---

## 📋 RESUMEN EJECUTIVO

| Aspecto | Status | Acción |
|--------|--------|--------|
| **Tablas ASIS_13** | ✅ APLICADAS | Ninguna |
| **Hooks ASIS_13** | ✅ CREADOS | Compilar + test |
| **Edge Functions ASIS_13** | ⚠️ SCAFFOLD | Implementar lógica real |
| **Tablas ASIS_04-11** | ⚠️ EN MIGRACIONES | **VERIFICAR en Supabase** |
| **Hooks ASIS_04-11** | ⚠️ DESCONOCIDO | **AUDITAR qué hooks usan** |
| **Edge Functions ASIS_04-11** | ⚠️ DESCONOCIDO | **AUDITAR qué functions usan** |
| **ADMIN_1 Tablas** | ⚠️ PARCIAL | **VERIFICAR payroll_processing** |
| **ADMIN_1 Hooks** | ✅ EXISTEN | useStaffManagement, etc |
| **ADMIN_1 Edge Functions** | ⚠️ DESCONOCIDO | **AUDITAR** |
| **ADMIN_2 Tablas** | ⚠️ DESCONOCIDO | **VERIFICAR waiting_queue** |
| **ADMIN_2 Hooks** | ✅ EXISTE | useWaitingQueue |
| **ADMIN_2 Edge Functions** | ⚠️ DESCONOCIDO | **AUDITAR** |
| **ASISTENCIA FDW** | ❌ NO APLICA | cuadrantes = RENAPROSA |

---

## 🚨 ACCIONES INMEDIATAS

### 1️⃣ Verificar Tablas en Supabase
```sql
-- Ejecutar en HOSIX Supabase SQL Editor:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Verificar que existan:**
- payroll_processing
- waiting_queue
- queue_rooms
- dispositivos_biometricos
- fichajes_biometricos
- Todas las tablas ASIS_* (hosix_obstetricia_*, etc)

### 2️⃣ Mapear Hooks a Módulos
- Revisar qué componentes USAN qué hooks
- Crear matriz de dependencies

### 3️⃣ Verificar Edge Functions Activas
- Listar todas en Supabase UI
- Verificar que apunten a tablas correctas

### 4️⃣ Build Validation
```bash
npm run build
```
- Si compila → todos los hooks/imports son válidos
- Si falla → hay gaps

---

**Next Step**: ¿Ejecutamos verificación de tablas en Supabase?
