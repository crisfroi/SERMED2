// @ts-nocheck
/**
 * Sync Queue Types - FASE A2
 * Types for offline-first, multi-center synchronization
 */

/**
 * SyncAction - Type of database operation
 */
export type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * SyncEstado - State of sync queue item
 */
export type SyncStatus = 'PENDING' | 'PROCESSING' | 'SYNCED' | 'ERROR' | 'CONFLICT';

/**
 * SyncQueueItem - Single item in sync queue
 * Represents a change (INSERT/UPDATE/DELETE) that needs to be synced
 */
export interface SyncQueueItem {
  id: string;
  hospital_id: string;
  tabla: 'admisiones' | 'hospitalizacion' | 'quirofanos' | 'farmacia' | 'facturacion' | string;
  accion: SyncAction;
  registro_id: string;                                          // ID of changed record
  datos: Record<string, any>;                                   // The data
  estado: SyncStatus;
  intento: number;
  error_mensaje?: string;
  created_at: string;
  synced_at?: string;
  updated_at: string;
}

/**
 * OfflineCacheEntry - Cached record for offline use
 * Stores last known state when offline
 */
export interface OfflineCacheEntry {
  id: string;
  hospital_id: string;
  tabla: string;
  registro_id: string;
  datos: Record<string, any>;
  local_version: number;                                        // Version number on device
  server_version: number;                                       // Last known version on server
  conflicted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * SyncConflict - Data conflict between local and server versions
 * When same record was edited in both places
 */
export interface SyncConflict {
  id: string;
  hospital_id: string;
  tabla: string;
  registro_id: string;
  local_version: Record<string, any>;                          // User's version
  server_version: Record<string, any>;                         // Server's version
  campos_conflictados: string[];                                // Which fields differ
  resuelto: boolean;
  resolucion?: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
  resuelto_por?: string;
  resuelto_en?: string;
  created_at: string;
  updated_at: string;
}

/**
 * SyncLogEntry - Audit trail of sync operations
 */
export interface SyncLogEntry {
  id: string;
  hospital_id: string;
  operacion: 'PROCESS_QUEUE' | 'AUTO_SYNC' | 'MANUAL_SYNC' | string;
  cantidad_items: number;
  cantidad_procesados: number;
  cantidad_errores: number;
  cantidad_conflictos: number;
  duracion_ms: number;
  error_detalles?: string;
  usuario_id?: string;
  created_at: string;
}

/**
 * SyncStatus - Current status of sync operations
 * Used in UI to show sync state
 */
export interface SyncStatusSnapshot {
  pending: number;
  processing: number;
  errors: number;
  conflicts: number;
  lastSync?: string;
  lastSyncDuration?: number;
  hospital_id: string;
}

/**
 * SyncResult - Result of a sync operation
 * Returned from sync edge functions
 */
export interface SyncResult {
  success: boolean;
  processed: number;
  synced: number;
  errors: number;
  conflicts: number;
  duration_ms: number;
  failed_items?: Array<{
    id: string;
    tabla: string;
    error: string;
  }>;
}

/**
 * ConflictResolution - User's resolution of a conflict
 */
export interface ConflictResolution {
  conflict_id: string;
  strategy: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
  merged_data?: Record<string, any>;                            // If MERGED, the result
}

/**
 * SyncNotification - Real-time notification of sync status
 */
export interface SyncNotification {
  id: string;
  hospital_id: string;
  usuario_id?: string;
  tipo: 'SYNC_SUCCESS' | 'SYNC_ERROR' | 'CONFLICT_DETECTED' | 'OFFLINE_MODE' | 'ONLINE_RESTORED';
  mensaje: string;
  datos?: Record<string, any>;
  leido: boolean;
  created_at: string;
}

/**
 * SyncConfig - Configuration for sync behavior
 */
export interface SyncConfig {
  autoSync: boolean;                                            // Enable automatic sync
  syncInterval: number;                                         // Interval in ms (default 30000)
  maxRetries: number;                                           // Max retry attempts (default 3)
  retryBackoffMs: number;                                       // Backoff multiplier (default 1000)
  offlineTimeout: number;                                       // Time before marking as offline (default 10000)
  batchSize: number;                                            // Items per sync batch (default 50)
  conflictStrategy: 'LOCAL_WINS' | 'SERVER_WINS' | 'ASK_USER';  // How to handle conflicts
}

/**
 * HospitalSyncState - Per-hospital sync state
 */
export interface HospitalSyncState {
  hospital_id: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  pendingItems: number;
  errorItems: number;
  conflictItems: number;
  config: SyncConfig;
}

/**
 * SyncMetrics - Metrics for monitoring sync performance
 */
export interface SyncMetrics {
  totalItemsQueued: number;
  successRate: number;                                          // 0-100
  averageSyncTime: number;                                      // ms
  conflictRate: number;                                         // 0-100
  retryRate: number;                                            // 0-100
  offlineTime: number;                                          // minutes
  period: 'hour' | 'day' | 'week';
}

/**
 * Type guards
 */
export const isSyncQueueItem = (obj: any): obj is SyncQueueItem => {
  return (
    obj.id &&
    obj.hospital_id &&
    obj.tabla &&
    ['INSERT', 'UPDATE', 'DELETE'].includes(obj.accion) &&
    ['PENDING', 'PROCESSING', 'SYNCED', 'ERROR', 'CONFLICT'].includes(obj.estado)
  );
};

export const isSyncConflict = (obj: any): obj is SyncConflict => {
  return (
    obj.id &&
    obj.tabla &&
    obj.registro_id &&
    obj.local_version &&
    obj.server_version
  );
};

export const isSyncResult = (obj: any): obj is SyncResult => {
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.processed === 'number' &&
    typeof obj.synced === 'number'
  );
};

/**
 * Default SyncConfig
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 30000,                                          // 30 seconds
  maxRetries: 3,
  retryBackoffMs: 1000,
  offlineTimeout: 10000,                                        // 10 seconds
  batchSize: 50,
  conflictStrategy: 'ASK_USER'
};

/**
 * SQL Queries as TypeScript
 */
export const SYNC_QUEUE_QUERIES = {
  GET_PENDING: `
    SELECT * FROM sync_queue 
    WHERE hospital_id = $1 AND estado = 'PENDING'
    ORDER BY created_at ASC
    LIMIT $2
  `,
  
  GET_ERRORS: `
    SELECT * FROM sync_queue 
    WHERE hospital_id = $1 AND estado = 'ERROR'
    ORDER BY created_at DESC
  `,
  
  GET_STATUS: `
    SELECT 
      SUM(CASE WHEN estado = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN estado = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN estado = 'ERROR' THEN 1 ELSE 0 END) as errors,
      SUM(CASE WHEN estado = 'CONFLICT' THEN 1 ELSE 0 END) as conflicts
    FROM sync_queue 
    WHERE hospital_id = $1
  `
};
