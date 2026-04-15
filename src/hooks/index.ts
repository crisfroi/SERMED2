// @ts-nocheck
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
