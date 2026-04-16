const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SegmentationRequest {
  study_id: string;
  modality: string;
  body_part: string;
  segmentation_type?: 'organ' | 'lesion' | 'vessel' | 'bone';
  algorithm?: 'deep_learning' | 'traditional' | 'hybrid';
}

interface SegmentationResult {
  segment_id: string;
  volume_ml?: number;
  density_hu?: number;
  surface_area_cm2?: number;
  characteristics: Record<string, string | number>;
  center_of_mass?: { x: number; y: number; z: number };
  quality_score: number;
  confidence_percentage: number;
}

interface SegmentationResponse {
  success: boolean;
  study_id: string;
  message: string;
  segmentation_type: string;
  algorithm_used: string;
  segmentation_results?: SegmentationResult[];
  processing_time_seconds?: number;
  ai_recommendations?: string[];
  next_steps?: string[];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: SegmentationRequest = await req.json();
    const startTime = Date.now();

    if (!request.study_id || !request.modality || !request.body_part) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'study_id, modality, and body_part are required',
        }),
        {
          status: 400,
          headers: { ...cors_headers, 'Content-Type': 'application/json' },
        }
      );
    }

    // Segmentation type defaults
    const segmentationType = request.segmentation_type || 'organ';
    const algorithm = request.algorithm || 'deep_learning';

    // Simulate segmentation based on body part
    let segmentationResults: SegmentationResult[] = [];

    if (request.body_part.toLowerCase().includes('abdomen')) {
      segmentationResults = [
        {
          segment_id: 'SEG-LIVER-001',
          volume_ml: 1485,
          density_hu: 55,
          surface_area_cm2: 342,
          characteristics: {
            cirrhosis_score: 2,
            steatosis: 'mild',
            enhancement_pattern: 'normal',
            heterogeneity: 'homogeneous',
          },
          center_of_mass: { x: 185, y: 210, z: 45 },
          quality_score: 0.94,
          confidence_percentage: 96,
        },
        {
          segment_id: 'SEG-KIDNEY-R-001',
          volume_ml: 145,
          density_hu: 35,
          surface_area_cm2: 95,
          characteristics: {
            corticomedullary_differentiation: 'preserved',
            focal_lesions: 0,
            hydronephrosis: 'none',
            perfusion: 'normal',
          },
          center_of_mass: { x: 240, y: 200, z: 35 },
          quality_score: 0.91,
          confidence_percentage: 94,
        },
        {
          segment_id: 'SEG-KIDNEY-L-001',
          volume_ml: 142,
          density_hu: 33,
          surface_area_cm2: 93,
          characteristics: {
            corticomedullary_differentiation: 'preserved',
            focal_lesions: 0,
            hydronephrosis: 'none',
            perfusion: 'normal',
          },
          center_of_mass: { x: 130, y: 205, z: 38 },
          quality_score: 0.89,
          confidence_percentage: 92,
        },
        {
          segment_id: 'SEG-PANCREAS-001',
          volume_ml: 82,
          density_hu: 42,
          surface_area_cm2: 48,
          characteristics: {
            ductal_dilation: 'none',
            signal_intensity: 'normal',
            fatty_infiltration: 'minimal',
            enhancement: 'homogeneous',
          },
          center_of_mass: { x: 160, y: 180, z: 42 },
          quality_score: 0.87,
          confidence_percentage: 89,
        },
      ];
    } else if (request.body_part.toLowerCase().includes('brain')) {
      segmentationResults = [
        {
          segment_id: 'SEG-GRAY-MATTER-001',
          volume_ml: 485,
          characteristics: {
            hemispheric_asymmetry: 'minimal',
            cortical_thickness_mm: 2.8,
            sulcal_pattern: 'normal',
            gyration_complexity: 'normal',
          },
          quality_score: 0.93,
          confidence_percentage: 95,
        },
        {
          segment_id: 'SEG-WHITE-MATTER-001',
          volume_ml: 412,
          characteristics: {
            white_matter_hyperintensities: 'none',
            signal_integrity: 'normal',
            myelination: 'complete',
            tract_connectivity: 'normal',
          },
          quality_score: 0.91,
          confidence_percentage: 93,
        },
        {
          segment_id: 'SEG-VENTRICLES-001',
          volume_ml: 45,
          characteristics: {
            ventricular_size: 'normal',
            inferior_horn_diameter_mm: 12,
            temporal_horn_diameter_mm: 8,
            third_ventricle_width_mm: 6,
          },
          quality_score: 0.96,
          confidence_percentage: 97,
        },
      ];
    } else if (request.body_part.toLowerCase().includes('chest')) {
      segmentationResults = [
        {
          segment_id: 'SEG-LUNGS-001',
          volume_ml: 2850,
          characteristics: {
            left_volume_ml: 1410,
            right_volume_ml: 1440,
            density_heterogeneity: 'normal',
            airway_patent: true,
            pleural_effusion: 'none',
          },
          quality_score: 0.95,
          confidence_percentage: 97,
        },
        {
          segment_id: 'SEG-HEART-001',
          volume_ml: 520,
          characteristics: {
            ejection_fraction_percent: 62,
            wall_thickness_mm: 11,
            chamber_dilation: 'none',
            valvular_disease: 'none',
          },
          quality_score: 0.92,
          confidence_percentage: 94,
        },
      ];
    }

    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;

    // Generate AI recommendations based on segmentation
    const aiRecommendations = [];
    if (request.body_part.toLowerCase().includes('abdomen')) {
      aiRecommendations.push('Liver volume within normal range');
      aiRecommendations.push('Kidneys symmetric with preserved function');
      aiRecommendations.push('No focal lesions detected in major organs');
    } else if (request.body_part.toLowerCase().includes('brain')) {
      aiRecommendations.push('No acute intracranial abnormalities');
      aiRecommendations.push('Ventricular system normal in size and configuration');
      aiRecommendations.push('Gray/white matter differentiation preserved');
    } else if (request.body_part.toLowerCase().includes('chest')) {
      aiRecommendations.push('Lung volumes balanced and normal');
      aiRecommendations.push('Cardiac chambers normal size');
      aiRecommendations.push('No pleural effusions or pneumothorax');
    }

    // Next steps
    const nextSteps = [
      'Review segmentation overlay with radiologist',
      'Generate volumetric analysis report',
      'Store segmentation in PACS archive',
      'Export for surgical planning if needed',
    ];

    const response: SegmentationResponse = {
      success: true,
      study_id: request.study_id,
      message: `Segmentation completed for ${request.body_part} using ${algorithm}`,
      segmentation_type: segmentationType,
      algorithm_used: algorithm,
      segmentation_results: segmentationResults,
      processing_time_seconds: Math.round(processingTime * 100) / 100,
      ai_recommendations: aiRecommendations,
      next_steps: nextSteps,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in segmentation:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error processing segmentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
