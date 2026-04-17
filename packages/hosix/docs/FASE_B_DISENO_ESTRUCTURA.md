# 🏗️ FASE B: DISEÑO PROFESIONAL DE ESTRUCTURA

**Fecha:** Abril 16, 2026  
**Fase:** B - Diseño y Patrones  
**Status:** EN EJECUCIÓN  

---

## 📋 ÍNDICE FASE B

1. Estructura de carpetas definitiva
2. Templates de componentes y hooks
3. Patrones de nombrado y convenciones
4. Guía de módulos (cómo agregar uno nuevo)
5. Checklist de calidad
6. Cronograma FASE C (Infraestructura)

---

## 1️⃣ ESTRUCTURA DE CARPETAS DEFINITIVA

```
packages/hosix/
├── src/
│   ├── modules/                          # 🗂️ MÓDULOS ORGANIZADOS
│   │   ├── 00-core/                      # CORE - Infraestructura común
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   ├── EnhancedLoginForm.tsx
│   │   │   │   │   ├── RegistrationForm.tsx
│   │   │   │   │   ├── PasswordResetForm.tsx
│   │   │   │   │   ├── PermissionGuard.tsx
│   │   │   │   │   ├── RoleBasedRoute.tsx
│   │   │   │   │   └── UserProfileForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usePermissions.ts
│   │   │   │   ├── types/
│   │   │   │   │   └── auth.types.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── authService.ts
│   │   │   │   ├── index.ts              # 📤 Export público
│   │   │   │   └── README.md             # 📖 Documentación módulo
│   │   │   │
│   │   │   ├── ehr/                      # Electronic Health Record
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── types/
│   │   │   │   ├── services/
│   │   │   │   ├── index.ts
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── patients/                 # Patient Management
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── types/
│   │   │   │   ├── services/
│   │   │   │   ├── index.ts
│   │   │   │   └── README.md
│   │   │   │
│   │   │   └── shared/                   # Shared transverse components
│   │   │       ├── components/
│   │   │       │   ├── AuditTrailDashboard.tsx
│   │   │       │   ├── FollowupRecommendations.tsx
│   │   │       │   ├── ReferralTracker.tsx
│   │   │       │   └── SpecialistFinder.tsx
│   │   │       ├── hooks/
│   │   │       ├── types/
│   │   │       ├── index.ts
│   │   │       └── README.md
│   │   │
│   │   ├── 01-obstetrics/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 02-pediatrics/
│   │   │   ├── components/
│   │   │   │   ├── MilestoneTracker.tsx
│   │   │   │   └── WHOPercentileChart.tsx
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 03-nutrition/
│   │   │   ├── components/
│   │   │   │   ├── MealPlanBuilder.tsx
│   │   │   │   └── NutritionComplianceTracker.tsx
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 04-surgery/
│   │   ├── 05-immunization/
│   │   ├── 06-medications/
│   │   │   ├── components/
│   │   │   │   ├── KitManager.tsx
│   │   │   │   ├── MedicationStockDashboard.tsx
│   │   │   │   └── RegimensBuilder.tsx
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 07-clinical-docs/
│   │   │   ├── components/
│   │   │   │   ├── VisitNotesForm.tsx
│   │   │   │   ├── DiagnosisForm.tsx
│   │   │   │   ├── PrescriptionForm.tsx
│   │   │   │   ├── DocumentSigningInterface.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   └── ClinicalDocumentationTabs.tsx
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 08-diagnoses/
│   │   │   ├── components/
│   │   │   │   ├── ComorbidityMatrixEditor.tsx
│   │   │   │   ├── ExpandedDiagnosisForm.tsx
│   │   │   │   └── ICDSystemSelector.tsx
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── README.md
│   │   │
│   │   ├── 09-imaging/
│   │   └── ...
│   │
│   ├── shared/                           # 🔗 Infraestructura compartida
│   │   ├── utils/
│   │   ├── types/
│   │   ├── hooks/
│   │   ├── constants/
│   │   └── index.ts
│   │
│   ├── config/                           # ⚙️ Configuración
│   │   ├── env.ts
│   │   ├── supabase.ts
│   │   └── constants.ts
│   │
│   ├── docs/                             # 📚 Documentación
│   │   ├── ARCHITECTURE.md
│   │   ├── PATTERNS.md
│   │   ├── MODULE_CREATION.md
│   │   └── API.md
│   │
│   └── index.tsx                         # Entry point
│
├── supabase/
│   ├── functions/
│   │   ├── hosix/                        # 🏥 HOSIX specific
│   │   │   ├── hospitalizacion-crear-kardex/
│   │   │   ├── hospitalizacion-evolucionar/
│   │   │   ├── hospitalizacion-mover-cama/
│   │   │   ├── hospitalizacion-solicitar-cirugia/
│   │   │   ├── hospitalizacion-solicitar-interconsulta/
│   │   │   └── referral-validation/
│   │   │
│   │   └── shared/                       # 🔗 Compartidas
│   │       ├── ai-chat-master/
│   │       └── ...
│   │
│   └── migrations/
│       ├── hosix/
│       │   ├── 001_init_auth.sql
│       │   ├── 002_init_patients.sql
│       │   └── ...
│       └── shared/
│
├── docs/                                 # 📖 Documentación raíz
│   ├── ARCHITECTURE.md
│   ├── MODULE_GUIDE.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── ...
│
└── package.json
```

