// @ts-nocheck
/**
 * useOfflineCache - Hook for managing offline cache using IndexedDB
 * FASE A3: Enable offline-first functionality
 *
 * Usage:
 * ```tsx
 * const { saveLocal, getLocal, clearCache } = useOfflineCache('admisiones');
 *
 * // Save record locally
 * await saveLocal(patientId, { nombre: 'Juan', apellido: 'Pérez' });
 *
 * // Retrieve from cache
 * const patient = await getLocal(patientId);
 *
 * // Clear when online again
 * await clearCache();
 * ```
 */

import { useState, useEffect } from 'react';
import { OfflineCacheEntry } from '@/types/sync';

const DB_NAME = 'HospixApp';
const DB_VERSION = 1;
const STORE_NAME = 'offline_cache';

interface CacheEntry {
  tabla: string;
  registro_id: string;
  hospital_id: string;
  datos: Record<string, any>;
  local_version: number;
  server_version: number;
}

export const useOfflineCache = (tabla: string, hospital_id: string) => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize IndexedDB on mount
   */
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          const err = new Error('Failed to open IndexedDB');
          setError(err);
          console.error(err);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, {
              keyPath: ['tabla', 'registro_id', 'hospital_id'],
            });
            objectStore.createIndex(
              'tabla_hospital',
              ['tabla', 'hospital_id'],
              { unique: false }
            );
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = () => {
          const database = request.result;
          setDb(database);
          setIsReady(true);
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Error initializing offline cache:', error);
      }
    };

    initDB();
  }, []);

  /**
   * Save record to offline cache
   */
  const saveLocal = async (
    registro_id: string,
    datos: Record<string, any>,
    local_version: number = 1,
    server_version: number = 0
  ): Promise<void> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const entry: CacheEntry = {
        tabla,
        registro_id,
        hospital_id,
        datos,
        local_version,
        server_version,
      };

      const request = objectStore.put(entry);

      request.onerror = () => {
        const err = new Error('Failed to save to offline cache');
        setError(err);
        reject(err);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  };

  /**
   * Get record from offline cache
   */
  const getLocal = async (
    registro_id: string
  ): Promise<CacheEntry | undefined> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);

      const request = objectStore.get([tabla, registro_id, hospital_id]);

      request.onerror = () => {
        const err = new Error('Failed to get from offline cache');
        setError(err);
        reject(err);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  };

  /**
   * Get all records for this table/hospital
   */
  const getAllLocal = async (): Promise<CacheEntry[]> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('tabla_hospital');

      const request = index.getAll([tabla, hospital_id]);

      request.onerror = () => {
        const err = new Error('Failed to get all from offline cache');
        setError(err);
        reject(err);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  };

  /**
   * Delete record from cache
   */
  const deleteLocal = async (registro_id: string): Promise<void> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const request = objectStore.delete([tabla, registro_id, hospital_id]);

      request.onerror = () => {
        const err = new Error('Failed to delete from offline cache');
        setError(err);
        reject(err);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  };

  /**
   * Clear all cache for this table/hospital
   */
  const clearCache = async (): Promise<void> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('tabla_hospital');

      const request = index.openCursor([tabla, hospital_id]);
      
      const deletionRequests: IDBRequest[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          deletionRequests.push(cursor.delete());
          cursor.continue();
        } else {
          // All deleted
          resolve();
        }
      };

      request.onerror = () => {
        const err = new Error('Failed to clear offline cache');
        setError(err);
        reject(err);
      };
    });
  };

  /**
   * Get cache size (in bytes)
   */
  const getCacheSize = async (): Promise<number> => {
    if (!db) {
      throw new Error('Offline cache not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);

      const request = objectStore.count();

      request.onerror = () => {
        reject(new Error('Failed to get cache size'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  };

  /**
   * Check if data is stale (server version > local version)
   */
  const isStale = (entry: CacheEntry): boolean => {
    return entry.server_version > entry.local_version;
  };

  /**
   * Check if data is conflicted
   */
  const hasConflict = (entry: CacheEntry): boolean => {
    return entry.local_version > entry.server_version;
  };

  return {
    // Operations
    saveLocal,
    getLocal,
    getAllLocal,
    deleteLocal,
    clearCache,

    // Status
    isReady,
    error,
    getCacheSize,

    // Helpers
    isStale,
    hasConflict,
  };
};

export default useOfflineCache;
