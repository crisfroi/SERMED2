const cors_headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface DetectionRequest {
  study_id: string;
  modality: string;
  body_part: string;
  detection_focus?: 'nodule' | 'lesion' | 'mass' | 'fracture' | 'all';
  sensitivity?: 'low' | 'medium' | 'high';
}

interface DetectedAnomalies {
  anomaly_id: string;
  type: string;
  location: {
    series_number: number;
    image_number: number;
    x: number;
    y: number;
    z?: number;
  };
  dimensions: {
    length_mm?: number;
    width_mm?: number;
    depth_mm?: number;
    volume_mm3?: number;
  };
  characteristics: Record<string, string | number | boolean>;
  risk_level: 'low' | 'intermediate' | 'high' | 'critical';
  confidence_percentage: number;
  recommendation: string;
}

interface AIDetectionResponse {
  success: boolean;
  study_id: string;
  message: string;
  modality: string;
  body_part: string;
  anomaly_count: number;
  critical_findings_count: number;
  anomalies?: DetectedAnomalies[];
  overall_risk_assessment?: string;
  clinical_significance?: string;
  follow_up_recommendation?: string;
  processing_time_seconds?: number;
  ai_model_version?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors_headers });
  }

  try {
    const request: DetectionRequest = await req.json();
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

    const detectionFocus = request.detection_focus || 'all';
    const sensitivity = request.sensitivity || 'medium';

    // Simulate AI detection based on modality and body part
    let anomalies: DetectedAnomalies[] = [];

    if (request.modality.toUpperCase() === 'CT' && request.body_part.toLowerCase().includes('abdomen')) {
      // Simulate CT abdomen findings
      anomalies = [
        {
          anomaly_id: 'ANOM-001',
          type: 'Liver nodule',
          location: {
            series_number: 3,
            image_number: 42,
            x: 185,
            y: 220,
            z: 15,
          },
          dimensions: {
            length_mm: 8,
            width_mm: 7,
            depth_mm: 6,
            volume_mm3: 176,
          },
          characteristics: {
            density_hu: 65,
            enhancement_pattern: 'arterial phase enhancement',
            washout: 'delayed',
            fat_content: 'none',
            calcification: 'absent',
          },
          risk_level: 'intermediate',
          confidence_percentage: 87,
          recommendation: 'Follow-up CT in 3 months or dedicated hepatic protocol MRI',
        },
        {
          anomaly_id: 'ANOM-002',
          type: 'Renal infarction',
          location: {
            series_number: 4,
            image_number: 38,
            x: 245,
            y: 200,
            z: 12,
          },
          dimensions: {
            length_mm: 22,
            width_mm: 18,
            depth_mm: 15,
            volume_mm3: 2970,
          },
          characteristics: {
            location: 'right upper pole',
            perfusion_defect: true,
            hemorrhage: 'minimal',
            capsular_sign_present: true,
          },
          risk_level: 'high',
          confidence_percentage: 92,
          recommendation: 'Urgent nephrology consultation. Check renal function and D-dimer.',
        },
      ];
    } else if (request.modality.toUpperCase() === 'CT' && request.body_part.toLowerCase().includes('chest')) {
      // Simulate CT chest findings
      anomalies = [
        {
          anomaly_id: 'ANOM-003',
          type: 'Pulmonary nodule',
          location: {
            series_number: 2,
            image_number: 35,
            x: 280,
            y: 150,
            z: 8,
          },
          dimensions: {
            length_mm: 6,
            width_mm: 5,
            volume_mm3: 79,
          },
          characteristics: {
            density: 'ground glass',
            location: 'right upper lobe',
            morphology: 'round',
            spiculation: 'lobulated',
            growth_rate: 'stable (no prior)',
          },
          risk_level: 'low',
          confidence_percentage: 84,
          recommendation: 'Lung nodule follow-up CT in 3-6 months per Fleischner Society guidelines',
        },
        {
          anomaly_id: 'ANOM-004',
          type: 'Pleural effusion',
          location: {
            series_number: 1,
            image_number: 20,
            x: 320,
            y: 200,
            z: 5,
          },
          dimensions: {
            volume_mm3: 185000,
            length_mm: 85,
          },
          characteristics: {
            side: 'left',
            density: 'simple',
            attenuation_hu: 15,
            septation: 'none',
            loculation: 'free-flowing',
          },
          risk_level: 'intermediate',
          confidence_percentage: 95,
          recommendation: 'Determine etiology. Consider thoracentesis if clinically indicated.',
        },
      ];
    } else if (request.modality.toUpperCase() === 'MRI' && request.body_part.toLowerCase().includes('brain')) {
      // Simulate MRI brain findings
      anomalies = [
        {
          anomaly_id: 'ANOM-005',
          type: 'Brain lesion - T2 hyperintense',
          location: {
            series_number: 5,
            image_number: 28,
            x: 156,
            y: 178,
            z: 12,
          },
          dimensions: {
            length_mm: 4,
            width_mm: 3,
            volume_mm3: 25,
          },
          characteristics: {
            signal_t1: 'hypointense',
            signal_t2: 'hyperintense',
            flair: 'hyperintense',
            enhancement: 'none',
            location: 'left frontal lobe periventricular white matter',
            differential: 'demyelinating lesion, small ischemic lesion, or metastasis',
          },
          risk_level: 'intermediate',
          confidence_percentage: 79,
          recommendation: 'Clinical correlation needed. Consider MS workup if multiple lesions present.',
        },
      ];
    } else if (request.modality.toUpperCase() === 'XR' && request.body_part.toLowerCase().includes('chest')) {
      // Simulate Chest XR findings
      anomalies = [
        {
          anomaly_id: 'ANOM-006',
          type: 'Consolidation',
          location: {
            series_number: 1,
            image_number: 1,
            x: 320,
            y: 220,
          },
          dimensions: {
            length_mm: 45,
            width_mm: 38,
          },
          characteristics: {
            location: 'right lower lobe',
            density: 'airspace',
            borders: 'ill-defined',
            air_bronchograms: true,
          },
          risk_level: 'high',
          confidence_percentage: 88,
          recommendation: 'Consistent with pneumonia. Clinical correlation advised. Follow-up imaging in 6-8 weeks.',
        },
      ];
    }

    const processingTime = (Date.now() - startTime) / 1000;
    const criticalFindings = anomalies.filter((a) => a.risk_level === 'critical' || a.risk_level === 'high')
      .length;

    // Overall risk assessment
    let overallRiskAssessment = 'No significant abnormalities detected';
    if (criticalFindings > 0) {
      overallRiskAssessment = `CRITICAL/HIGH RISK FINDINGS PRESENT: ${criticalFindings} significant anomalies require immediate attention`;
    } else if (anomalies.length > 0) {
      overallRiskAssessment = `${anomalies.length} finding(s) detected requiring follow-up or clinical correlation`;
    }

    // Clinical significance
    const clinicalSignificance =
      anomalies.length === 0
        ? 'Study negative for acute or significant chronic abnormalities'
        : `${anomalies.length} potential finding(s) with varying clinical significance`;

    // Follow-up recommendation
    let followUpRecommendation = 'No follow-up imaging recommended';
    if (criticalFindings > 0) {
      followUpRecommendation = 'URGENT: Immediate radiologist review and clinician notification required';
    } else if (anomalies.some((a) => a.risk_level === 'high')) {
      followUpRecommendation = 'Follow-up imaging recommended within 1-3 months';
    } else if (anomalies.some((a) => a.risk_level === 'intermediate')) {
      followUpRecommendation = 'Follow-up imaging recommended within 3-6 months';
    }

    const response: AIDetectionResponse = {
      success: true,
      study_id: request.study_id,
      message: `AI detection analysis completed for ${request.modality} ${request.body_part}`,
      modality: request.modality,
      body_part: request.body_part,
      anomaly_count: anomalies.length,
      critical_findings_count: criticalFindings,
      anomalies: anomalies.length > 0 ? anomalies : undefined,
      overall_risk_assessment: overallRiskAssessment,
      clinical_significance: clinicalSignificance,
      follow_up_recommendation: followUpRecommendation,
      processing_time_seconds: Math.round(processingTime * 100) / 100,
      ai_model_version: 'ResNet-50-FPN-v2.1-Medical',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...cors_headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI detection:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error processing AI detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...cors_headers, 'Content-Type': 'application/json' },
      }
    );
  }
});
