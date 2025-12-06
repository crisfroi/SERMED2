import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Migration {
  filename: string;
  name: string;
  status: "pending" | "applied" | "error";
  appliedAt?: string;
  errorMessage?: string;
  content?: string;
}

export interface MigrationStats {
  total: number;
  applied: number;
  pending: number;
  errors: number;
}

const KNOWN_MIGRATIONS = [
  "20240101000000_create_biometric_sync_logs",
  "20241201_dynamic_forms",
  "20250116_001_hosix_base_schema",
  "20250116_002_hosix_pacientes_historia_clinica",
  "20250116_003_hosix_urgencias_citas_agendas",
  "20250116_004_hosix_hospitalizacion_quirofanos_farmacia",
  "20250116_005_hosix_facturacion_reportes",
  "20250121_006_hosix_cajas_completo",
  "20250121_007_hosix_recobros",
  "20250121_008_hosix_suministros",
  "20250122_009_hosix_almacenes",
  "20250122_011_hosix_cpoe_prescripciones",
  "20250122_012_hosix_servicios_tipos_ingreso",
  "20250205_010_hosix_enfermeria",
  "20250205_011_hosix_medicos",
  "20250205_012_hosix_drug_interactions",
  "20250206_011_hosix_medicos_asis_1",
  "20250206_013_hosix_quirofanos_asis_3",
  "20250206_014_hosix_interconsultas_asis_11",
];

export const useSupabaseMigrations = () => {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [stats, setStats] = useState<MigrationStats>({
    total: 0,
    applied: 0,
    pending: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si la tabla de migraciones existe o crear registros
  const ensureMigrationTracking = useCallback(async () => {
    try {
      // Intenta crear la tabla si no existe
      const { error: createTableError } = await supabase.rpc(
        "exec_sql",
        {
          sql: `
            CREATE TABLE IF NOT EXISTS schema_migrations (
              id BIGSERIAL PRIMARY KEY,
              version BIGINT NOT NULL UNIQUE,
              name VARCHAR(255) NOT NULL UNIQUE,
              executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
          `,
        }
      );

      if (createTableError && !createTableError.message.includes("does not exist")) {
        console.warn("Could not create migrations table:", createTableError);
      }
    } catch (err) {
      console.warn("Could not ensure migration tracking:", err);
    }
  }, []);

  // Obtener el estado de una migración
  const checkMigrationStatus = useCallback(
    async (migrationName: string): Promise<{
      status: "pending" | "applied" | "error";
      appliedAt?: string;
      errorMessage?: string;
    }> => {
      try {
        // Primero intenta con schema_migrations
        const { data, error } = await supabase
          .from("schema_migrations")
          .select("*")
          .eq("name", migrationName)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          return { status: "error", errorMessage: error.message };
        }

        if (data) {
          return {
            status: "applied",
            appliedAt: data.executed_at || new Date().toISOString(),
          };
        }

        return { status: "pending" };
      } catch (err) {
        // Si la tabla no existe aún, asumir pendiente
        return { status: "pending" };
      }
    },
    []
  );

  // Cargar todas las migraciones y verificar su estado
  const loadMigrations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await ensureMigrationTracking();

      const migrationsWithStatus = await Promise.all(
        KNOWN_MIGRATIONS.map(async (name) => {
          const status = await checkMigrationStatus(name);
          return {
            filename: `${name}.sql`,
            name,
            status: status.status,
            appliedAt: status.appliedAt,
            errorMessage: status.errorMessage,
          };
        })
      );

      setMigrations(migrationsWithStatus);

      // Actualizar estadísticas
      const newStats = {
        total: migrationsWithStatus.length,
        applied: migrationsWithStatus.filter((m) => m.status === "applied")
          .length,
        pending: migrationsWithStatus.filter((m) => m.status === "pending")
          .length,
        errors: migrationsWithStatus.filter((m) => m.status === "error").length,
      };

      setStats(newStats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading migrations";
      setError(errorMessage);
      console.error("Error loading migrations:", err);
    } finally {
      setLoading(false);
    }
  }, [checkMigrationStatus, ensureMigrationTracking]);

  // Aplicar una migración individual
  const applyMigration = useCallback(
    async (migrationName: string): Promise<boolean> => {
      try {
        // Primero registrar en schema_migrations
        const { error } = await supabase.from("schema_migrations").insert({
          name: migrationName,
          version: Math.floor(Date.now() / 1000),
          executed_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`Error registering migration ${migrationName}:`, error);
          return false;
        }

        // Actualizar estado local
        setMigrations((prev) =>
          prev.map((m) =>
            m.name === migrationName
              ? {
                  ...m,
                  status: "applied",
                  appliedAt: new Date().toISOString(),
                }
              : m
          )
        );

        // Actualizar estadísticas
        setStats((prev) => ({
          ...prev,
          applied: prev.applied + 1,
          pending: Math.max(0, prev.pending - 1),
        }));

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(`Error applying migration ${migrationName}:`, err);

        // Marcar como error
        setMigrations((prev) =>
          prev.map((m) =>
            m.name === migrationName
              ? {
                  ...m,
                  status: "error",
                  errorMessage,
                }
              : m
          )
        );

        return false;
      }
    },
    []
  );

  // Aplicar múltiples migraciones
  const applyMigrations = useCallback(
    async (migrationNames: string[]): Promise<{ success: number; failed: number }> => {
      let successCount = 0;
      let failedCount = 0;

      for (const name of migrationNames) {
        const success = await applyMigration(name);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };
    },
    [applyMigration]
  );

  // Obtener solo las migraciones pendientes
  const getPendingMigrations = useCallback(() => {
    return migrations.filter((m) => m.status === "pending");
  }, [migrations]);

  // Obtener solo las migraciones aplicadas
  const getAppliedMigrations = useCallback(() => {
    return migrations.filter((m) => m.status === "applied");
  }, [migrations]);

  // Resetear estado de error de una migración
  const clearMigrationError = useCallback((migrationName: string) => {
    setMigrations((prev) =>
      prev.map((m) =>
        m.name === migrationName
          ? {
              ...m,
              status: "pending",
              errorMessage: undefined,
            }
          : m
      )
    );
  }, []);

  return {
    migrations,
    stats,
    loading,
    error,
    loadMigrations,
    applyMigration,
    applyMigrations,
    getPendingMigrations,
    getAppliedMigrations,
    clearMigrationError,
  };
};
