# HOSIX HOOKS IMPORT AUDIT - COMPREHENSIVE RESEARCH REPORT

**Date:** April 17, 2026  
**Status:** ⚠️ **RESEARCH ONLY - NO MODIFICATIONS MADE**  
**Scope:** Scan all @hosix/hooks imports in HOSIX components and identify what exists vs. what's missing

---

## EXECUTIVE SUMMARY

The HOSIX monorepo is in a **BROKEN HOOKS STATE**:
- ✗ 81 hook imports found in HOSIX components
- ✗ All imports expect paths like `@hosix/hooks/{module}/useHook`
- ✗ The modular folder structure in `packages/hosix/src/hooks/` **NO LONGER EXISTS**
- ✓ Only 4 files remain: `index.ts`, `useClinical.ts`, `usePatient.ts`, `usePermissions.ts`
- ✓ All ~160 hooks exist in `src/hooks/` (flat structure)
- ✓ The organized structure was supposedly created (per HOOKS_MIGRATION_COMPLETE.md) but has been deleted

### Critical Issue
Previous migration report (HOOKS_MIGRATION_COMPLETE.md from April 17, 2026) claims 160 hooks were organized into 13 modules, but the actual directory structure is missing.

---

## AUDIT RESULTS BY MODULE

### 01-OBSTETRICS (2 hooks needed, 0 exist in packages/hosix/)
- `useObstetricPatient` - used in GestationMonitor.tsx:L2
- `useObstetricRisk` - used in GestationMonitor.tsx:L3, ObstetricRiskAlert.tsx:L5
- **Status:** ❌ BROKEN - folder missing
- **All hooks exist in:** `src/hooks/useObstetricPatient.ts`, `src/hooks/useObstetricRisk.ts`

### 02-PEDIATRICS (4 hooks needed, 0 exist in packages/hosix/)
- `useChildGrowth` - 2 usage sites
- `useChildGrowthWHO` - 1 usage site
- `usePediatricsGrowth` - 1 usage site
- `useMilestoneTracking` - 1 usage site
- **Status:** ❌ BROKEN - folder missing
- **All hooks exist in:** `src/hooks/`

### 03-NUTRITION (5 hooks needed, 0 exist in packages/hosix/)
- `useMealPlan` - 1 usage site
- `useNutritionCompliance` - 1 usage site
- `useNutritionAssessment` - 1 usage site
- `useNutritionPlanning` - 1 usage site
- `useNutritionTracking` - 1 usage site
- **Status:** ❌ BROKEN - folder missing

### 05-IMMUNIZATION (1 aggregator hook needed, 0 exist in packages/hosix/)
- `useImmunizationHooks` (aggregator) - exports 3 hooks: useVaccineSchedule, useImmunizationRecord, useImmunizationGaps
- **Status:** ❌ BROKEN - folder missing

### 06-MEDICATIONS (9 hooks needed, 0 exist in packages/hosix/)
**Most hook dependencies in HOSIX!**
- `useMedicationKit` - 1 usage
- `useStockVariants` - 1 usage
- `useMedicationRegimen` - 2 usages
- `useMedicationOrder` - 3 usages (including test)
- `usePrescriptionViewer` - 1 usage
- `useExpirationTracking` - 1 usage
- `useRegimeManager` - 1 usage
- `useAdherenceTracker` - 2 usages
- `useInteractionChecker` - 2 usages
- **Status:** ❌ BROKEN - folder missing
- **Total References:** 14 import statements

### 07-CLINICAL-DOCS (3 hooks needed, 1 exists)
- `useEHRVersioning` - 1 usage (`src/hooks/useEHRVersioning.ts` ✓ exists)
- `useDocumentEncryption` - 1 usage (`src/hooks/useDocumentEncryption.ts` ✓ exists)
- `useClinical` - 1 usage ✅ **ALREADY EXISTS** in `packages/hosix/src/hooks/useClinical.ts`
- **Status:** ⚠️ PARTIALLY BROKEN

