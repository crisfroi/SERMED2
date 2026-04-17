# 🏗️ FASE C: INFRAESTRUCTURA - CREACIÓN FÍSICA

**Fecha:** Abril 16, 2026  
**Fase:** C - Creación de Estructura  
**Duración:** 3-4 horas  
**Status:** INICIANDO AHORA  

---

## 📋 PLAN EJECUCIÓN PASO A PASO

Este documento describe LA EJECUCIÓN FÍSICA de lo diseñado en FASE B.

### PASO 1️⃣: Core Modules (1 hora)

#### 1.1 Estructura 00-core

```bash
# Crear directorios principale
mkdir -p packages/hosix/src/modules/00-core
mkdir -p packages/hosix/src/modules/00-core/{auth,ehr,patients,shared}/{components,hooks,types,services}

# Crear archivos base
touch packages/hosix/src/modules/00-core/auth/index.ts
touch packages/hosix/src/modules/00-core/auth/types/auth.types.ts
touch packages/hosix/src/modules/00-core/auth/services/authService.ts
touch packages/hosix/src/modules/00-core/auth/README.md

# Repetir para ehr, patients, shared...
```

#### 1.2 Copiar componentes P0 desde ubicaciones viejas

```
ORIGEN → DESTINO:

packages/hosix/src/components/auth/* 
  → packages/hosix/src/modules/00-core/auth/components/

packages/hosix/src/components/patient/*
  → packages/hosix/src/modules/00-core/patients/components/

packages/hosix/src/components/clinical/*
  → packages/hosix/src/modules/07-clinical-docs/components/
```

#### 1.3 Crear archivo index.ts consolidado

**packages/hosix/src/modules/00-core/index.ts:**
```typescript
// Core exports
export * from './auth'
export * from './ehr'
export * from './patients'
export * from './shared'
```

---

### PASO 2️⃣: Clinical Modules (1 hora)

#### 2.1 Crear módulos vacíos (scaffold)

```bash
# Para cada módulo: 01-obstetrics, 02-pediatrics, ..., 09-imaging

for i in {01..09}; do
  case $i in
    01) name="obstetrics" ;;
    02) name="pediatrics" ;;
    03) name="nutrition" ;;
    04) name="surgery" ;;
    05) name="immunization" ;;
    06) name="medications" ;;
    07) name="clinical-docs" ;;
    08) name="diagnoses" ;;
    09) name="imaging" ;;
  esac
  
  mkdir -p "packages/hosix/src/modules/$i-$name/{components,hooks,types,services}"
  touch "packages/hosix/src/modules/$i-$name/index.ts"
  touch "packages/hosix/src/modules/$i-$name/README.md"
done
```

---

### PASO 2B️⃣: Admin Modules (30 min)

#### 2B.1 Crear módulos administrativos

```bash
# ADMIN_1: HR Management
mkdir -p packages/hosix/src/modules/10-admin-hr/{components,hooks,types,services}
touch packages/hosix/src/modules/10-admin-hr/{index.ts,README.md}

# ADMIN_2: Operations & Waiting Rooms
mkdir -p packages/hosix/src/modules/11-admin-operations/{components,hooks,types,services}
touch packages/hosix/src/modules/11-admin-operations/{index.ts,README.md}
```

#### 2B.2 Describir módulos admin

**modules/10-admin-hr/README.md:**
```markdown
# Módulo 10: Administration - HR

Gestión de recursos humanos, personal, permisos y administración de empleados.

Basado en GNU Health HR module pero adaptado para HOSIX.
```

**modules/11-admin-operations/README.md:**
```markdown
# Módulo 11: Administration - Operations

Gestión operativa: salas de espera, turnos, disponibilidad de recursos.

Componentes de administración operacional.
```

#### 2.2 Criar README.md para cada módulo

Usar template de FASE B. Ejemplo para módulo 06-medications:

```markdown
# Módulo 06: Medications

## 📖 Descripción
Gestión de medicamentos, farmacias y regímenes terapéuticos.

## 🗂️ Estructura
[estructura del módulo]

## ✅ Componentes
- [ ] KitManager
- [ ] MedicationStockDashboard
- [ ] RegimensBuilder

## 🔗 Dependencias
- Module 00-core/patients
- Module 08-diagnoses
```

---

### PASO 3️⃣: Legacy ASIS Consolidation (1 hora)

#### 3.1 Crear mapping ASIS → módulos nuevos

**Archivo: MIGRACION_ASIS_MAPPING.md**

```markdown
# Mapeo de Migración ASIS → Módulos Nuevos

## ASIS_04_Obstetricia
Origen: `src/components/ASIS_04_Obstetricia/`
Destino: `packages/hosix/src/modules/01-obstetrics/components/`
Archivos: 8 componentes
Acción: Copiar + revisar dependencias

## ASIS_05_CRED
Origen: `src/components/ASIS_05_CRED/`
Destino: `packages/hosix/src/modules/02-pediatrics/components/`
Archivos: 6 componentes
Acción: Copiar + revisar dependencias

... [resto de ASIS]
```

