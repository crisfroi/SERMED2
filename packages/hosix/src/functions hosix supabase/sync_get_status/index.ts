/**
 * Edge Function: sync_get_status
 * FASE A4: Get current sync status for a hospital
 * 
 * GET /functions/v1/sync_get_status?hospital_id=...
 * Returns: { pending, processing, errors, conflicts, lastSync, synced_percentage }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    // Only allow GET
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    // Parse hospitalId from query string
    const url = new URL(req.url);
    const hospital_id = url.searchParams.get("hospital_id");

    if (!hospital_id) {
      return new Response(
        JSON.stringify({ error: "hospital_id required" }),
        { status: 400 }
      );
    }

    // Get counts by estado
    const { data: items, error: itemsError } = await supabase
      .from("sync_queue")
      .select("estado")
      .eq("hospital_id", hospital_id);

    if (itemsError) {
      console.error("Error fetching sync queue:", itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sync queue" }),
        { status: 500 }
      );
    }

    // Count by estado
    const statusCounts = {
      pending: 0,
      processing: 0,
      synced: 0,
      error: 0,
      conflict: 0,
    };

    items?.forEach((item: any) => {
      if (item.estado === "PENDING") statusCounts.pending++;
      else if (item.estado === "PROCESSING") statusCounts.processing++;
      else if (item.estado === "SYNCED") statusCounts.synced++;
      else if (item.estado === "ERROR") statusCounts.error++;
      else if (item.estado === "CONFLICT") statusCounts.conflict++;
    });

    // Get last sync time
    const { data: lastLog, error: logError } = await supabase
      .from("sync_log")
      .select("created_at, cantidad_procesados, duracion_ms")
      .eq("hospital_id", hospital_id)
      .eq("operacion", "PROCESS_QUEUE")
      .order("created_at", { ascending: false })
      .limit(1);

    if (logError) {
      console.error("Error fetching sync log:", logError);
    }

    // Calculate stats
    const total = items?.length || 0;
    const totalPending = statusCounts.pending + statusCounts.processing;
    const syncedPercentage =
      total > 0 ? Math.round((statusCounts.synced / total) * 100) : 0;
    const errorRate = total > 0 ? Math.round((statusCounts.error / total) * 100) : 0;

    // Determine health status
    let healthStatus = "healthy";
    if (statusCounts.error > 0) healthStatus = "error";
    else if (statusCounts.conflict > 0) healthStatus = "warning";
    else if (totalPending > 0) healthStatus = "syncing";

    const response = {
      hospital_id,
      timestamp: new Date().toISOString(),

      // Counts
      pending: statusCounts.pending,
      processing: statusCounts.processing,
      synced: statusCounts.synced,
      errors: statusCounts.error,
      conflicts: statusCounts.conflict,
      total,
      totalPending,

      // Percentages
      syncedPercentage,
      errorRate,

      // Status
      healthStatus,
      isHealthy: healthStatus === "healthy" || healthStatus === "syncing",
      isSyncing: totalPending > 0,
      hasErrors: statusCounts.error > 0,
      hasConflicts: statusCounts.conflict > 0,

      // Timing
      lastSync: lastLog?.[0]?.created_at,
      lastSyncDuration: lastLog?.[0]?.duracion_ms,
      lastSyncItems: lastLog?.[0]?.cantidad_procesados,

      // UI suggestions
      suggestions: generateSuggestions(
        statusCounts,
        healthStatus
      ),
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync_get_status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});

/**
 * Generate UI suggestions based on sync status
 */
function generateSuggestions(
  statusCounts: Record<string, number>,
  healthStatus: string
): string[] {
  const suggestions: string[] = [];

  if (statusCounts.error > 5) {
    suggestions.push("Multiple sync errors detected. Check network connectivity.");
  }

  if (statusCounts.conflict > 0) {
    suggestions.push(
      `${statusCounts.conflict} conflict${statusCounts.conflict > 1 ? "s" : ""} awaiting resolution.`
    );
  }

  if (statusCounts.pending > 50) {
    suggestions.push("Large queue pending. Consider triggering manual sync.");
  }

  if (healthStatus === "error") {
    suggestions.push("System health: ERROR. Manual intervention may be needed.");
  }

  if (suggestions.length === 0) {
    suggestions.push("All systems operational.");
  }

  return suggestions;
}
