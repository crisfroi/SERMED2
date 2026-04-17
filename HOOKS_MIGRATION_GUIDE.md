# React Hooks Migration Guide

**Migration Date:** April 17, 2026  
**Status:** ✅ **COMPLETE**

---

## What Changed?

All 160 React hooks have been **reorganized** from a flat `src/hooks/` directory into a **modular structure** in `packages/hosix/src/hooks/{module}/`.

### Before (OLD - Still Works)
```
src/hooks/
├── useHRDashboard.ts
├── useObstetricPatient.ts
├── useChildGrowth.ts
├── useEHR.ts
├── ... (140+ files in one directory)
└── index.ts
```

### After (NEW - Organized by Domain)
```
packages/hosix/src/hooks/
├── 00-core/
│   ├── useApp.ts
│   ├── useHospital.ts
│   ├── index.ts
│   └── ...
├── 01-obstetrics/
│   ├── useObstetricPatient.ts
│   ├── useObstetricRisk.ts
│   ├── index.ts
│   └── ...
├── 02-pediatrics/
│   ├── useChildGrowth.ts
│   ├── index.ts
│   └── ...
├── 10-admin-hr/
│   ├── useHRDashboard.ts
│   ├── index.ts
│   └── ...
├── shared/
│   ├── useSupabaseConnectivity.ts
│   ├── index.ts
│   └── ...
└── ... (13 modules total)
```

---

## Module Organization

| Module | Purpose | Key Hooks | Count |
|--------|---------|-----------|-------|
| **00-core** | App infrastructure, core UI | useApp, useHospital, useDashboardNavigation | 11 |
| **01-obstetrics** | Pregnancy, obstetric care | useObstetricPatient, useObstetricRisk | 4 |
| **02-pediatrics** | Child growth, development | useChildGrowth, usePediatricsGrowth, useWHOGrowth | 6 |
| **03-nutrition** | Nutrition assessment, meal planning | useNutritionPlanning, useMealPlan | 8 |
| **04-surgery** | Surgical inventory, equipment | useStockReservation, useMedicationKit | 4 |
| **05-immunization** | Vaccination programs | useImmunizationHooks | 2 |
| **06-medications** | Pharmacy, prescriptions | usePharmacyHooks, useMedicationOrder | 4 |
| **07-clinical-docs** | EHR, clinical documentation | useEHR, useEHRDocumentSign, useExpedienteWorkflow | 25 |
| **08-diagnoses** | Diagnosis, comorbidity | useDiagnosisManagement, useComorbidity | 9 |
| **09-imaging** | Medical imaging, lab results | useImagingOrder, useDicomViewer, useLabOrder | 10 |
| **10-admin-hr** | HR, payroll, staff | useHRDashboard, usePayrollProcessing, useProfesionales | 15 |
| **11-admin-operations** | Operations, queues, rooms | useQueueManagement, useInventoryManagement | 15 |
| **shared** | Cross-module utilities | useSupabaseConnectivity, useOfflineMode, useSyncStatus | 47 |

---

## How to Update Your Imports

### Step 1: Identify the Hook's Module
Look at the hook name and find which module it belongs to:

**Examples:**
- `useHRDashboard` → **10-admin-hr** (HR-related)
- `useObstetricPatient` → **01-obstetrics** (Pregnancy-related)
- `useSupabaseConnectivity` → **shared** (Cross-module utility)
- `useChildGrowth` → **02-pediatrics** (Child development)

### Step 2: Update the Import Path

**OLD Import:**
```typescript
// Flat structure from src/hooks/
import { useAuth } from '../../../hooks/useAuth';
import { useHRDashboard } from '../../../hooks/useHRDashboard';
import { useOfflineMode } from '../../../hooks/useOfflineMode';
```

**NEW Import:**
```typescript
// Organized by module from @hosix/hooks
import { useAuth } from '@hosix/hooks/00-core';
import { useHRDashboard } from '@hosix/hooks/10-admin-hr';
import { useOfflineMode } from '@hosix/hooks/shared';
```

### Step 3: Combined Example

**OLD Component (with flat imports):**
```typescript
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useHRDashboard } from '../../../hooks/useHRDashboard';
import { useSupabaseConnectivity } from '../../../hooks/useSupabaseConnectivity';

export function HRDashboard() {
  const { user } = useAuth();
  const dashboard = useHRDashboard();
  const { isOnline } = useSupabaseConnectivity();

  return <div>{/* ... */}</div>;
}
```

**NEW Component (with module imports):**
```typescript
import React from 'react';
import { useAuth } from '@hosix/hooks/00-core';
import { useHRDashboard } from '@hosix/hooks/10-admin-hr';
import { useSupabaseConnectivity } from '@hosix/hooks/shared';

export function HRDashboard() {
  const { user } = useAuth();
  const dashboard = useHRDashboard();
  const { isOnline } = useSupabaseConnectivity();

  return <div>{/* ... */}</div>;
}
```

---

## Import Patterns by Module

### Core Hooks (00-core)
```typescript
import {
  useApp,
  useAuth,
  useHospital,
  useDashboardNavigation,
  useUserManagement,
  useRolePermissions,
} from '@hosix/hooks/00-core';
```

### Clinical Hooks (Multiple Modules)
```typescript
// Obstetrics
import { useObstetricPatient, useObstetricRisk } from '@hosix/hooks/01-obstetrics';

// Pediatrics
import { useChildGrowth, usePediatricsGrowth } from '@hosix/hooks/02-pediatrics';

// Nutrition
import { useNutritionPlanning, useMealPlan } from '@hosix/hooks/03-nutrition';

// Clinical Documentation
import {
  useEHR,
  useEHRDocumentSign,
  useExpedienteWorkflow,
} from '@hosix/hooks/07-clinical-docs';
```