#### 3.2 Crear script de migración

**scripts/migrate-asis-to-modules.js:**

```javascript
// Este script PREPARARÁ las migraciones (sin ejecutar)
// Mostrará análisis de dependencias antes de copiar

const fs = require('fs-extra')
const path = require('path')

const mappings = [
  { asis: 'ASIS_04_Obstetricia', dest: '01-obstetrics' },
  { asis: 'ASIS_05_CRED', dest: '02-pediatrics' },
  // ... más mapejos
]

for (const { asis, dest } of mappings) {
  const origin = path.join('src/components', asis)
  const destination = path.join('packages/hosix/src/modules', dest, 'components')
  
  if (fs.existsSync(origin)) {
    console.log(`✅ LISTO para migrar: ${asis} → ${dest}`)
    // fs.copySync(origin, destination)  // NO EJECUTAR AÚN
  }
}
```

---

### PASO 3B️⃣: HOSIX Functions Setup (30 min)

#### 3B.1 Crear estructura de funciones HOSIX

```bash
# Crear carpeta de funciones HOSIX dentro de packages/hosix
mkdir -p packages/hosix/src/functions

# Crear carpetas por categoría de función
mkdir -p packages/hosix/src/functions/hospitalization
mkdir -p packages/hosix/src/functions/referral
mkdir -p packages/hosix/src/functions/shared
```

#### 3B.2 Template de función HOSIX

**packages/hosix/src/functions/hospitalization/kardex.ts:**

```typescript
/**
 * Crear Kardex de Hospitalización
 * 
 * Función Edge que crea el registro de evolución clínica
 * para un paciente hospitalizado.
 * 
 * @param params - Datos de kardex
 * @returns Kardex creado
 */
export async function createKardex(params: {
  hospitalization_id: string
  visit_date: string
  diagnosis: string
  treatment: string
}) {
  // Implementación
}

export async function updateKardex(
  kardex_id: string,
  data: Partial<typeof createKardex>
) {
  // Implementación
}

export async function getKardexHistory(hospitalization_id: string) {
  // Implementación
}
```

#### 3B.3 Mapeo de funciones HOSIX → módulos

**Documento: packages/hosix/docs/FUNCTIONS_MAP.md**

```markdown
# Mapeo de Funciones Edge HOSIX

## Funciones por Categoría

### Hospitalization (health_inpatient)
- `hospitalizacion_crear_kardex` → modules/XX-inpatient/
- `hospitalizacion_evolucionar_paciente` → modules/XX-inpatient/
- `hospitalizacion_mover_paciente_cama` → modules/XX-inpatient/
- `hospitalizacion_solicitar_cirugia` → modules/XX-inpatient/
- `hospitalizacion_solicitar_interconsulta` → modules/XX-inpatient/

### Referral (health_referral)
- `referral_validation` → modules/00-core/shared/

### Ubicación Física
- Source: `packages/hosix/src/functions/`
- Deploy: `supabase/functions/` (Deno)
```

---

### PASO 3C️⃣: HOSIX Migrations Setup (30 min)

#### 3C.1 Crear estructura de migraciones HOSIX

```bash
# Crear carpeta de migraciones HOSIX
mkdir -p packages/hosix/src/migrations/hosix
mkdir -p packages/hosix/src/migrations/shared

# Crear subcarpetas por módulo
mkdir -p packages/hosix/src/migrations/hosix/001-auth
mkdir -p packages/hosix/src/migrations/hosix/002-patients
mkdir -p packages/hosix/src/migrations/hosix/003-ehr
```

#### 3C.2 Template de migración HOSIX

**packages/hosix/src/migrations/hosix/001-auth/001_create_auth_tables.sql:**

```sql
-- Migration: 001 - Create Authentication Tables
-- Date: 2026-04-16
-- Module: 00-core/auth

CREATE TABLE IF NOT EXISTS users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profiles(id),
  permission VARCHAR(100) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven su propio perfil
CREATE POLICY "users_view_own_profile" ON users_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: admins ven todos los perfiles
CREATE POLICY "admins_see_all_profiles" ON users_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_permissions 
      WHERE permission = 'ADMIN'
    )
  );
```

#### 3C.3 Mapeo de migraciones HOSIX → módulos

**Documento: packages/hosix/docs/MIGRATIONS_MAP.md**

```markdown
# Mapeo de Migraciones HOSIX

## Migraciones por Módulo

### 00-core
- 001-auth: Autenticación y permisos
- 002-ehr: EHR base structure
- 003-audit: Auditoría y logging

### 01-obstetrics
- 010-obstetrics: Tablas de obstetricia

### 02-pediatrics
- 020-pediatrics: Tablas de pediatría
- 021-growth: CRED y crecimiento

... [más módulos]

## Ubicación Física
- Source: `packages/hosix/src/migrations/`
- Deploy: `supabase/migrations/` (Flyway/Liquibase)
- Status: Ya existen 75 migraciones trackadas
```

---

### PASO 4️⃣: Documentación Principal (30 min)

