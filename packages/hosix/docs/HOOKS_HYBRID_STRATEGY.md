## PHASE H2-CORRECTED: PRECISE HOOKS ANALYSIS

### Strategy: HYBRID APPROACH
- Hooks used ONLY by HOSIX → Move to `packages/hosix/src/hooks/{module}/`
- Hooks shared (RENAPROSA + HOSIX) → KEEP in `src/hooks/`
- HOSIX imports shared from `@/hooks/`
- HOSIX imports HOSIX-specific from `@hosix/hooks/{module}/`

---

## HOSIX-SPECIFIC HOOKS (Safe to keep in @hosix/hooks/)
Based on grep analysis - these are actually imported by HOSIX components:

### 01-Obstetrics ✓
- useObstetricPatient (used in GestationMonitor.tsx)
- useObstetricRisk (used in ObstetricRiskAlert.tsx, GestationMonitor.tsx)
- usePregnancyGestationalAge (if used in pregnancy components)

### 02-Pediatrics ✓
- useChildGrowthWHO (used in WHOPercentileChart.tsx)
- usePediatricsGrowth (used in PediatricsGrowthDashboard.tsx)
- useMilestoneTracking (if used in milestone components)

### 03-Nutrition ✓
- useMealPlan (likely used)
- useNutritionTracking (likely used)

### 04-Surgery (needs verification)
- useStockReservation
- useInventoryManagement (also 11-ops?)

### 06-Medications ✓
- useMedicationRegimen (used in RegimensBuilder.tsx)
- useExpirationTracking (used in ExpirationAlertViewer.tsx)
- usePrescriptionViewer (likely)

### 07-Clinical-Docs ✓
- useEHRVersioning (used in VersionHistoryViewer.tsx)
- useEHR*, useElectronicHealthRecord

### 08-Diagnoses ✓
- useDiagnosisManagement (used in DiagnosisList.tsx, DiagnosisForm.tsx)
- useDiagnosisHistory (used in DiagnosisHistory.tsx)
- useDiagnosisForm
- useComorbidity*
- useICD*

### 09-Imaging
- useImagingOrder, useDicomViewer, useRadiologyReport (likely used)

### 11-Admin-Operations ✓
- useInventoryManagement (used in InventoryDashboard.tsx)
- useProcurementWorkflow (used in SupplierOrderManager.tsx)

### Shared (in PHASE_2_CLINICAL & common) ✓
- usePediatricsGrowth
- useOphthalmology (used in OphthalmologyDashboard.tsx)
- useNursingManagement (used in NursingTaskBoard.tsx)
- useInpatientManagement (used in InpatientDashboard.tsx)
- useICUManagement (used in ICUDashboard.tsx)
- useGenetics (used in GeneticsDashboard.tsx)
- useEMS (used in EMSDashboard.tsx)
- useAuditIntegration (used in AuditTrailDashboard.tsx)
- useSpecialistLookup (used in SpecialistFinder.tsx)
- useReferralManagement (used in ReferralTracker.tsx)

---

## RENAPROSA-ONLY HOOKS (KEEP in src/hooks/)
These should NOT be in packages/hosix:

- useApp.ts ✓ KEEP (RENAPROSA app state)
- useUserManagement.ts ✓ KEEP (RENAPROSA users)
- useDynamicForms.ts ✓ KEEP (Form builder)
- useErrorAnalysis.ts ✓ KEEP (Error tracking)
- usePendingSignatures.ts ✓ KEEP (Signature workflow)
- useExpedienteWorkflow.ts ✓ KEEP (RENAPROSA workflow)
- usePayrollProcessing.ts ✓ KEEP (RENAPROSA payroll)
- useNominasPaymentSystem.ts ✓ KEEP (RENAPROSA)
- useNominasPaymentSystemV2.ts ✓ KEEP (RENAPROSA)
- useProfesionales.ts ✓ KEEP (RENAPROSA)
- useProfesionalesMutations.ts ✓ KEEP (RENAPROSA)
- useExportarEmpleados.ts ✓ KEEP (RENAPROSA)
- useReportsAndAnalytics.ts ✓ KEEP (RENAPROSA)
- useReportesAsistencia.ts ✓ KEEP (RENAPROSA)
- useTrendAnalysis.ts ✓ KEEP (RENAPROSA)
- useEstadisticas.ts ✓ KEEP (RENAPROSA)
- useEstadisticasAvanzadas.ts ✓ KEEP (RENAPROSA)
- useGeographicAnalytics.ts ✓ KEEP (RENAPROSA)
- useGeoDistrictStats.ts ✓ KEEP (RENAPROSA)
- useAdvancedAnalytics.ts ✓ KEEP (RENAPROSA)
- useReferralManagement.ts (SHARED - used by RENAPROSA too)
- useReferralFollowup.ts ✓ KEEP (RENAPROSA)
- useReferralHooks.ts ✓ KEEP (RENAPROSA)
- useCarnetGeneration.ts ✓ KEEP (RENAPROSA carnet system)
- useCarnetQueue.ts ✓ KEEP (RENAPROSA)
- useGenerateCarnet.ts ✓ KEEP (RENAPROSA)
- useFormationSegmentation.ts ✓ KEEP (RENAPROSA)
- useAllFormationStats.ts ✓ KEEP (RENAPROSA)
- useAccreditationStatusUpdate.ts ✓ KEEP (RENAPROSA)
- useAsistencia.ts ✓ KEEP (RENAPROSA attendance)
- useAsistenciaConsolidada.ts ✓ KEEP (RENAPROSA)
- useGuardiaAsistenciaIntegration.ts ✓ KEEP (RENAPROSA)
- useTurnosBio.ts ✓ KEEP (RENAPROSA)
- useTurnosOptimizados.ts ✓ KEEP (RENAPROSA)
- useCuadrantesBio.ts ✓ KEEP (RENAPROSA)
- useHorariosBase.ts ✓ KEEP (RENAPROSA)
- useCenterSync.ts ✓ KEEP (RENAPROSA with biometric)
- useBiometricMapping.ts ✓ KEEP (RENAPROSA biometric)
- useBiometricSync.ts ✓ KEEP (RENAPROSA biometric)

---

## SHARED HOOKS (Both RENAPROSA + HOSIX use)
Keep in src/hooks, but HOSIX will import from there:

- useSupabaseConnectivity.ts (both need)
- useSupabaseHealth.ts (both need)
- useOfflineMode.ts (both need)
- useOfflineSync.ts (both need)
- useNetworkStatus.ts (both need)
- useSyncStatus.ts (both need)
- useEnhancedQuery.ts (both need)
- useEnhancedErrorHandler.ts (both need)
- useDashboardNavigation.ts (both need)
- useAppointmentCalendar.ts (both need)
- useGlobalSearch.ts (both need)
- useRolePermissions.ts (both need)
- useRoleBasedData.ts (both need)

---

## Action for Next Session
1. Clean up imports in HOSIX components to reference correct paths
2. Verify BOTH import styles work (shared from @/hooks, specific from @hosix/hooks)
3. Test RENAPROSA components still function
4. Later: Clean up if verified working
