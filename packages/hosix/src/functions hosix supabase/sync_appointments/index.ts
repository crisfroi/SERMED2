const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  provider_id: string;
  external_calendar_type?: 'google' | 'microsoft' | 'ical' | 'apple';
  sync_direction?: 'to_external' | 'from_external' | 'bidirectional';
  date_range_days?: number;
}

interface SyncedAppointment {
  appointment_id: string;
  external_id?: string;
  sync_timestamp: string;
  sync_status: 'synced' | 'pending' | 'error';
}

interface SyncResponse {
  success: boolean;
  message: string;
  provider_id: string;
  synced_appointments?: SyncedAppointment[];
  sync_count?: number;
  errors?: Array<{ appointment_id: string; error: string }>;
  sync_timestamp?: string;
  next_sync_time?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: SyncRequest = await req.json();

    if (!request.provider_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'provider_id is required',
        }),
        {
          status: 400,
          headers: { ...cors_headers, 'Content-Type': 'application/json' },
        }
      );
    }

    const calendarType = request.external_calendar_type || 'google';
    const syncDirection = request.sync_direction || 'bidirectional';
    const dateRangeDays = request.date_range_days || 90;

    // Simulate appointment data to be synced
    const syncedAppointments: SyncedAppointment[] = [
      {
        appointment_id: 'APT-001',
        external_id: 'evt_google_12345',
        sync_timestamp: new Date().toISOString(),
        sync_status: 'synced',
      },
      {
        appointment_id: 'APT-002',
        external_id: 'evt_google_12346',
        sync_timestamp: new Date().toISOString(),
        sync_status: 'synced',
      },
      {
        appointment_id: 'APT-003',
        external_id: 'evt_google_12347',
        sync_timestamp: new Date().toISOString(),
        sync_status: 'synced',
      },
      {
        appointment_id: 'APT-004',
        sync_timestamp: new Date().toISOString(),
        sync_status: 'pending',
      },
    ];

    const errors = [
      {
        appointment_id: 'APT-005',
        error: 'Missing required field: provider timezone',
      },
    ];

    // Calculate next sync time
    const nextSyncTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    const response: SyncResponse = {
      success: true,
      message: `Calendar sync completed for ${calendarType} (${syncDirection})`,
      provider_id: request.provider_id,
      synced_appointments,
      sync_count: syncedAppointments.filter((a) => a.sync_status === 'synced').length,
      errors: errors.length > 0 ? errors : undefined,
      sync_timestamp: new Date().toISOString(),
      next_sync_time: nextSyncTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calendar sync:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error syncing appointments: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
