-- Migration: 040_sync_queue.sql
-- FASE A2: SYNC_QUEUE Infrastructure for multi-center sync
-- Created: 14 April 2025

-- ============================================================================
-- 1. SYNC_QUEUE TABLE - Main queue for all database changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  tabla VARCHAR(100) NOT NULL,                           -- Table name: 'admisiones', 'hospitalizacion', etc.
  accion VARCHAR(20) NOT NULL,                           -- 'INSERT', 'UPDATE', 'DELETE'
  registro_id UUID NOT NULL,                             -- ID of the record being changed
  datos JSONB,                                           -- The actual data being synced
  estado VARCHAR(30) DEFAULT 'PENDING',                  -- 'PENDING', 'PROCESSING', 'SYNCED', 'ERROR'
  intento INT DEFAULT 0,                                 -- Retry count
  error_mensaje TEXT,                                    -- Error details if estado = 'ERROR'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_accion CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  CONSTRAINT valid_estado CHECK (estado IN ('PENDING', 'PROCESSING', 'SYNCED', 'ERROR', 'CONFLICT'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_queue_hospital_estado 
  ON sync_queue(hospital_id, estado);

CREATE INDEX IF NOT EXISTS idx_sync_queue_estado_created 
  ON sync_queue(estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_tabla_hospital 
  ON sync_queue(tabla, hospital_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_registro 
  ON sync_queue(tabla, registro_id, hospital_id);

-- ============================================================================
-- 2. OFFLINE_CACHE TABLE - Client-side cache for offline-first
-- ============================================================================
CREATE TABLE IF NOT EXISTS offline_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  tabla VARCHAR(100) NOT NULL,                           -- Which table this data is from
  registro_id UUID NOT NULL,                             -- Record ID
  datos JSONB NOT NULL,                                  -- Cached data
  local_version INT DEFAULT 1,                           -- Local version number
  server_version INT DEFAULT 0,                          -- Last known server version
  conflicted BOOLEAN DEFAULT FALSE,                      -- Whether this has conflicts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(hospital_id, tabla, registro_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offline_cache_hospital_tabla 
  ON offline_cache(hospital_id, tabla);

CREATE INDEX IF NOT EXISTS idx_offline_cache_conflicted 
  ON offline_cache(hospital_id, conflicted);

-- ============================================================================
-- 3. SYNC_CONFLICTS TABLE - Log of conflicts for manual resolution
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  tabla VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  local_version JSONB NOT NULL,                          -- Client's version
  server_version JSONB NOT NULL,                         -- Server's version
  campos_conflictados TEXT[] DEFAULT ARRAY[]::TEXT[],   -- Which fields conflict
  resuelto BOOLEAN DEFAULT FALSE,
  resolucion VARCHAR(20),                                -- 'LOCAL_WINS', 'SERVER_WINS', 'MERGED'
  resuelto_por UUID,                                     -- User who resolved
  resuelto_en TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_hospital_tabla 
  ON sync_conflicts(hospital_id, tabla, resuelto);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved 
  ON sync_conflicts(hospital_id, resuelto, created_at DESC);

-- ============================================================================
-- 4. SYNC_LOG TABLE - Audit trail of sync operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  operacion VARCHAR(50) NOT NULL,                        -- 'PROCESS_QUEUE', 'AUTO_SYNC', 'MANUAL_SYNC'
  cantidad_items INT DEFAULT 0,
  cantidad_procesados INT DEFAULT 0,
  cantidad_errores INT DEFAULT 0,
  cantidad_conflictos INT DEFAULT 0,
  duracion_ms INT DEFAULT 0,                             -- How long it took
  error_detalles TEXT,
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_hospital_fecha 
  ON sync_log(hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_log_operacion 
  ON sync_log(operacion, created_at DESC);

-- ============================================================================
-- 5. RLS POLICIES - Multi-hospital data isolation
-- ============================================================================

-- Enable RLS
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- SYNC_QUEUE - Hospital isolation
CREATE POLICY sync_queue_hospital_isolation 
  ON sync_queue
  FOR ALL
  USING (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()));

-- SYNC_QUEUE - Service role can bypass
CREATE POLICY sync_queue_service_role 
  ON sync_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- OFFLINE_CACHE - Same isolation
CREATE POLICY offline_cache_hospital_isolation 
  ON offline_cache
  FOR ALL
  USING (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()));

-- SYNC_CONFLICTS - Same isolation
CREATE POLICY sync_conflicts_hospital_isolation 
  ON sync_conflicts
  FOR ALL
  USING (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid()));

-- SYNC_LOG - Same isolation
CREATE POLICY sync_log_hospital_isolation 
  ON sync_log
  FOR ALL
  USING (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid())
         OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid())
         OR auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. TRIGGERS - Auto-update updated_at
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync_queue
CREATE TRIGGER sync_queue_update_timestamp
  BEFORE UPDATE ON sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for offline_cache
CREATE TRIGGER offline_cache_update_timestamp
  BEFORE UPDATE ON offline_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for sync_conflicts
CREATE TRIGGER sync_conflicts_update_timestamp
  BEFORE UPDATE ON sync_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. NOTIFICATIONS TABLE - For real-time sync status updates
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  usuario_id UUID,                                       -- NULL = broadcast to all
  tipo VARCHAR(50) NOT NULL,                             -- 'SYNC_SUCCESS', 'SYNC_ERROR', 'CONFLICT'
  mensaje TEXT,
  datos JSONB,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_notifications_hospital_usuario 
  ON sync_notifications(hospital_id, usuario_id, leido, created_at DESC);

-- Enable RLS
ALTER TABLE sync_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_notifications_read 
  ON sync_notifications
  FOR SELECT
  USING (hospital_id IN (SELECT hospital_id FROM auth.users WHERE id = auth.uid())
         OR usuario_id = auth.uid()
         OR usuario_id IS NULL);

-- ============================================================================
-- MIGRATION END - PHASE A2
-- ============================================================================
-- Total: 4 main tables (sync_queue, offline_cache, sync_conflicts, sync_log)
--        + 1 notifications table
--        + RLS policies for multi-hospital isolation
--        + Indexes for performance
--        + Triggers for automatic timestamp updates
