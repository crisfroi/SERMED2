/**
 * HOSIX Hooks - Modular Structure
 * 
 * Organized hooks by clinical domain for HOSIX modules.
 */

// 01-obstetrics
export * from './01-obstetrics';

// 02-pediatrics
export * from './02-pediatrics';

// 03-nutrition
export * from './03-nutrition';

// 04-surgery
export * from './04-surgery';

// 05-immunization
export * from './05-immunization';

// 06-medications
export * from './06-medications';

// 07-clinical-docs
export * from './07-clinical-docs';

// 08-diagnoses
export * from './08-diagnoses';

// 09-imaging
export * from './09-imaging';

// 10-admin-hr
export * from './10-admin-hr';

// 11-admin-operations
export * from './11-admin-operations';

// shared (includes existing hooks)
export * from './shared';

// Legacy exports
export { useClinical } from './useClinical';
export { usePatient } from './usePatient';
export { usePermissions } from './usePermissions';
