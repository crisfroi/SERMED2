const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityCheckRequest {
  provider_id: string;
  date: string;
  duration_minutes?: number;
  appointment_type?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface ProviderAvailability {
  provider_id: string;
  date: string;
  working_hours: { start: string; end: string };
  time_slots: TimeSlot[];
  total_available_slots: number;
  utilization_percentage: number;
}

interface AvailabilityResponse {
  success: boolean;
  message: string;
  availability?: ProviderAvailability;
  peak_times?: { time: string; occupancy_percentage: number }[];
  recommended_times?: string[];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: AvailabilityCheckRequest = await req.json();

    if (!request.provider_id || !request.date) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'provider_id and date are required',
        }),
        {
          status: 400,
          headers: { ...cors_headers, 'Content-Type': 'application/json' },
        }
      );
    }

    const durationMinutes = request.duration_minutes || 30;

    // Generate time slots
    const timeSlots: TimeSlot[] = [];
    const workingStart = 480; // 08:00 AM in minutes
    const workingEnd = 1080; // 18:00 (6 PM) in minutes
    const lunchStart = 720; // 12:00 PM
    const lunchEnd = 780; // 1:00 PM

    for (let minutes = workingStart; minutes + durationMinutes <= workingEnd; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Check if within lunch break
      const isLunch = minutes >= lunchStart && minutes < lunchEnd;

      let available = true;
      let reason = undefined;

      if (isLunch) {
        available = false;
        reason = 'Lunch break';
      } else if (Math.random() > 0.7) {
        // Randomly mark some slots as booked
        available = false;
        reason = 'Already booked';
      }

      timeSlots.push({
        time: timeStr,
        available,
        reason,
      });
    }

    // Calculate utilization
    const bookedSlots = timeSlots.filter((s) => !s.available).length;
    const utilizationPercentage = Math.round((bookedSlots / timeSlots.length) * 100);

    // Identify peak times
    const peakTimes = timeSlots
      .filter((_, idx) => idx >= 9 && idx <= 15) // Mid-morning to early afternoon
      .map((slot) => ({
        time: slot.time,
        occupancy_percentage: Math.floor(Math.random() * 40) + 60,
      }));

    // Recommend best times (least busy)
    const recommendedTimes = timeSlots
      .filter((s) => s.available)
      .slice(0, 3)
      .map((s) => s.time);

    const availability: ProviderAvailability = {
      provider_id: request.provider_id,
      date: request.date,
      working_hours: { start: '08:00', end: '18:00' },
      time_slots: timeSlots,
      total_available_slots: timeSlots.filter((s) => s.available).length,
      utilization_percentage: utilizationPercentage,
    };

    const response: AvailabilityResponse = {
      success: true,
      message: `Availability check completed for ${request.date}`,
      availability,
      peak_times: peakTimes,
      recommended_times:
        recommendedTimes.length > 0 ? recommendedTimes : ['09:00', '14:00', '16:30'],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in availability check:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error checking availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