#### 4.1 Crear ARCHITECTURE.md

**packages/hosix/docs/ARCHITECTURE.md:**

```markdown
# HOSIX Architecture

## Visión General

HOSIX es un hospital management system basado en GNU Health, organizado en 
19+ módulos especializados, cada uno responsable de un aspecto clínico.

## Principios

1. **Modular** - Cada módulo es independiente
2. **Escalable** - Fácil agregar nuevos módulos
3. **Testeable** - Cada módulo tiene its own tests
4. **Documentado** - README en cada módulo
5. **Typed** - TypeScript strict mode 100%

## Módulos

### Tier 0: Core Infrastructure
- 00-core/auth - Autenticación
- 00-core/ehr - Registros de salud electrónicos
- 00-core/patients - Gestión de pacientes
- 00-core/shared - Componentes transversos

### Tier 1: Clinical Modules
- 01-obstetrics - Obstetricia
- 02-pediatrics - Pediatría
- ... [resto]

## Patrones Globales

[Detalles de patrones]
```

#### 4.2 Crear MODULE_GUIDE.md

**packages/hosix/docs/MODULE_GUIDE.md:**

```markdown
# Guía de Módulos

## Cómo agregar un nuevo módulo:

1. Crear estructura base
2. Definir tipos
3. Crear servicios
4. Crear hooks
5. Crear componentes
6. Documentar en README

Ejemplo completo: módulo 06-medications
```

#### 4.3 Crear master index

**packages/hosix/src/modules/index.ts:**

```typescript
// Core modules
export * from './00-core'

// Clinical modules
export * from './01-obstetrics'
export * from './02-pediatrics'
export * from './03-nutrition'
export * from './04-surgery'
export * from './05-immunization'
export * from './06-medications'
export * from './07-clinical-docs'
export * from './08-diagnoses'
export * from './09-imaging'
```

---

### PASO 5️⃣: Verificación & QA (30 min)

#### 5.1 Tests de estructura

```bash
# Verificar que todos los módulos existen
npm run verify:modules

# Verificar imports sin errores
npm run build

# Verificar linting
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit
```

#### 5.2 Checklist final

- [ ] Todas las carpetas existen
- [ ] Todos los index.ts están presentes
- [ ] Todos los README.md están completos
- [ ] `npm run build` sin errores
- [ ] `npm run lint` 0 warnings
- [ ] TypeScript strict mode: 0 errores
- [ ] Imports limpios (sin circular deps)

---

## ⚙️ EJECUCIÓN AUTOMÁTICA

Aquí voy a crear la estructura automáticamente ahora mismo.

Esto incluye:
1. ✅ Crear todas las carpetas
2. ✅ Crear archivos base (index.ts, README.md)
3. ✅ Crear templates de tipos y servicios
4. ✅ Documentación
5. ⏳ NO copiar componentes aún (eso es FASE D)

---

## 📊 TRACKING

| Paso | Subtarea | Status | Tiempo |
|------|----------|--------|--------|
| 1 | Crear estructura 00-core | ⏳ | 5 min |
| 1 | Copiar P0 componentes a nuevas locaciones | ⏳ | 10 min |
| 1 | Crear index.ts consolidado | ⏳ | 5 min |
| 2 | Crear módulos 01-09 (scaffold) | ⏳ | 20 min |
| 2 | README para cada módulo | ⏳ | 10 min |
| **2B** | **Crear módulos 10-11 ADMIN (HR + Operations)** | **⏳** | **10 min** |
| **2B** | **Describir módulos ADMIN** | **⏳** | **5 min** |
| 3 | Crear mapping ASIS → módulos | ⏳ | 15 min |
| 3 | Crear script de migración (preparación) | ⏳ | 10 min |
| **3B** | **Crear estructura packages/hosix/src/functions** | **⏳** | **10 min** |
| **3B** | **Templates de función HOSIX** | **⏳** | **5 min** |
| **3B** | **Documento: FUNCTIONS_MAP.md** | **⏳** | **5 min** |
| **3C** | **Crear estructura packages/hosix/src/migrations** | **⏳** | **10 min** |
| **3C** | **Templates de migración HOSIX** | **⏳** | **5 min** |
| **3C** | **Documento: MIGRATIONS_MAP.md** | **⏳** | **5 min** |
| 4 | ARCHITECTURE.md | ⏳ | 5 min |
| 4 | MODULE_GUIDE.md | ⏳ | 5 min |
| 4 | Master index.ts | ⏳ | 5 min |
| 5 | Tests de estructura | ⏳ | 10 min |
| 5 | Checklist final | ⏳ | 5 min |

**TOTAL ACTUALIZADO: 160 minutos (2.5-3 horas)**

---

## ✅ ESTADO

**Documento de planificación:** ✅ COMPLETO - Incluye ADMIN modules + Functions + Migrations
**Están listos para ejecución:** ✅ SÍ
**Puedo ejecutar automáticamente:** ✅ SÍ

**¿Procesor a ejecución física de FASE C?** → Espera confirmación
