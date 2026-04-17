import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface ContactTrace {
  contact_id: string;
  source_patient_id: string;
  contact_person_id?: string;
  contact_date: string;
  exposure_duration_minutes: number;
  proximity_type: 'household' | 'workplace' | 'healthcare' | 'community' | 'unknown';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  vaccination_status: 'fully_vaccinated' | 'partially_vaccinated' | 'unvaccinated' | 'unknown';
  sympt_monitoring_start: string;
  last_health_check?: string;
  status: 'contacts_identified' | 'notified' | 'monitoring' | 'symptomatic' | 'cleared';
}

export interface EpidemiologicalEvent {
  event_id: string;
  event_type: 'suspected_outbreak' | 'confirmed_outbreak' | 'cluster' | 'endemic_increase';
  disease_name: string;
  initial_case_id: string;
  event_start_date: string;
  event_location: string;
  affected_population_count: number;
  total_cases: number;
  hospitalizations: number;
  deaths: number;
  status: 'investigating' | 'active' | 'controlled' | 'resolved';
  containment_measures: string[];
}

export interface PublicHealthAlert {
  alert_id: string;
  alert_type: 'disease_alert' | 'vaccine_alert' | 'travel_advisory' | 'outbreak_notice';
  disease_or_condition: string;
  affected_areas: string[];
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  recommended_actions: string[];
  issued_date: string;
  expiration_date: string;
  responsible_authority: string;
}

export const useContactTracing = () => {
  const identifyContacts = async (patientId: string, exposureDate: string) => {
    try {
      // Query for contacts based on location tracking or reported exposures
      const { data, error } = await supabase
        .from('contact_traces')
        .select('*')
        .eq('source_patient_id', patientId)
        .gte('contact_date', exposureDate);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error identifying contacts:', error);
      return [];
    }
  };

  const notifyContacts = async (contactIds: string[], message: string) => {
    try {
      const notifications = contactIds.map((contactId) => ({
        contact_id: contactId,
        notification_type: 'exposure_notification',
        message,
        sent_date: new Date().toISOString(),
        read: false,
      }));

      const { data, error } = await supabase
        .from('contact_notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      // Update contact status
      await supabase
        .from('contact_traces')
        .update({ status: 'notified' })
        .in('contact_id', contactIds);

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'contacts_notified',
          table_name: 'contact_traces',
          record_id: null,
          patient_id: null,
          details: `${contactIds.length} contacts notified of exposure`,
          severity: 'high',
        },
      ]);

      return data;
    } catch (error) {
      console.error('Error notifying contacts:', error);
      return null;
    }
  };

  const startSymptomMonitoring = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('contact_traces')
        .update({
          status: 'monitoring',
          sympt_monitoring_start: new Date().toISOString(),
        })
        .eq('contact_id', contactId)
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'symptom_monitoring_started',
          table_name: 'contact_traces',
          record_id: contactId,
          patient_id: null,
          details: 'Symptom monitoring initiated for contact',
          severity: 'medium',
        },
      ]);

      return data?.[0] || null;
    } catch (error) {
      console.error('Error starting symptom monitoring:', error);
      return null;
    }
  };

  const reportEpidemicEvent = async (
    event: Omit<EpidemiologicalEvent, 'event_id'>
  ): Promise<EpidemiologicalEvent | null> => {
    try {
      const epidemiologicalEvent: EpidemiologicalEvent = {
        event_id: `EVENT-${Date.now()}`,
        ...event,
      };

      const { data, error } = await supabase
        .from('epidemiology_events')
        .insert([epidemiologicalEvent])
        .select();

      if (error) throw error;

      const severityMap = {
        investigating: 'medium',
        active: 'high',
        controlled: 'medium',
        resolved: 'low',
      };

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'epidemiology_event_reported',
          table_name: 'epidemiology_events',
          record_id: data?.[0]?.event_id,
          patient_id: null,
          details: `${event.event_type}: ${event.disease_name} - ${event.affected_population_count} affected`,
          severity: severityMap[event.status] || 'high',
        },
      ]);

      return data?.[0] || epidemiologicalEvent;
    } catch (error) {
      console.error('Error reporting epidemic event:', error);
      return null;
    }
  };

  const issuePublicHealthAlert = async (
    alert: Omit<PublicHealthAlert, 'alert_id'>
  ): Promise<PublicHealthAlert | null> => {
    try {
      const publicHealthAlert: PublicHealthAlert = {
        alert_id: `ALERT-${Date.now()}`,
        ...alert,
      };

      const { data, error } = await supabase
        .from('public_health_alerts')
        .insert([publicHealthAlert])
        .select();

      if (error) throw error;

      const severityMap = {
        low: 'low',
        moderate: 'medium',
        high: 'high',
        critical: 'high',
      };

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'public_health_alert_issued',
          table_name: 'public_health_alerts',
          record_id: data?.[0]?.alert_id,
          patient_id: null,
          details: `Alert: ${alert.alert_type} - ${alert.disease_or_condition}`,
          severity: severityMap[alert.risk_level],
        },
      ]);

      return data?.[0] || publicHealthAlert;
    } catch (error) {
      console.error('Error issuing public health alert:', error);
      return null;
    }
  };

  const getContactTracingMetrics = async (diseaseType?: string) => {
    try {
      const { data: contacts, error: contactError } = await supabase
        .from('contact_traces')
        .select('*')
        .eq('status', 'monitoring');

      const { data: events, error: eventError } = await supabase
        .from('epidemiology_events')
        .select('*')
        .eq('status', 'active');

      if (contactError || eventError) throw contactError || eventError;

      const activeContacts = contacts || [];
      const activeEvents = events || [];

      const criticalRiskContacts = activeContacts.filter((c) => c.risk_level === 'critical');
      const symptomaticContacts = activeContacts.filter((c) => c.status === 'symptomatic');

      return {
        totalContactsMonitored: activeContacts.length,
        criticalRiskCount: criticalRiskContacts.length,
        symptomaticCount: symptomaticContacts.length,
        activeOutbreaks: activeEvents.length,
        totalCasesInOutbreaks: activeEvents.reduce((sum, e) => sum + e.total_cases, 0),
        estimatedSecondaryAttackRate:
          activeContacts.length > 0
            ? Math.round(
                (symptomaticContacts.length / activeContacts.length) * 100 * 10
              ) / 10
            : 0,
      };
    } catch (error) {
      console.error('Error getting contact tracing metrics:', error);
      return null;
    }
  };

  return {
    identifyContacts,
    notifyContacts,
    startSymptomMonitoring,
    reportEpidemicEvent,
    issuePublicHealthAlert,
    getContactTracingMetrics,
  };
};
