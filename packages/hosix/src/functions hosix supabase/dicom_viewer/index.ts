const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface DicomViewerRequest {
  study_id: string;
  series_number?: number;
  image_number?: number;
  window_center?: number;
  window_width?: number;
  operation?: 'pan' | 'zoom' | 'rotate' | 'flip' | 'invert';
}

interface DicomMetadata {
  patient_name: string;
  patient_id: string;
  study_date: string;
  study_time: string;
  modality: string;
  body_part: string;
  series_count: number;
  total_images: number;
}

interface ViewerResponse {
  success: boolean;
  study_id: string;
  message: string;
  metadata?: DicomMetadata;
  images?: Array<{
    series_number: number;
    image_number: number;
    file_path: string;
    thumbnail_url: string;
    dimensions: { width: number; height: number };
  }>;
  viewer_settings?: {
    window_center: number;
    window_width: number;
    zoom_factor: number;
    rotation_angle: number;
    is_flipped: boolean;
    is_inverted: boolean;
  };
  annotations?: Array<{
    annotation_id: string;
    type: 'measurement' | 'arrow' | 'circle' | 'polygon' | 'text';
    coordinates: Array<{ x: number; y: number }>;
    value?: string | number;
    creator_id: string;
  }>;
  frame_rate?: number;
  streaming_url?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: DicomViewerRequest = await req.json();

    if (!request.study_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'study_id is required',
        }),
        {
          status: 400,
          headers: { ...cors_headers, 'Content-Type': 'application/json' },
        }
      );
    }

    // Simulate DICOM metadata retrieval
    const metadata: DicomMetadata = {
      patient_name: 'John Doe',
      patient_id: 'MRN-123456',
      study_date: '2025-02-21',
      study_time: '145500',
      modality: 'CT',
      body_part: 'Abdomen',
      series_count: 5,
      total_images: 186,
    };

    // Simulate image series retrieval
    const images = Array.from({ length: metadata.series_count }, (_, i) => ({
      series_number: i + 1,
      image_number: 1,
      file_path: `/dicom/study/${request.study_id}/series_${i + 1}/image_001.dcm`,
      thumbnail_url: `/dicom/thumbnails/${request.study_id}_series_${i + 1}.jpg`,
      dimensions: { width: 512, height: 512 },
    }));

    // Parse viewer settings (with defaults)
    const windowCenter = request.window_center || 40;
    const windowWidth = request.window_width || 400;
    const operation = request.operation || 'pan';

    // Calculate viewer settings based on operation
    let viewerSettings = {
      window_center: windowCenter,
      window_width: windowWidth,
      zoom_factor: 1.0,
      rotation_angle: 0,
      is_flipped: false,
      is_inverted: false,
    };

    // Apply operation transformations
    if (operation === 'zoom') {
      viewerSettings.zoom_factor = 1.5;
    } else if (operation === 'rotate') {
      viewerSettings.rotation_angle = 90;
    } else if (operation === 'flip') {
      viewerSettings.is_flipped = true;
    } else if (operation === 'invert') {
      viewerSettings.is_inverted = true;
    }

    // Simulate annotations retrieval
    const annotations = [
      {
        annotation_id: 'ANN-001',
        type: 'measurement' as const,
        coordinates: [
          { x: 150, y: 200 },
          { x: 250, y: 200 },
        ],
        value: 10.5,
        creator_id: 'rad-001',
      },
      {
        annotation_id: 'ANN-002',
        type: 'circle' as const,
        coordinates: [{ x: 300, y: 250 }],
        value: 25,
        creator_id: 'rad-001',
      },
    ];

    // Calculate frame rate for 4D images (e.g., cardiac cine)
    const frameRate = metadata.modality === 'ECHO' ? 30 : undefined;

    // Generate streaming URL (Mock URL format)
    const streamingUrl = `/dicom/stream/${request.study_id}?format=wado&quality=high`;

    const response: ViewerResponse = {
      success: true,
      study_id: request.study_id,
      message: `DICOM viewer initialized for study ${request.study_id}`,
      metadata,
      images,
      viewer_settings: viewerSettings,
      annotations,
      frame_rate: frameRate,
      streaming_url: streamingUrl,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DICOM viewer:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error processing DICOM: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
