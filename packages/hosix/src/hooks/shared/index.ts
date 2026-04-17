/**
 * HOSIX Shared Hooks
 * 
 * Reusable hooks used across all modules:
 * - Connectivity & sync
 * - Error handling
 * - Data fetching & caching
 * - Offline mode
 * - Generic utilities
 */

export * from './useSupabaseConnectivity';
export * from './useSupabaseHealth';
export * from './useEnhancedQuery';
export * from './useEnhancedErrorHandler';
export * from './useOfflineMode';
export * from './useOfflineSync';
export * from './useOfflineCache';
export * from './useSyncStatus';
export * from './useSyncQueue';
export * from './useNetworkStatus';
export * from './useBasicConnectivityTest';
export * from './useConnectivityTest';
export * from './useAppointmentCalendar';
export * from './useDashboardNavigation';
export * from './useHospital';