---

## 2️⃣ TEMPLATES DE COMPONENTES Y HOOKS

### Template: Componente React (Component.tsx)

```typescript
// components/MiComponente.tsx
import React, { FC } from 'react'
import { MiComponenteProps } from '../types'
import { useMiHook } from '../hooks'
import styles from './MiComponente.module.css'

/**
 * MiComponente
 * 
 * Descripción clara de qué hace el componente.
 * Caso de uso: Cuándo y dónde se usa.
 * 
 * @param props - Props documentadas
 * @returns JSX.Element
 * 
 * @example
 * <MiComponente prop1="valor" prop2={123} />
 */
export const MiComponente: FC<MiComponenteProps> = ({
  prop1,
  prop2,
  onaction,
}) => {
  const { data, loading, error } = useMiHook()

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className={styles.container}>
      {/* Contenido aquí */}
    </div>
  )
}

export default MiComponente
```

### Template: Hook Custom (useXXX.ts)

```typescript
// hooks/useMiHook.ts
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { MiHookResult } from '../types'

/**
 * useMiHook
 * 
 * Descripción clara de qué hace el hook.
 * 
 * @param deps - Dependencias
 * @returns MiHookResult - Datos y funciones
 * 
 * @example
 * const { data, loading, error } = useMiHook()
 */
export function useMiHook(): MiHookResult {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('table')
        .select('*')

      if (error) throw error
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### Template: Types (types/index.ts)

```typescript
// types/index.ts
import { Database } from '@supabase/supabase-js'

/** Props del componente MiComponente */
export interface MiComponenteProps {
  prop1: string
  prop2: number
  onAction?: (data: any) => void
  className?: string
}

