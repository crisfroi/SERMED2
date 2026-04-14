// ============================================================================
// useDicomViewer Hook - DICOM Image Fetching from Orthanc
// ============================================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DicomImage {
  id: string;
  instanceId: string;
  seriesNumber: number;
  instanceNumber: number;
  imageUrl: string;
  metadata: {
    patientName: string;
    patientId: string;
    studyDate: string;
    modality: string;
    seriesDescription: string;
  };
}

export const useDicomViewer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string |null>(null);

  const fetchDicomImages = useCallback(
    async (imagingOrderId: string, seriesId?: string): Promise<DicomImage[]> => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from imaging_series and dicom_instances
        let query = supabase
          .from('imaging_series')
          .select(
            `
            id,
            dicom_series_uid,
            dicom_series_number,
            series_description,
            dicom_instances(
              id,
              orthanc_instance_id,
              dicom_instance_number,
              orthanc_preview_url,
              dicom_metadata
            ),
            imaging_orders!inner(
              id,
              modality_id,
              imaging_modalities(modality_code)
            )
          `
          )
          .eq('imaging_order_id', imagingOrderId);

        if (seriesId) {
          query = query.eq('id', seriesId);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        const images: DicomImage[] = [];

        (data || []).forEach((series: any) => {
          (series.dicom_instances || []).forEach((instance: any, idx: number) => {
            images.push({
              id: instance.id,
              instanceId: instance.orthanc_instance_id,
              seriesNumber: series.dicom_series_number || 0,
              instanceNumber: instance.dicom_instance_number || idx + 1,
              imageUrl: instance.orthanc_preview_url || '',
              metadata: {
                patientName: instance.dicom_metadata?.PatientName || 'N/A',
                patientId: instance.dicom_metadata?.PatientID || 'N/A',
                studyDate: instance.dicom_metadata?.StudyDate || new Date().toISOString(),
                modality: series.imaging_orders[0]?.imaging_modalities?.modality_code || 'N/A',
                seriesDescription: series.series_description || 'Series',
              },
            });
          });
        });

        return images;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching DICOM images';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadImage = useCallback(
    async (instanceId: string, patientName: string): Promise<void> => {
      try {
        // Call Edge Function to download from Orthanc
        const response = await supabase.functions.invoke('download_dicom_instance', {
          body: { instanceId },
        });

        if (response.error) throw response.error;

        // Trigger download
        const blob = new Blob([response.data], { type: 'application/dicom' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${patientName}_${instanceId}.dcm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Error downloading image'
        );
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchDicomImages,
    downloadImage,
  };
};

export default useDicomViewer;
