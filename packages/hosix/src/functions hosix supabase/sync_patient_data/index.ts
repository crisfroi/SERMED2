const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PatientSyncRequest {
  patient_id: string;
  source_facility_id: string;
  target_facility_ids: string[];
  data_categories?: Array<'demographics' | 'medical_history' | 'medications' | 'vital_signs' | 'lab_results' | 'diagnoses'>;
  sync_depth?: 'summary' | 'detailed' | 'full';
}

interface DataCategory {
  category: string;
  records: number;
  last_updated: string;
  conflicts_detected: number;
}

interface PatientSyncResult {
  patient_id: string;
  source_facility_id: string;
  target_facility_id: string;
  sync_status: 'completed' | 'partial' | 'failed';
  synced_categories: DataCategory[];
  total_records_synced: number;
  conflicts_detected: number;
  sync_timestamp: string;
}

interface PatientSyncResponse {
  success: boolean;
  message: string;
  patient_id: string;
  sync_results?: PatientSyncResult[];
  total_synced?: number;
  total_conflicts?: number;
  estimated_bandwidth_mb?: number;
  sync_duration_seconds?: number;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: PatientSyncRequest = await req.json();
    const startTime = Date.now();

    if (!request.patient_id || !request.source_facility_id || !request.target_facility_ids) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'patient_id, source_facility_id, and target_facility_ids are required',
        }),
        {
          status: 400,
          headers: { ...cors_headers, 'Content-Type': 'application/json' },
        }
      );
    }

    const dataCategories = request.data_categories || [
      'demographics',
      'medical_history',
      'medications',
      'vital_signs',
    ];
    const syncDepth = request.sync_depth || 'detailed';

    // Simulate patient data sync for each target facility
    const syncResults: PatientSyncResult[] = [];
    let totalRecordsSynced = 0;
    let totalConflicts = 0;

    for (const targetFacilityId of request.target_facility_ids) {
      const syncedCategories: DataCategory[] = dataCategories.map((category) => ({
        category,
        records: Math.floor(Math.random() * 50) + 10,
        last_updated: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        conflicts_detected: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
      }));

      const categoryRecordSum = syncedCategories.reduce((sum, cat) => sum + cat.records, 0);
      const categoryConflictSum = syncedCategories.reduce((sum, cat) => sum + cat.conflicts_detected, 0);

      totalRecordsSynced += categoryRecordSum;
      totalConflicts += categoryConflictSum;

      syncResults.push({
        patient_id: request.patient_id,
        source_facility_id: request.source_facility_id,
        target_facility_id: targetFacilityId,
        sync_status: categoryConflictSum > 2 ? 'partial' : 'completed',
        synced_categories: syncedCategories,
        total_records_synced: categoryRecordSum,
        conflicts_detected: categoryConflictSum,
        sync_timestamp: new Date().toISOString(),
      });
    }

    // Calculate sync metrics
    const syncDurationMs = Date.now() - startTime;
    const estimatedBandwidthMB = (totalRecordsSynced * 0.05) / 1024; // Rough estimate

    const response: PatientSyncResponse = {
      success: true,
      message: `Patient sync completed: ${totalRecordsSynced} records synced across ${request.target_facility_ids.length} facilities`,
      patient_id: request.patient_id,
      sync_results: syncResults,
      total_synced: totalRecordsSynced,
      total_conflicts: totalConflicts,
      estimated_bandwidth_mb: Math.round(estimatedBandwidthMB * 100) / 100,
      sync_duration_seconds: Math.round(syncDurationMs / 10), // Simulate in seconds
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in patient sync:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error syncing patient data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
