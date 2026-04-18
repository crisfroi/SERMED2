/**
 * HOSIX Hooks - Modular Structure
 * 
 * Organized hooks by clinical domain for HOSIX modules.
 * NOTE: Clinical domain hooks (01-11) are temporarily disabled due to import resolution issues.
 * Only shared hooks are exported for now.
 */

// TEMPORARILY DISABLED - Clinical domain hooks with unresolved imports
// These need to be fixed before re-enabling:
// - 01-obstetrics
// - 02-pediatrics
// - 03-nutrition
// - 04-surgery
// - 05-immunization
// - 06-medications
// - 07-clinical-docs
// - 08-diagnoses
// - 09-imaging
// - 10-admin-hr
// - 11-admin-operations

// shared (includes existing hooks) - ACTIVE
export * from './shared';

// Legacy exports - ACTIVE
export { useClinical } from './useClinical';
export { usePatient } from './usePatient';
export { usePermissions } from './usePermissions';
