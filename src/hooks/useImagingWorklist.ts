import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface ImagingOrder {
  order_id: string;
  patient_id: string;
  ordering_provider_id: string;
  order_date: string;
  modality: 'XR' | 'CT' | 'MRI' | 'US' | 'NM' | 'PET' | 'ECHO' | 'OTHER';
  body_part: string;
  clinical_indication: string;
  urgency: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
}

export interface ImagingStudy {
  study_id: string;
  order_id: string;
  patient_id: string;
  modality: string;
  acquisition_date: string;
  acquisition_time: string;
  series_count: number;
  image_count: number;
  dicom_server_location: string;
  file_size_mb: number;
  status: 'acquired' | 'processing' | 'quality_control' | 'archived' | 'final';
}

export interface ImagingReport {
  report_id: string;
  study_id: string;
  order_id: string;
  patient_id: string;
  radiologist_id: string;
  report_date: string;
  findings: string;
  impression: string;
  recommendation: string;
  report_status: 'preliminary' | 'final' | 'amended';
  critical_findings: boolean;
  critical_finding_notification_sent: boolean;
}

export interface WorklistItem {
  worklist_id: string;
  order_id: string;
  patient_name: string;
  patient_id: string;
  modality: string;
  body_part: string;
  urgency: string;
  scheduled_time?: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
  technologist_assigned?: string;
}

export const useImagingWorklist = () => {
  const createImagingOrder = async (
    order: Omit<ImagingOrder, 'order_id' | 'status'>
  ): Promise<ImagingOrder | null> => {
    try {
      const imagingOrder: ImagingOrder = {
        order_id: `IMG-${Date.now()}`,
        ...order,
        status: 'ordered',
      };

      const { data, error } = await supabase.from('imaging_orders').insert([imagingOrder]).select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'imaging_order_created',
          table_name: 'imaging_orders',
          record_id: data?.[0]?.order_id,
          patient_id: order.patient_id,
          details: `Imaging order: ${order.modality} - ${order.body_part}`,
          severity: order.urgency === 'stat' ? 'high' : 'low',
        },
      ]);

      return data?.[0] || imagingOrder;
    } catch (error) {
      console.error('Error creating imaging order:', error);
      return null;
    }
  };

  const getWorklist = async (filter?: { modality?: string; urgency?: string }) => {
    try {
      let query = supabase
        .from('imaging_orders')
        .select(
          `
          order_id,
          patient_id,
          modality,
          body_part,
          urgency,
          scheduled_date,
          status
        `
        )
        .neq('status', 'cancelled');

      if (filter?.modality) {
        query = query.eq('modality', filter.modality);
      }
      if (filter?.urgency) {
        query = query.eq('urgency', filter.urgency);
      }

      const { data, error } = await query.order('urgency', { ascending: false }).order(
        'scheduled_date',
        { ascending: true }
      );

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting worklist:', error);
      return [];
    }
  };

  const recordStudyAcquisition = async (
    study: Omit<ImagingStudy, 'study_id'>
  ): Promise<ImagingStudy | null> => {
    try {
      const imagingStudy: ImagingStudy = {
        study_id: `STU-${Date.now()}`,
        ...study,
        status: 'acquired',
      };

      const { data, error } = await supabase
        .from('imaging_studies')
        .insert([imagingStudy])
        .select();

      if (error) throw error;

      // Update order status
      await supabase
        .from('imaging_orders')
        .update({ status: 'completed' })
        .eq('order_id', study.order_id);

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'imaging_study_acquired',
          table_name: 'imaging_studies',
          record_id: data?.[0]?.study_id,
          patient_id: study.patient_id,
          details: `Study acquired: ${study.modality} - ${study.series_count} series, ${study.image_count} images`,
          severity: 'low',
        },
      ]);

      return data?.[0] || imagingStudy;
    } catch (error) {
      console.error('Error recording study acquisition:', error);
      return null;
    }
  };

  const submitRadiologyReport = async (
    report: Omit<ImagingReport, 'report_id'>
  ): Promise<ImagingReport | null> => {
    try {
      const radiologyReport: ImagingReport = {
        report_id: `RPT-${Date.now()}`,
        ...report,
      };

      const { data, error } = await supabase
        .from('imaging_reports')
        .insert([radiologyReport])
        .select();

      if (error) throw error;

      // If critical findings, notify ordering provider immediately
      if (report.critical_findings) {
        await supabase.from('critical_notifications').insert([
          {
            notification_id: `CRIT-${Date.now()}`,
            type: 'critical_imaging_finding',
            recipient_provider_id: null, // Would come from order
            message: `CRITICAL FINDING: ${report.impression}`,
            urgency: 'critical',
            created_at: new Date().toISOString(),
          },
        ]);
      }

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'imaging_report_submitted',
          table_name: 'imaging_reports',
          record_id: data?.[0]?.report_id,
          patient_id: report.patient_id,
          details: `Report submitted: ${report.report_status}${report.critical_findings ? ' - CRITICAL FINDINGS' : ''}`,
          severity: report.critical_findings ? 'high' : 'low',
        },
      ]);

      return data?.[0] || radiologyReport;
    } catch (error) {
      console.error('Error submitting radiology report:', error);
      return null;
    }
  };

  const getStudyDetails = async (studyId: string) => {
    try {
      const { data: study, error: studyError } = await supabase
        .from('imaging_studies')
        .select('*')
        .eq('study_id', studyId)
        .single();

      const { data: report, error: reportError } = await supabase
        .from('imaging_reports')
        .select('*')
        .eq('study_id', studyId)
        .single();

      if (studyError && studyError.code !== 'PGRST116') throw studyError;
      if (reportError && reportError.code !== 'PGRST116') throw reportError;

      return {
        study,
        report,
        hasDicomImages: study?.image_count > 0,
        isReported: report !== null,
      };
    } catch (error) {
      console.error('Error getting study details:', error);
      return null;
    }
  };

  const getImagingMetrics = async () => {
    try {
      const { data: orders, error: orderError } = await supabase
        .from('imaging_orders')
        .select('status, urgency');

      const { data: studies, error: studyError } = await supabase
        .from('imaging_studies')
        .select('status, file_size_mb');

      if (orderError || studyError) throw orderError || studyError;

      const orderData = orders || [];
      const studyData = studies || [];

      const pendingOrders = orderData.filter((o) => o.status === 'ordered').length;
      const completedOrders = orderData.filter((o) => o.status === 'completed').length;
      const statOrders = orderData.filter((o) => o.urgency === 'stat').length;

      const totalStorageGB = studyData.reduce((sum, s) => sum + (s.file_size_mb || 0), 0) / 1024;

      return {
        pendingOrders,
        completedOrders,
        statOrdersPending: statOrders,
        totalStudies: studyData.length,
        totalStorageGB: Math.round(totalStorageGB * 100) / 100,
        averageStudySizeMB:
          Math.round(
            (studyData.reduce((sum, s) => sum + (s.file_size_mb || 0), 0) / studyData.length) *
              100
          ) / 100 || 0,
      };
    } catch (error) {
      console.error('Error getting imaging metrics:', error);
      return null;
    }
  };

  return {
    createImagingOrder,
    getWorklist,
    recordStudyAcquisition,
    submitRadiologyReport,
    getStudyDetails,
    getImagingMetrics,
  };
};