### 08-DIAGNOSES (8 hooks needed, 0 exist in packages/hosix/)
- `useICDSystemSwitch` - 1 usage
- `useDiagnosisExpanding` - 1 usage
- `useComorbidityMatrix` - 1 usage
- `useDiagnosisManagement` - 2 usages
- `useDiagnosisHistory` - 1 usage
- `useDiagnosisForm` - 1 usage (test)
- `useComorbidity` - 1 usage
- `useComorbidityAnalysis` - 1 usage
- **Status:** ❌ BROKEN - folder missing
- **Total References:** 9 import statements

### 09-IMAGING (7 hooks needed, 0 exist in packages/hosix/)
- `useLabOrder` - 1 usage
- `useNormalRanges` - 1 usage
- `useLabResults` - 1 usage
- `useTrendAnalysis` - 1 usage
- `useDicomViewer` - 1 usage
- `useImagingOrder` - 1 usage
- `useRadiologyReport` - 1 usage
- **Status:** ❌ BROKEN - folder missing
- **Total References:** 7 import statements

### 11-ADMIN-OPERATIONS (2 hooks needed, 0 exist in packages/hosix/)
- `useProcurementWorkflow` - 1 usage
- `useInventoryManagement` - 1 usage
- **Status:** ❌ BROKEN - folder missing

### SHARED (12 hooks needed, 3 exist)
**MOST CRITICAL - Highest usage count**
- `useApp` - **13 USAGES** (AUTH, patient, clinical forms) ❌ MISSING
- `usePermissions` - **6 USAGES** ✅ EXISTS in `packages/hosix/src/hooks/usePermissions.ts`
- `useReferralManagement` - 1 usage ❌ MISSING
- `useReferralFollowup` - 1 usage ❌ MISSING
- `useSpecialistLookup` - 1 usage ❌ MISSING
- `useAuditIntegration` - 1 usage ❌ MISSING
- `useOphthalmology` - 1 usage ❌ MISSING
- `useNursingManagement` - 1 usage ❌ MISSING
- `useInpatientManagement` - 1 usage ❌ MISSING
- `useICUManagement` - 1 usage ❌ MISSING
- `useGenetics` - 1 usage ❌ MISSING
- `useEMS` - 1 usage ❌ MISSING
- `useDentistryManagement` - 1 usage ❌ MISSING
- **Total SHARED References:** 30+ import statements
- **Status:** ⚠️ MOSTLY BROKEN - Only 3 of 12 hooks exist

---

## IMPORT FREQUENCY ANALYSIS

| Rank | Hook Name | # Usages | Module | Status |
|------|-----------|----------|--------|--------|
| 1 | `useApp` | 13 | shared | ❌ MISSING |
| 2 | `usePermissions` | 6 | shared | ✅ EXISTS |
| 3-10 | Medication hooks | 2 each | 06-medications | ❌ MISSING |
| 11-40 | Other hooks | 1 each | various | ❌ MISSING |

---

## FOLDER STRUCTURE STATUS

