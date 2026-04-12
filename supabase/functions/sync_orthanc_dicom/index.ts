// ============================================================================
// Edge Function: sync_orthanc_dicom
// Sync DICOM images from Orthanc PACS server to Supabase database
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const ORTHANC_URL = Deno.env.get("ORTHANC_URL") || "http://localhost:8042";

interface SyncPayload {
  imagingOrderId: string;
  orthancStudyId: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { imagingOrderId, orthancStudyId } =
      (await req.json()) as SyncPayload;

    // Fetch from Orthanc
    const orthancResponse = await fetch(
      `${ORTHANC_URL}/studies/${orthancStudyId}`
    );

    if (!orthancResponse.ok) {
      throw new Error(`Orthanc API error: ${orthancResponse.status}`);
    }

    const orthancStudy = await orthancResponse.json() as any;

    // Update imaging order with Orthanc info
    const { error: updateError } = await supabase
      .from("imaging_orders")
      .update({
        orthanc_study_id: orthancStudyId,
        orthanc_series_count: orthancStudy.Series?.length || 0,
        status: "completed",
      })
      .eq("id", imagingOrderId);

    if (updateError) {
      throw updateError;
    }

    // Sync series and instances
    for (const seriesId of orthancStudy.Series || []) {
      const seriesResponse = await fetch(
        `${ORTHANC_URL}/series/${seriesId}`
      );
      const series = await seriesResponse.json() as any;

      // Create series record
      const { data: seriesData, error: seriesError } = await supabase
        .from("imaging_series")
        .insert([
          {
            imaging_order_id: imagingOrderId,
            orthanc_series_id: seriesId,
            dicom_series_uid: series.MainDicomTags?.SeriesInstanceUID,
            dicom_series_number: series.MainDicomTags?.SeriesNumber,
            series_description: series.MainDicomTags?.SeriesDescription,
            series_date: series.MainDicomTags?.SeriesDate,
            number_of_images: series.Instances?.length || 0,
          },
        ])
        .select("id")
        .single();

      if (seriesError) {
        console.error("Error creating series:", seriesError);
        continue;
      }

      // Sync instances
      for (const instanceId of series.Instances || []) {
        const instanceResponse = await fetch(
          `${ORTHANC_URL}/instances/${instanceId}`
        );
        const instance = await instanceResponse.json() as any;

        await supabase.from("dicom_instances").insert([
          {
            imaging_series_id: seriesData?.id,
            orthanc_instance_id: instanceId,
            dicom_instance_uid: instance.MainDicomTags?.SOPInstanceUID,
            dicom_instance_number: instance.MainDicomTags?.InstanceNumber,
            dicom_metadata: instance.MainDicomTags,
            orthanc_preview_url: `${ORTHANC_URL}/web-viewer.html?study=${orthancStudyId}&series=${seriesId}&instance=${instanceId}`,
          },
        ]);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        seriesCount: orthancStudy.Series?.length || 0,
        totalInstances: orthancStudy.Series?.reduce(
          (sum: number, seriesId: string) => sum,
          0
        ),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error syncing DICOM:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