/** Resultado del hook useMiHook */
export interface MiHookResult {
  data: any[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Modelo de base de datos */
export type MiTabla = Database['public']['Tables']['mi_tabla']['Row']
```

### Template: Service (services/miService.ts)

```typescript
// services/miService.ts
import { supabase } from '@/config/supabase'
import { MiTabla } from '../types'

/**
 * Servicio de negocio para MiTabla
 * Centraliza lógica de base de datos y transformaciones
 */
export class MiService {
  /**
   * Obtiene todos los registros
   */
  static async getAll(): Promise<MiTabla[]> {
    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*')

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene un registro por ID
   */
  static async getById(id: string): Promise<MiTabla> {
    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Crea un nuevo registro
   */
  static async create(params: Partial<MiTabla>): Promise<MiTabla> {
    const { data, error } = await supabase
      .from('mi_tabla')
      .insert([params])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualiza un registro
   */
  static async update(id: string, params: Partial<MiTabla>): Promise<MiTabla> {
    const { data, error } = await supabase
      .from('mi_tabla')
      .update(params)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Elimina un registro
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('mi_tabla')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
```

### Template: README de Módulo (README.md)

```markdown
# Módulo 06: Medications

## 📖 Descripción

Gestión completa de medicamentos, farmacias, regímenes terapéuticos e interacciones farmacológicas.

Basado en GNU Health `health_medication` and `health_inpatient_medication`.

## 🎯 Objetivos

- [ ] Gestión de medicamentos
- [ ] Seguimiento de adherencia
- [ ] Análisis de interacciones
- [ ] Stock y disponibilidad

## 🗂️ Estructura

```
modules/06-medications/
├── components/
│   ├── KitManager.tsx
│   ├── MedicationStockDashboard.tsx
│   └── RegimensBuilder.tsx
├── hooks/
│   ├── useMedicationRegimen.ts
│   ├── useMedicationKit.ts
│   └── useStockReservation.ts
├── types/
│   └── medications.types.ts
├── services/
│   └── medicationService.ts
├── index.ts
└── README.md
```

## ✅ Checklist de Componentes

- [x] KitManager - Gestión de kits médicos
- [x] MedicationStockDashboard - Inventario
- [x] RegimensBuilder - Crear regímenes
- [ ] InteractionChecker - Validar interacciones
- [ ] AdherenceTracker - Seguimiento

## 🔗 Dependencias

- Module 00-core/patients
- Module 08-diagnoses

## 📚 Documentación

Ver `ARCHITECTURE.md` para patrones globales.
```

---

## 3️⃣ PATRONES Y CONVENCIONES

### Nombrado de Archivos

```
✅ CORRECTO:
- MealPlanBuilder.tsx          (PascalCase para componentes)
- useMealPlan.ts               (camelCase para hooks)
- mealPlan.types.ts            (camelCase para tipos)
- mealPlanService.ts           (camelCase para servicios)
- MealPlanBuilder.module.css   (PascalCase para styles)

❌ INCORRECTO:
- meal-plan.tsx                (kebab-case)
- use_meal_plan.ts             (snake_case)
- MealPlan.service.ts          (mixto)
```

### Estructura de Imports

```typescript
// ✅ CORRECTO - Orden estándar:
// 1. React y librerías externas
import React, { FC, useCallback } from 'react'
import { useQuery } from 'react-query'

// 2. Componentes internos (niveles superiores)
import { PatientSearchForm } from '@/modules/patients'
import { ReferralTracker } from '@/modules/shared'

// 3. Tipos locales
import { MedicationProps } from '../types'

// 4. Hooks locales
import { useMedicationRegimen } from '../hooks'

// 5. Servicios locales
import { medicationService } from '../services'

// 6. Estilos
import styles from './Medication.module.css'
```

### Versionado de Componentes

```typescript
// ✅ PATRÓN: Si existe una versión v2, mantener compatibilidad

// KitManager.tsx (v1 actual)
export const KitManager: FC<KitManagerProps> = (props) => { ... }

// KitManagerV2.tsx (versión mejorada experimental)
export const KitManagerV2: FC<KitManagerV2Props> = (props) => { ... }

// En futuro: Cambiar v2 a v1 cuando esté confirmado
```

---

## 4️⃣ GUÍA: CÓMO AGREGAR UN NUEVO MÓDULO

### Paso 1: Crear estructura carpetas

```bash
mkdir -p packages/hosix/src/modules/XX-nombre
mkdir -p packages/hosix/src/modules/XX-nombre/components
mkdir -p packages/hosix/src/modules/XX-nombre/hooks
mkdir -p packages/hosix/src/modules/XX-nombre/types
mkdir -p packages/hosix/src/modules/XX-nombre/services
```

### Paso 2: Crear archivos base

**types/index.ts** - Definir tipos del módulo
**services/miService.ts** - Lógica de BD
**hooks/useMiHook.ts** - Hooks reutilizables
**components/MiComponente.tsx** - Componentes UI
**index.ts** - Exports públicos
**README.md** - Documentación

### Paso 3: Definir exports en index.ts

```typescript
// modules/XX-nombre/index.ts
export * from './components'
export * from './hooks'
export * from './types'
export * from './services'
```

### Paso 4: Registrar en módulo padre

```typescript
// modules/00-core/index.ts
export * from './auth'
export * from './ehr'
export * from './patients'
export * from './shared'
// Debes AGREGAR:
// export * from '../XX-nombre'
```

### Paso 5: Agregar README.md

Usar template de README mostrado arriba.

---

## 5️⃣ CHECKLIST DE CALIDAD

### Por cada componente:

- [ ] Función principal está documentada con JSDoc
- [ ] Props es una interface tipada
- [ ] Manejo de loading/error states
- [ ] Líneas < 300 (si no, refactorizar en submódulos)
- [ ] Imports correctamente ordenados
- [ ] Tests escritos (si es crítico)
- [ ] No hay console.log sin DEBUG flag
- [ ] Accesibilidad: aria-labels, roles
- [ ] Performance: useCallback, useMemo si es necesario

### Por cada módulo:

- [ ] Estructura de carpetas correcta
- [ ] README.md completado
- [ ] index.ts con exports limpios
- [ ] Sin dependencias circulares
- [ ] Sin importes de componentes ASIS_ viejos
- [ ] Todos los componentes en la matriz FASE_A

---

## 6️⃣ CRONOGRAMA FASE C (INFRAESTRUCTURA)

### Duración estimada: 3-4 horas

**Paso 1: Core Modules (1 hora)**
- [ ] Crear estructura 00-core/ (auth, ehr, patients, shared)
- [ ] Copiar 20 componentes P0 a nuevas locaciones
- [ ] Crear types, services, hooks scaffolds

**Paso 2: Clinical Modules (1 hora)**
- [ ] Crear módulos 01-obstetrics → 09-imaging
- [ ] Crear README.md para cada uno
- [ ] Crear index.ts para cada uno

**Paso 3: Legacy ASIS Consolidation (1 hora)**
- [ ] Clasificar ASIS_* por módulo destino
- [ ] Crear mapping: ASIS_XYZ → modules/NN-nombre/

**Paso 4: Documentation & Index (30 min)**
- [ ] Crear ARCHITECTURE.md
- [ ] Crear MODULE_GUIDE.md
- [ ] Crear master index de módulos

**Paso 5: Verificación (30 min)**
- [ ] npm run build (sin errores)
- [ ] npm run lint (0 warnings)
- [ ] Checklist de calidad

---

## ✅ STATUS FASE B

| Aspecto | Status | Nota |
|---------|--------|------|
| Estructura definida | ✅ | 9 módulos core + 10+ clínicos |
| Templates creados | ✅ | Component, Hook, Types, Service, README |
| Patrones documentados | ✅ | Naming, imports, versionado |
| Guía módulo nuevo | ✅ | 5 pasos claros |
| Checklist de calidad | ✅ | 15+ items |
| Cronograma FASE C | ✅ | 3-4 horas estimadas |

---

## 🎯 SIGUIENTE PASO

**FASE C: INFRAESTRUCTURA** (Ejecución Física)

Crear la estructura de carpetas y archivos base según diseño FASE B.

Estimado: 3-4 horas.

**¿Procesor hacia FASE C?** ✅