```
Current State (BROKEN):
packages/hosix/src/hooks/
├── index.ts
├── useClinical.ts        ✓ (exists, but not in organized folder)
├── usePatient.ts         ✓ (exists, but not in organized folder) 
└── usePermissions.ts     ✓ (exists, but not in organized folder)

Expected by HOSIX Components:
packages/hosix/src/hooks/
├── 01-obstetrics/
│   ├── useObstetricPatient.ts
│   ├── useObstetricRisk.ts
│   └── index.ts
├── 02-pediatrics/
│   ├── useChildGrowth.ts
│   ├── useChildGrowthWHO.ts
│   ├── useMilestoneTracking.ts
│   ├── usePediatricsGrowth.ts
│   └── index.ts
├── 03-nutrition/
│   ├── useMealPlan.ts
│   ├── useNutritionAssessment.ts
│   ├── useNutritionCompliance.ts
│   ├── useNutritionPlanning.ts
│   ├── useNutritionTracking.ts
│   └── index.ts
├── 05-immunization/
│   ├── useImmunizationHooks.ts
│   └── index.ts
├── 06-medications/
│   ├── useAdherenceTracker.ts
│   ├── useExpirationTracking.ts
│   ├── useInteractionChecker.ts
│   ├── useMedicationKit.ts
│   ├── useMedicationOrder.ts
│   ├── useMedicationRegimen.ts
│   ├── usePrescriptionViewer.ts
│   ├── useRegimeManager.ts
│   ├── useStockVariants.ts
│   └── index.ts
├── 07-clinical-docs/
│   ├── useClinical.ts    ✓ (already exists here!)
│   ├── useDocumentEncryption.ts
│   ├── useEHRVersioning.ts
│   └── index.ts
├── 08-diagnoses/
│   ├── useComorbidity.ts
│   ├── useComorbidityAnalysis.ts
│   ├── useComorbidityMatrix.ts
│   ├── useDiagnosisExpanding.ts
│   ├── useDiagnosisForm.ts
│   ├── useDiagnosisHistory.ts
│   ├── useDiagnosisManagement.ts
│   ├── useICDSystemSwitch.ts
│   └── index.ts
├── 09-imaging/
│   ├── useDicomViewer.ts
│   ├── useImagingOrder.ts
│   ├── useLabOrder.ts
│   ├── useLabResults.ts
│   ├── useNormalRanges.ts
│   ├── useRadiologyReport.ts
│   ├── useTrendAnalysis.ts
│   └── index.ts
├── 11-admin-operations/
│   ├── useInventoryManagement.ts
│   ├── useProcurementWorkflow.ts
│   └── index.ts
├── shared/
│   ├── useApp.ts
│   ├── useAuditIntegration.ts
│   ├── useClinical.ts       ⚠️ (duplicate - also in 07-clinical-docs? or moved?)
│   ├── useDentistryManagement.ts
│   ├── useEMS.ts
│   ├── useGenetics.ts
│   ├── useICUManagement.ts
│   ├── useInpatientManagement.ts
│   ├── useNursingManagement.ts
│   ├── useOphthalmology.ts
│   ├── usePatient.ts        ✓ (already exists at root)
│   ├── usePermissions.ts    ✓ (already exists at root)
│   ├── useReferralFollowup.ts
│   ├── useReferralManagement.ts
│   ├── useSpecialistLookup.ts
│   └── index.ts
└── index.ts                  ✓ (exists - needs updating)
```

---

## MISSING MODULES

These modules are NOT created yet, but might be needed for future HOSIX features:
- `00-core` - Core infrastructure (useApp is in shared currently)
- `04-surgery` - Surgical procedures
- `10-admin-hr` - HR and staff management

---

## KEY FINDINGS

### ✅ What Exists
1. **All source hooks in `src/hooks/`** - 160+ hooks present
   - Including: useApp, usePermissions, useAsistencia, useCarnetGeneration, useNominasPaymentSystem, etc.
   
