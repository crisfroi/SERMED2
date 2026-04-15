// @ts-nocheck
// ============================================================================
// ASIS 13 Test Suite Index
// Propósito: Centralizar y exportar todos los tests del módulo HME
// ============================================================================

// Component Tests
export { default as DashboardTests } from './ASIS_13_EHR/ElectronicHealthRecordDashboard.test';

// Hook Tests
export { default as EHRHookTests } from '../hooks/useElectronicHealthRecord.test';
export { default as ThalamusSyncTests } from '../hooks/useThalamusSync.test';

// Integration Tests
export { default as IntegrationTests } from './ASIS_13_Integration.test';

/**
 * Test Execution Commands:
 * 
 * Run all ASIS 13 tests:
 * npm run test -- src/__tests__/ASIS_13*.test.ts
 * 
 * Run with coverage:
 * npm run test:coverage -- src/__tests__ src/components/ASIS_13* src/hooks/use*Ehr* src/hooks/useThalamusSync*
 * 
 * Watch mode:
 * npm run test:watch -- src/__tests__/ASIS_13* src/components/ASIS_13* src/hooks/use*
 * 
 * Run specific test file:
 * npm run test -- src/__tests__/ASIS_13_Integration.test.ts
 * 
 * Test counts:
 * - Component Tests: ~23 tests
 * - Hook Tests: ~35 tests  
 * - Integration Tests: ~28 tests
 * - THALAMUS Sync Tests: ~32 tests
 * TOTAL: ~118 test cases
 */

/**
 * Test Coverage Map:
 * 
 * ASIS_13_EHR Module:
 * ├── ElectronicHealthRecordDashboard.test.tsx
 * │   ├── Smoke Tests
 * │   ├── Tab Navigation
 * │   ├── THALAMUS Sync Status
 * │   ├── Action Buttons
 * │   ├── Transfer Modal
 * │   ├── Metrics Display
 * │   ├── HIPAA Compliance
 * │   └── Error Handling
 * │
 * ├── useElectronicHealthRecord.test.ts
 * │   ├── Initialization
 * │   ├── Queries (EHR, Episodes, Documents)
 * │   ├── Mutations (Update, Export, Consolidate)
 * │   ├── HIPAA Access Logging
 * │   ├── State Management
 * │   ├── Export Formats (PDF, HL7, FHIR)
 * │   └── Error Handling
 * │
 * ├── useThalamusSync.test.ts [NEW]
 * │   ├── Cross-Hospital Queries
 * │   ├── Patient Master Index (PMI)
 * │   ├── EHR Synchronization
 * │   ├── Transfer Coordination
 * │   ├── Cross-Hospital History
 * │   ├── Time Tracking
 * │   └── Error Handling
 * │
 * └── ASIS_13_Integration.test.ts
 *     ├── Complete EHR Workflow
 *     ├── Episode Links & Clinical Events
 *     ├── Document Management
 *     ├── HIPAA Audit Trail
 *     ├── Export Functionality
 *     ├── Permission & Access Control
 *     └── Error Handling & Edge Cases
 */