### Administrative Hooks
```typescript
// HR & Payroll
import {
  useHRDashboard,
  usePayrollProcessing,
  useProfesionales,
} from '@hosix/hooks/10-admin-hr';

// Operations
import {
  useQueueManagement,
  useInventoryManagement,
  useWaitingQueue,
} from '@hosix/hooks/11-admin-operations';
```

### Shared Utilities
```typescript
import {
  useSupabaseConnectivity,
  useOfflineMode,
  useSyncStatus,
  useEnhancedQuery,
  useEnhancedErrorHandler,
  useNetworkStatus,
} from '@hosix/hooks/shared';
```

---

## TypeScript Support

All module exports include **full type support**:

```typescript
// Types import automatically
import {
  useHRDashboard,
  type HRDashboardState, // Type is included
  type HRDashboardActions,
} from '@hosix/hooks/10-admin-hr';

// Use types directly
const { state, actions }: HRDashboardState & HRDashboardActions = useHRDashboard();
```

---

## Compatibility Notes

### ✅ What Still Works
- **OLD imports from `src/hooks/`** are still available during transition period
- Original files remain in `src/hooks/` for backward compatibility
- Duplicate copies don't affect functionality

### ⚠️ Planned Changes (Future)
- After 2-3 sprints, old imports from `src/hooks/` will show deprecation warnings
- Eventually, `src/hooks/` will be removed to reduce duplication

### 🎯 Recommendation
- **Start using new imports immediately** for new code
- **Gradually update** existing components to use new module imports
- Use IDE search & replace to batch update imports

---

## Finding Hooks

### Method 1: By Module Name
Know which domain you need? Use the module directory:

```typescript
// Imaging and lab work
import { useImagingOrder, useLabResults } from '@hosix/hooks/09-imaging';

// Surgery and inventory
import { useStockReservation } from '@hosix/hooks/04-surgery';
```

### Method 2: By Hook Name
If you know the hook name, check the module:

```bash
# Search for a hook across modules
find packages/hosix/src/hooks -name "useHRDashboard*"
# Result: packages/hosix/src/hooks/10-admin-hr/useHRDashboard.ts
```

### Method 3: Using IDE
- **VS Code**: Cmd+P → type `useHookName`
- **WebStorm**: Cmd+Shift+P → Search for hook
- Follow breadcrumb: `10-admin-hr/useHookName.ts`

---

## Module Export Examples

Each module exports all its hooks and types:

### 00-core/index.ts
```typescript
export { useAdvancedRoleManagement } from './useAdvancedRoleManagement';
export type * from './useAdvancedRoleManagement';
export { useApp } from './useApp';
export type * from './useApp';
export { useHospital } from './useHospital';
export type * from './useHospital';
// ... all 11 core hooks
```

### 10-admin-hr/index.ts
```typescript
export { useHRDashboard } from './useHRDashboard';
export type * from './useHRDashboard';
export { usePayrollProcessing } from './usePayrollProcessing';
export type * from './usePayrollProcessing';
export { useProfesionales } from './useProfesionales';
export type * from './useProfesionales';
// ... all 15 HR hooks
```

### shared/index.ts
```typescript
/**
 * HOSIX Shared Hooks
 * Reusable hooks used across all modules:
 * - Connectivity & sync
 * - Error handling
 * - Data fetching & caching
 * - Offline mode
 * - Generic utilities
 */

export { useSupabaseConnectivity } from './useSupabaseConnectivity';
export { useOfflineMode } from './useOfflineMode';
export { useEnhancedQuery } from './useEnhancedQuery';
// ... all 47 shared utilities
```

---

## Migration Checklist

Use this checklist as you update your codebase:

- [ ] Identify all components using old import paths
- [ ] Map hooks to their new modules
- [ ] Update import statements in components
- [ ] Run tests to verify functionality
- [ ] Test offline mode and sync (for shared hooks)
- [ ] Update component documentation
- [ ] Commit and create PR with clean import paths

---

## Troubleshooting

### Issue: `Cannot find module @hosix/hooks/...`

**Solution 1:** Ensure `tsconfig.json` has the path alias configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@hosix/hooks/*": ["packages/hosix/src/hooks/*"]
    }
  }
}
```

**Solution 2:** Use relative import as fallback:
```typescript
// Fallback
import { useHRDashboard } from '../../../packages/hosix/src/hooks/10-admin-hr';
```

### Issue: Types not found

**Solution:** Ensure types are exported in the module's `index.ts`:
```typescript
// The index.ts should include type exports
export type * from './useHRDashboard';
```

### Issue: Can't find a specific hook

**Solution:** Use the summary table above or search in VS Code:
```bash
# Search across all modules
grep -r "useHookName" packages/hosix/src/hooks/
```

---

## Quick Reference Card

**13 Modules | 160 Hooks | 12 Test Files**

```
00-core              → App & core infrastructure
01-obstetrics        → Pregnancy & birth
02-pediatrics        → Child growth & development
03-nutrition         → Nutrition & diet management
04-surgery           → Surgical & inventory
05-immunization      → Vaccines & immunization
06-medications       → Pharmacy & prescriptions
07-clinical-docs     → EHR & clinical records
08-diagnoses         → Diagnosis & comorbidity
09-imaging           → Imaging & lab results
10-admin-hr          → HR & staff management
11-admin-operations  → Operations & facilities
shared               → Cross-module utilities
```

---

## Support

**Questions?** Update this guide or create an issue.  
**Need a hook?** Check the module organization table above.  
**Found a bug?** Report it with the old import path for reference.

---

**Last Updated:** April 17, 2026  
**Next Review:** After first wave of component updates