2. **Three hooks in packages/hosix/src/hooks/**
   - useClinical (07-clinical-docs)
   - usePatient (shared)
   - usePermissions (shared)

3. **Complete import mapping** - All 81 imports successfully traced

### ❌ What's Missing
1. **Modular folder structure** in `packages/hosix/src/hooks/`
   - 10 folders need to be created
   - 46 hooks need to be organized into folders
   - 13 index.ts files need to be generated

2. **46 unique hooks** required by HOSIX but not in packages/hosix/src/hooks/
   - useApp (Critical - 13 usages)
   - All medication hooks (9 hooks, 14 usages)
   - All diagnosis hooks (8 hooks, 9 usages)
   - All imaging hooks (7 hooks, 7 usages)
   - Many shared and domain-specific hooks

---

## IMPORT BREAKDOWN BY LOCATION

| Location | Count | Status |
|----------|-------|--------|
| **packages/hosix/src/hooks/** (exists) | 3 | ✓ |
| **src/hooks/** (exists but not organized) | 160+ | ✓ |
| **Required by HOSIX** | 46 | ❌ |
| **Total unique @hosix/hooks paths** | 45 | ❌ |

---

## CRITICAL DECISION POINTS

### 1. **Hook Ownership - HOSIX vs RENAPROSA**
Some hooks are used by BOTH systems and should NOT be moved:
- ❌ DO NOT move `useAsistencia` (RENAPROSA-only)
- ❌ DO NOT move `useCarnetGeneration` (RENAPROSA-only)
- ❌ DO NOT move `useNominasPaymentSystem` (RENAPROSA-only)
- ❌ DO NOT move `useDynamicForms` (RENAPROSA-only)
- ❌ DO NOT move `useUserManagement` (RENAPROSA-only)
- ✓ DO move `useApp` (shared infrastructure, used by HOSIX)
- ✓ DO move `usePermissions` (shared infrastructure, used by HOSIX)

### 2. **Aggregator Hooks**
Some hooks in src/hooks serve as aggregators:
- `useImmunizationHooks` exports: useVaccineSchedule, useImmunizationRecord, useImmunizationGaps
- Must maintain when copying

### 3. **Duplicate Files**
`useClinical.ts` appears to be in scope both for:
- `@hosix/hooks/07-clinical-docs/useClinical` (expected by components)
- File exists but location is ambiguous

---

## RECOMMENDATIONS

### Immediate Actions
1. **DO NOT DELETE** anything without understanding dependencies
2. **RECREATE** the 10 module folders in `packages/hosix/src/hooks/`
3. **COPY** each required hook from `src/hooks/` to appropriate `packages/hosix/src/hooks/{module}/`
4. **GENERATE** index.ts in each module exporting all hooks
5. **VERIFY** that RENAPROSA imports still work from `src/hooks/`

### Organization Strategy
```
src/hooks/                          (RENAPROSA + Shared)
  ├── useAsistencia.ts             (RENAPROSA-only)
  ├── useCarnetGeneration.ts       (RENAPROSA-only)
  ├── useNominasPaymentSystem.ts   (RENAPROSA-only)
  ├── useApp.ts                    (SHARED - copy to packages/hosix)
  ├── usePermissions.ts            (SHARED - copy to packages/hosix)
  ├── ... 160+ other hooks

packages/hosix/src/hooks/           (HOSIX Organized)
  ├── 01-obstetrics/
  │   ├── useObstetricPatient.ts   (copied from src/hooks)
  │   └── ... (2 total)
  ├── 02-pediatrics/
  │   └── ... (4 hooks)
  ├── ... (10 modules)
  └── shared/
      ├── useApp.ts                (copied from src/hooks)
      ├── usePermissions.ts        (moved from root)
      └── ... (12 hooks)
```

---

## NEXT STEPS FOR IMPLEMENTATION

1. ✓ **AUDIT COMPLETE** - All imports mapped
2. ⏳ **DECISION NEEDED** - Which hooks to copy vs move vs keep in src/hooks
3. ⏳ **STRUCTURE NEEDED** - Create folder hierarchy
4. ⏳ **COPY OPERATION** - Systematic hook migration
5. ⏳ **VALIDATION** - Verify all imports resolve
6. ⏳ **CLEANUP** - Remove unnecessary test files or duplicates

---

## SUPPORTING DATA FILES

- **HOOKS_IMPORT_AUDIT_ANALYSIS.json** - Structured import data with frequencies
- **HOOKS_MIGRATION_COMPLETE.md** - Previous migration report (for reference)

---

**Report Generated:** April 17, 2026  
**Analysis Type:** Research Only - No Code Modifications  
**Recommendation:** Do not proceed without addressing the broken folder structure
