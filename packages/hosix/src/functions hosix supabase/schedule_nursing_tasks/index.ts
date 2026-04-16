import { serve } from 'https://deno.land/std@0.175.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { taskType, frequency, startDate } = await req.json();

    if (!taskType || !frequency || !startDate) {
      return new Response(
        JSON.stringify({ error: 'Missing taskType, frequency, or startDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const start = new Date(startDate);

    // Define frequency intervals in minutes
    const frequencyMap: Record<string, number> = {
      once: 0, // Single occurrence
      every_2_hours: 2 * 60,
      every_4_hours: 4 * 60,
      every_6_hours: 6 * 60,
      daily: 24 * 60,
    };

    const intervalMinutes = frequencyMap[frequency];

    if (intervalMinutes === undefined) {
      return new Response(JSON.stringify({ error: 'Invalid frequency value' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let schedule: any[] = [];

    if (frequency === 'once') {
      // Single occurrence tasks
      schedule = [
        {
          occurrence: 1,
          scheduledTime: start.toISOString(),
          dueTime: new Date(start.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          notes: 'One-time task',
        },
      ];
    } else {
      // Recurring tasks - generate 7-day schedule
      const endDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      let currentTime = new Date(start);
      let occurrence = 1;

      while (currentTime < endDate) {
        const dueTime = new Date(currentTime.getTime() + 4 * 60 * 60 * 1000); // 4-hour window

        schedule.push({
          occurrence,
          scheduledTime: new Date(currentTime).toISOString(),
          dueTime: dueTime.toISOString(),
          status: new Date() > dueTime ? 'overdue' : 'pending',
          notes:
            frequency === 'daily'
              ? `Daily task - ${currentTime.getHours()}:00`
              : `Recurring every ${frequency.replace(/_/g, ' ')}`,
        });

        currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
        occurrence++;
      }
    }

    // Calculate nursing workload coverage
    const tasksPerDay = frequency === 'once' ? 1 : (24 * 60) / intervalMinutes;
    const estimatedWorkload = {
      frequency,
      taskType,
      occurrencesIn7Days: schedule.length,
      occurrencesPerDay: Math.round(tasksPerDay * 10) / 10,
      estimatedTimePerTaskMinutes:
        taskType === 'wound_care'
          ? 15
          : taskType === 'catheter_care'
            ? 10
            : taskType === 'medication_administration'
              ? 5
              : taskType === 'vital_signs_monitoring'
                ? 8
                : taskType === 'hygiene'
                  ? 20
                  : taskType === 'patient_positioning'
                    ? 12
                    : 10,
    };

    // Calculate total workload
    estimatedWorkload['totalMinutesPerDay'] =
      Math.round(tasksPerDay * estimatedWorkload.estimatedTimePerTaskMinutes * 10) / 10;
    estimatedWorkload['rekommendedStaffing'] =
      estimatedWorkload.totalMinutesPerDay > 120
        ? 'High - Multiple nurses needed'
        : estimatedWorkload.totalMinutesPerDay > 60
          ? 'Medium - One nurse can handle'
          : 'Low - Can be combined with other duties';

    const result = {
      schedule,
      workloadAnalysis: estimatedWorkload,
      staffingRecommendation: estimatedWorkload.rekommendedStaffing,
      warnings: [],
      suggestions: [],
    };

    // Add warnings based on workload
    if (estimatedWorkload.totalMinutesPerDay > 240) {
      result.warnings.push('⚠️ High workload detected - May need additional staff');
    }
    if (frequency === 'every_2_hours' && tasksPerDay > 12) {
      result.warnings.push('⚠️ Very frequent tasks - Risk of care interruptions');
    }

    // Add suggestions
    if (estimatedWorkload.occurrencesPerDay > 6) {
      result.suggestions.push('💡 Group tasks when possible to improve efficiency');
    }
    if (taskType === 'vital_signs_monitoring' && frequency === 'every_4_hours') {
      result.suggestions.push('💡 Consider more frequent monitoring for ICU patients');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
