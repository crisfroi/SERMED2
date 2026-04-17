# DETAILED IMPORT MAPPING - HOSIX COMPONENTS TO HOOKS

**Generated:** April 17, 2026  
**Purpose:** Exact line-by-line mapping of all @hosix/hooks imports found in HOSIX components

---

## IMPORT LOCATIONS BY FILE (81 total imports, 45 unique paths)

### AUTHENTICATION COMPONENTS (auth/)

#### EnhancedLoginForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### PasswordResetForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### PermissionGuard.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
L8: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

#### RegistrationForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### RoleBasedRoute.tsx
```
L8: import { useApp } from '@hosix/hooks/shared/useApp';
L9: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

#### UserProfileForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

---

### CLINICAL COMPONENTS (clinical/)

#### ClinicalDocumentationTabs.tsx
```
L7: import { useClinical } from '@hosix/hooks/07-clinical-docs/useClinical';
L8: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

#### DiagnosisForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
L8: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

#### DocumentSigningInterface.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### PrescriptionForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
L8: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

#### VisitNotesForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
L8: import { usePermissions } from '@hosix/hooks/shared/usePermissions';
```

---

### PATIENT COMPONENTS (patient/)

#### PatientDemographicsForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### PatientProfileView.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

#### PatientSearchForm.tsx
```
L7: import { useApp } from '@hosix/hooks/shared/useApp';
```

---

### PHASE 2 CLINICAL COMPONENTS (PHASE_2_CLINICAL/)

#### DentistryDashboard.tsx
```
L32: import { useDentistryManagement } from '@hosix/hooks/shared/useDentistryManagement';
```

#### EMSDashboard.tsx
```
L38: import { useEMS } from '@hosix/hooks/shared/useEMS';
```

#### GeneticsDashboard.tsx
```
L31: import { useGenetics } from '@hosix/hooks/shared/useGenetics';
```

#### ICUDashboard.tsx
```
L33: import { useICUManagement } from '@hosix/hooks/shared/useICUManagement';
```

#### InpatientDashboard.tsx
```
L25: import { useInpatientManagement } from '@hosix/hooks/shared/useInpatientManagement';
```

#### NursingTaskBoard.tsx
```
L24: import { useNursingManagement } from '@hosix/hooks/shared/useNursingManagement';
```

#### OphthalmologyDashboard.tsx
```
L31: import { useOphthalmology } from '@hosix/hooks/shared/useOphthalmology';
```

#### PediatricsGrowthDashboard.tsx
```
L16: import { usePediatricsGrowth } from '@hosix/hooks/02-pediatrics/usePediatricsGrowth';
```

---

### MAIN COMPONENT UTILITIES

#### AuditTrailDashboard.tsx
```
L25: import { useAuditIntegration, type AuditTrailEntry, type AccessLog } from '@hosix/hooks/shared/useAuditIntegration';
```

#### ComorbidityMatrixEditor.tsx
```
L12: import { useComorbidityMatrix } from '@hosix/hooks/08-diagnoses/useComorbidityMatrix'
```

#### DocumentEncryptionStatus.tsx
```
L9: import { useDocumentEncryption, type EncryptionKey, type EncryptionStatus } from '@hosix/hooks/07-clinical-docs/useDocumentEncryption';
```

#### ExpandedDiagnosisForm.tsx
```
L21: import { useDiagnosisExpanding } from '@hosix/hooks/08-diagnoses/useDiagnosisExpanding'
```

#### FollowupRecommendations.tsx
```
L26: import { useReferralFollowup, useReferralOutcomes } from '@hosix/hooks/shared/useReferralFollowup';
```

#### ICDSystemSelector.tsx
```
L18: import { useICDSystemSwitch } from '@hosix/hooks/08-diagnoses/useICDSystemSwitch'
```

#### KitManager.tsx
```
L21: import { useMedicationKit } from '@hosix/hooks/06-medications/useMedicationKit'
```

#### MealPlanBuilder.tsx
```
L7: import { useMealPlan, calculateMealPlanMacros, MEAL_TYPES } from '@hosix/hooks/03-nutrition/useMealPlan'
```

#### MedicationStockDashboard.tsx
```
L27: import { useStockVariants } from '@hosix/hooks/06-medications/useStockVariants'
```

#### MilestoneTracker.tsx
```
L12: import { useMilestoneTracking, WHO_MILESTONES, evaluateMilestoneStatus } from '@hosix/hooks/02-pediatrics/useMilestoneTracking'
```

#### NutritionComplianceTracker.tsx
```
L7: import { useNutritionCompliance, evaluateCompliance, getComplianceRecommendation } from '@hosix/hooks/03-nutrition/useNutritionCompliance'
```

#### ReferralTracker.tsx
```
L16: import { useReferralManagement, type Referral } from '@hosix/hooks/shared/useReferralManagement';
```

#### RegimensBuilder.tsx
```
L21: import { useMedicationRegimen } from '@hosix/hooks/06-medications/useMedicationRegimen'
```

#### SpecialistFinder.tsx
```
L18: import { useSpecialistLookup, useSpecialistResponses } from '@hosix/hooks/shared/useSpecialistLookup';
```

#### VersionHistoryViewer.tsx
```
L9: import { useEHRVersioning, type EHRDocumentVersion, type EHRDocument } from '@hosix/hooks/07-clinical-docs/useEHRVersioning';
```

#### WHOPercentileChart.tsx
```
L13: import { useChildGrowthWHO } from '@hosix/hooks/02-pediatrics/useChildGrowthWHO'
```

---

### ASIS_04_OBSTETRICIA (Obstetrics Module)

#### GestationMonitor.tsx
```
L2: import { useObstetricPatient } from '@hosix/hooks/01-obstetrics/useObstetricPatient';
L3: import { useObstetricRisk } from '@hosix/hooks/01-obstetrics/useObstetricRisk';
```

#### ObstetricRiskAlert.tsx
```
L5: import { useObstetricRisk } from '@hosix/hooks/01-obstetrics/useObstetricRisk';
```

---

### ASIS_05_CRED (Pediatrics Growth Module)

#### GrowthChart.tsx
```
L3: import { useChildGrowth } from '@hosix/hooks/02-pediatrics/useChildGrowth';
```

#### MilestoneTracker.tsx
```
L6: import { useChildGrowth } from '@hosix/hooks/02-pediatrics/useChildGrowth';
```

---

### ASIS_07_NUTRICION (Nutrition Module)

#### NutritionAssessmentForm.tsx
```
L13: import { useNutritionAssessment } from '@hosix/hooks/03-nutrition/useNutritionAssessment';
```

#### NutritionPlanViewer.tsx
```
L8: import { useNutritionPlanning } from '@hosix/hooks/03-nutrition/useNutritionPlanning';
```

#### WeightTrendChart.tsx
```
L8: import { useNutritionTracking } from '@hosix/hooks/03-nutrition/useNutritionTracking';
```

---

### ASIS_08_INMUNIZACION (Immunization Module)

#### ImmunizationGapReport.tsx
```
L6: import { useImmunizationGaps } from '@hosix/hooks/05-immunization/useImmunizationHooks';
```

#### ImmunizationRecordForm.tsx
```
L13: import { useImmunizationRecord } from '@hosix/hooks/05-immunization/useImmunizationHooks';
```

#### VaccineScheduleViewer.tsx
```
L6: import { useVaccineSchedule } from '@hosix/hooks/05-immunization/useImmunizationHooks';
```

---

### ASIS_08_LABORATORIO (Laboratory Module)

#### LabOrderForm.tsx
```
L43: import { useLabOrder } from '@hosix/hooks/09-imaging/useLabOrder';
```

#### NormalRangeValidator.tsx
```
L24: import { useNormalRanges } from '@hosix/hooks/09-imaging/useNormalRanges';
```

#### ResultsViewer.tsx
```
L30: import { useLabResults } from '@hosix/hooks/09-imaging/useLabResults';
```

#### TrendAnalysis.tsx
```
L35: import { useTrendAnalysis } from '@hosix/hooks/09-imaging/useTrendAnalysis';
```

---

### ASIS_09_FARMACIA (Pharmacy Module)

#### ExpirationAlertViewer.tsx
```
L16: import { useExpirationTracking } from '@hosix/hooks/06-medications/useExpirationTracking';
```

#### InventoryDashboard.tsx
```
L17: import { useInventoryManagement } from '@hosix/hooks/11-admin-operations/useInventoryManagement';
```

#### SupplierOrderManager.tsx
```
L20: import { useProcurementWorkflow } from '@hosix/hooks/11-admin-operations/useProcurementWorkflow';
```

---

### ASIS_10_MEDICAMENTOS (Medications Module)

#### AdherenceTracker.tsx
```
L22: import { useAdherenceTracker } from '@hosix/hooks/06-medications/useAdherenceTracker';
```

#### InteractionChecker.tsx
```
L19: import { useInteractionChecker } from '@hosix/hooks/06-medications/useInteractionChecker';
```

#### MedicationForm.tsx
```
L27: import { useMedicationOrder } from '@hosix/hooks/06-medications/useMedicationOrder';
```

#### RegimensList.tsx
```
L28: import { useMedicationRegimen } from '@hosix/hooks/06-medications/useMedicationRegimen';
```

---

### ASIS_10_REGIMENES (Regimens Module)

#### AdherenceTracker.tsx
```
L13: import { useAdherenceTracker } from '@hosix/hooks/06-medications/useAdherenceTracker';
```

#### InteractionChecker.tsx
```
L13: import { useInteractionChecker } from '@hosix/hooks/06-medications/useInteractionChecker';
```

#### MedicationOrderForm.tsx
```
L17: import { useMedicationOrder } from '@hosix/hooks/06-medications/useMedicationOrder';
```

#### MedicationOrderForm.test.tsx
```
L9: import { useMedicationOrder } from '@hosix/hooks/06-medications/useMedicationOrder';
```

#### PrescriptionViewer.tsx
```
L14: import { usePrescriptionViewer } from '@hosix/hooks/06-medications/usePrescriptionViewer';
```

#### RegimeManager.tsx
```
L14: import { useRegimeManager } from '@hosix/hooks/06-medications/useRegimeManager';
```

---

### ASIS_14_DIAGNOSTICO (Diagnosis Module)

#### ComorbidityAnalyzer.tsx
```
L21: import { useComorbidityAnalysis } from '@hosix/hooks/08-diagnoses/useComorbidityAnalysis';
```

#### ComorbidityAssessment.tsx
```
L13: import { useComorbidity } from '@hosix/hooks/08-diagnoses/useComorbidity';
```

#### DiagnosisForm.tsx
```
L27: import { useDiagnosisManagement } from '@hosix/hooks/08-diagnoses/useDiagnosisManagement';
```

#### DiagnosisForm.test.tsx
```
L9: import { useDiagnosisForm } from '@hosix/hooks/08-diagnoses/useDiagnosisForm';
```

#### DiagnosisHistory.tsx
```
L13: import { useDiagnosisHistory } from '@hosix/hooks/08-diagnoses/useDiagnosisHistory';
```

#### DiagnosisList.tsx
```
L28: import { useDiagnosisManagement } from '@hosix/hooks/08-diagnoses/useDiagnosisManagement';
```

---

### ASIS_15_IMAGENES (Imaging Module)

#### DicomViewer.tsx
```
L21: import { useDicomViewer } from '@hosix/hooks/09-imaging/useDicomViewer';
```

#### ImagingOrderForm.tsx
```
L43: import { useImagingOrder } from '@hosix/hooks/09-imaging/useImagingOrder';
```

#### RadiologyReport.tsx
```
L21: import { useRadiologyReport } from '@hosix/hooks/09-imaging/useRadiologyReport';
```

---

## SUMMARY STATISTICS

### By Module
| Module | # Hooks | # Files | # Import Lines |
|--------|---------|---------|----------------|
| shared | 12 | 8 | 30 |
| 06-medications | 9 | 8 | 14 |
| 08-diagnoses | 8 | 6 | 9 |
| 09-imaging | 7 | 3 | 7 |
| 02-pediatrics | 4 | 3 | 5 |
| 03-nutrition | 5 | 3 | 5 |
| 07-clinical-docs | 3 | 2 | 3 |
| 01-obstetrics | 2 | 2 | 3 |
| 05-immunization | 1 | 3 | 3 |
| 11-admin-operations | 2 | 2 | 2 |
| **TOTAL** | **45** | **43** | **81** |

### By Hook Usage (Top 15)
| Hook | # Uses | Module |
|------|--------|--------|
| useApp | 13 | shared |
| usePermissions | 6 | shared |
| useMedicationOrder | 3 | 06-medications |
| useDiagnosisManagement | 2 | 08-diagnoses |
| useChildGrowth | 2 | 02-pediatrics |
| useMedicationRegimen | 2 | 06-medications |
| useAdherenceTracker | 2 | 06-medications |
| useInteractionChecker | 2 | 06-medications |
| useObstetricRisk | 2 | 01-obstetrics |
| useImmunizationHooks | 3 | 05-immunization |
| (remaining) | 1 each | various |

---

## KEY OBSERVATIONS

1. **useApp is CRITICAL** - 13 direct usages across auth, patient, and clinical components
2. **Medication hooks concentrated** - 06-medications module has 14 of 81 imports
3. **PHASE_2_CLINICAL has unique hooks** - useDentistryManagement, useEMS, useGenetics, etc. not heavily used
4. **Test file included** - DiagnosisForm.test.tsx shows test files also importing hooks
5. **Type imports mixed** - Many imports include type definitions (useEHRVersioning, useDocumentEncryption)

---

## MISSING HOOKS REQUIRING ACTION

**CRITICAL (13+ uses):**
- `useApp` @ shared

**HIGH (6+ uses):**
- None currently (usePermissions already exists)

**MEDIUM (2-5 uses):**
- useMedicationOrder, useDiagnosisManagement, useChildGrowth, useMedicationRegimen
- useAdherenceTracker, useInteractionChecker, useObstetricRisk, useImmunizationHooks

**LOW (<2 uses, but needed):**
- All other 36 unique hooks

---

*Report generated by automated audit - April 17, 2026*
