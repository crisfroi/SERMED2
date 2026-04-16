const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SendRemindersRequest {
  appointment_ids?: string[];
  reminder_type?: 'sms' | 'email' | 'both' | 'push_notification';
  hours_before?: number;
  send_all_pending?: boolean;
}

interface ReminderResult {
  appointment_id: string;
  patient_phone?: string;
  patient_email?: string;
  sms_status?: 'sent' | 'failed' | 'skipped';
  email_status?: 'sent' | 'failed' | 'skipped';
  push_notification_status?: 'sent' | 'failed' | 'skipped';
  timestamp: string;
}

interface SendRemindersResponse {
  success: boolean;
  message: string;
  reminders_sent?: number;
  reminders_failed?: number;
  results?: ReminderResult[];
  batch_id?: string;
  next_batch_time?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: SendRemindersRequest = await req.json();

    const reminderType = request.reminder_type || 'both';
    const hoursBefore = request.hours_before || 24;
    const appointmentIds = request.appointment_ids || [
      'APT-001',
      'APT-002',
      'APT-003',
      'APT-004',
      'APT-005',
    ];

    // Simulate reminder sending
    const results: ReminderResult[] = appointmentIds.map((aptId) => {
      const successChance = Math.random();
      const sendSMS = reminderType === 'sms' || reminderType === 'both';
      const sendEmail = reminderType === 'email' || reminderType === 'both';
      const sendPush = reminderType === 'push_notification' || reminderType === 'both';

      return {
        appointment_id: aptId,
        patient_phone: sendSMS ? '+1234567890' : undefined,
        patient_email: sendEmail ? 'patient@example.com' : undefined,
        sms_status: !sendSMS ? 'skipped' : successChance > 0.1 ? 'sent' : 'failed',
        email_status: !sendEmail ? 'skipped' : successChance > 0.05 ? 'sent' : 'failed',
        push_notification_status: !sendPush ? 'skipped' : successChance > 0.15 ? 'sent' : 'failed',
        timestamp: new Date().toISOString(),
      };
    });

    const sentCount = results.filter(
      (r) =>
        r.sms_status === 'sent' ||
        r.email_status === 'sent' ||
        r.push_notification_status === 'sent'
    ).length;

    const failedCount = results.filter(
      (r) =>
        (r.sms_status === 'failed' && reminderType !== 'email') ||
        (r.email_status === 'failed' && reminderType !== 'sms') ||
        (r.push_notification_status === 'failed' && reminderType === 'push_notification')
    ).length;

    // Calculate next batch time (in 1 hour)
    const nextBatchTime = new Date(Date.now() + 3600000).toISOString();

    const response: SendRemindersResponse = {
      success: true,
      message: `Reminder batch sent: ${sentCount} successful, ${failedCount} failed`,
      reminders_sent: sentCount,
      reminders_failed: failedCount,
      results,
      batch_id: `BATCH-${Date.now()}`,
      next_batch_time: nextBatchTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending reminders:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error sending reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
