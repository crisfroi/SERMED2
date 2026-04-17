/**
 * HOSIX Hooks - Central Export Point
 * 
 * Organized by clinical module for maximum clarity and maintainability.
 * Each module is self-contained and can be imported directly or via this root.
 * 
 * Usage:
 * - By module: import { useChildGrowth } from '@hosix/hooks/02-pediatrics'
 * - From root: import { useChildGrowth } from '@hosix/hooks'
 * 
 * Module Structure:
 * ├── 00-core/          → Authentication, app state, fundamentals
 * ├── 01-obstetrics/    → Pregnancy, obstetric care
 * ├── 02-pediatrics/    → Child health, growth, development
 * ├── 03-nutrition/     → Nutrition, diet planning
 * ├── 04-surgery/       → Surgical procedures, OR management
 * ├── 05-immunization/  → Vaccination, immunization
 * ├── 06-medications/   → Pharmacy, prescriptions, medication
 * ├── 07-clinical-docs/ → EHR, documents, signatures
 * ├── 08-diagnoses/     → Diagnosis, ICD coding, comorbidity
 * ├── 09-imaging/       → Imaging, radiology, DICOM
 * ├── 10-admin-hr/      → HR, staffing, payroll
 * ├── 11-admin-ops/     → Operations, inventory, queues
 * └── shared/           → Connectivity, sync, utilities
 */

// Core
export * from './00-core';

// Clinical Modules
export * from './01-obstetrics';
export * from './02-pediatrics';
export * from './03-nutrition';
export * from './04-surgery';
export * from './05-immunization';
export * from './06-medications';
export * from './07-clinical-docs';
export * from './08-diagnoses';
export * from './09-imaging';

// Administrative Modules
export * from './10-admin-hr';
export * from './11-admin-operations';

// Shared
export * from './shared';
