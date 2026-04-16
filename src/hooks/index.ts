// Nutrition Hooks
export {
  useNutritionAssessment,
  useNutritionTracking,
  useNutritionPlanning,
} from './useNutritionHooks';

// Immunization Hooks
export {
  useImmunizationRecord,
  useVaccineSchedule,
  useImmunizationGaps,
  useVaccineLotTracking,
} from './useImmunizationHooks';

// Pharmacy Hooks
export {
  useInventoryManagement,
  useProcurementWorkflow,
  useExpirationTracking,
} from './usePharmacyHooks';

// Laboratory Hooks (Week 5)
export {
  useLabOrderManagement,
  useLabResults,
  useQualityControl,
} from './useLabHooks';

// Referral Hooks (Week 5)
export {
  useReferralManagement,
  useSpecialistResponses,
  useReferralFollowup,
  useReferralOutcomes,
} from './useReferralHooks';

// Pharmacotherapy Hooks (Week 5)
export {
  usePrescriptionManagement,
  useDrugInteractionCheck,
  useMedicationAdherence,
  useAdverseMedicationEvents,
} from './usePharmacotherapyHooks';

// Hospital Management Hooks
export { useHospital } from './useHospital';

// ADMIN Module Hooks
export { useHRDashboard } from './useHRDashboard';

// Pediatric/CRED Module Hooks (ASIS_05 - Expansion)
export { usePediatricInfo } from './usePediatricInfo';
export { useMilestoneTracking } from './useMilestoneTracking';
export { useChildGrowthWHO } from './useChildGrowthWHO';

// Nutrition Module Hooks (ASIS_07 - Expansion)
export { useNutritionAssessment } from './useNutritionAssessment';
export { useMealPlan } from './useMealPlan';
export { useNutritionCompliance } from './useNutritionCompliance';
export { useReportsAndAnalytics } from './useReportsAndAnalytics';
export { useQueueManagement } from './useQueueManagement';

// Diagnosis Hooks
export { useDiagnosisForm } from './useDiagnosisForm';
export { useDiagnosisManagement } from './useDiagnosisManagement';
export { useComorbidityAnalysis } from './useComorbidityAnalysis';

// Referral Specialist Hooks
export { useReferralSpecialist } from './useReferralSpecialist';

// ═══════════════════════════════════════════════════════════════════
// ASIS_10: MEDICAMENTOS (Stock & Prescription Management)
// ═══════════════════════════════════════════════════════════════════

// Stock Variant Hooks (Stock Management by Department)
export { useStockVariants } from './useStockVariants';

// Medication Regimen Hooks (Prescription Management)
export { useMedicationRegimen } from './useMedicationRegimen';

// Medication Kit Hooks (Predefined Kits)
export { useMedicationKit } from './useMedicationKit';

// Stock Reservation Hooks (Patient-Level Reservations)
export { useStockReservation } from './useStockReservation';

// ═══════════════════════════════════════════════════════════════════
// ASIS_14: DIAGNÓSTICO (ICD Support, Comorbidity, Expansion)
// ═══════════════════════════════════════════════════════════════════

// Comorbidity Management Hooks
export { useComorbidityMatrix } from './useComorbidityMatrix';

// ICD System Support Hooks (ICD-9, ICD-10, ICD-11)
export { useICDSystemSwitch } from './useICDSystemSwitch';

// Diagnosis Expansion Hooks (Automatic Secondary Diagnosis)
export { useDiagnosisExpanding } from './useDiagnosisExpanding';

// ═══════════════════════════════════════════════════════════════════
// ASIS_13: EHR (Electronic Health Records, Versioning, Encryption)
// ═══════════════════════════════════════════════════════════════════

// EHR Versioning Hooks (Document Versioning, History, Rollback)
export { useEHRVersioning } from './useEHRVersioning';

// Document Encryption Hooks (Encryption, Decryption, Key Management)
export { useDocumentEncryption } from './useDocumentEncryption';

// Audit Trail Integration Hooks (Access Logging, Compliance Reporting)
export { useAuditIntegration } from './useAuditIntegration';

// ═══════════════════════════════════════════════════════════════════
// ASIS_11: REFERENCIA (Referral Workflow & Follow-up)
// ═══════════════════════════════════════════════════════════════════

// Referral Management Hooks (Create, Track, Update Referrals)
export { useReferralManagement } from './useReferralManagement';

// Specialist Lookup & Response Hooks (Find specialists, get responses)
export { useSpecialistLookup, useSpecialistResponses } from './useSpecialistLookup';

// Referral Follow-up & Outcomes Hooks (Schedule follow-ups, record outcomes)
export { useReferralFollowup, useReferralOutcomes } from './useReferralFollowup';

// ═══════════════════════════════════════════════════════════════════
// FASE 2: CLINICAL MODULES (Weeks 6-14)
// ═══════════════════════════════════════════════════════════════════

// Inpatient Management Hooks (Hospitalization, Bed Management)
export { useInpatientManagement } from './useInpatientManagement';

// ICU Management Hooks (Critical Care, Vital Monitoring, Severity Scoring)
export { useICUManagement } from './useICUManagement';

// Nursing Management Hooks (Task Assignment, Care Orders, Shift Management)
export { useNursingManagement } from './useNursingManagement';

// Dentistry Management Hooks (Dental Exams, Procedures, Risk Assessment)
export { useDentistryManagement } from './useDentistryManagement';

// Pediatrics Growth Hooks (Growth Tracking, Developmental Milestones)
export { usePediatricsGrowth } from './usePediatricsGrowth';

// Ophthalmology Hooks (Eye Exams, Prescriptions, Ocular Diseases)
export { useOphthalmology } from './useOphthalmology';

// Genetics Hooks (Genetic Tests, Family History, Risk Assessment)
export { useGenetics } from './useGenetics';

// EMS Hooks (Emergency Calls, Ambulance Dispatch, Response Metrics)
export { useEMS } from './useEMS';

// Contact Tracing Hooks (Disease Tracking, Outbreak Management)
export { useContactTracing } from './useContactTracing';

// Imaging Worklist Hooks (DICOM Management, Radiology Workflow)
export { useImagingWorklist } from './useImagingWorklist';

// Appointment Calendar Hooks (Scheduling, Availability, Reminders)
export { useAppointmentCalendar } from './useAppointmentCalendar';

// Federation Hooks (Multi-facility Sync, Data Integrity, Conflict Resolution)
export { useFederation } from './useFederation';
