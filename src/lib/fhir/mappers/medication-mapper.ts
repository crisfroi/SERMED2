// @ts-nocheck
import { FHIR } from '../types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mapea una prescripción de HOSIX a FHIR MedicationRequest
 */
export function mapDBPrescriptionToFHIR(prescription: any): FHIR.MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id: prescription.id,
    status: mapPrescriptionStatusToFHIR(prescription.estado),
    intent: 'order',
    priority: prescription.urgente ? 'urgent' : 'routine',
    medicationCodeableConcept: prescription.medicamento_texto
      ? {
          text: prescription.medicamento_texto,
        }
      : prescription.medicamento_id
      ? {
          coding: [
            {
              system: 'http://hosix.health/medications',
              code: prescription.medicamento_id,
            },
          ],
        }
      : undefined,
    subject: {
      reference: `Patient/${prescription.paciente_id}`,
    },
    encounter: prescription.episodio_id
      ? {
          reference: `Encounter/${prescription.episodio_id}`,
        }
      : undefined,
    authoredOn: prescription.fecha_prescripcion,
    requester: prescription.prescriptor_id
      ? {
          reference: `Practitioner/${prescription.prescriptor_id}`,
        }
      : undefined,
    dosageInstruction: [
      {
        text: `${prescription.dosis} ${prescription.frecuencia} ${prescription.via_administracion || ''}`.trim(),
        route: prescription.via_administracion
          ? {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
                  code: mapRouteToFHIR(prescription.via_administracion),
                  display: prescription.via_administracion,
                },
              ],
            }
          : undefined,
        doseQuantity: prescription.dosis
          ? {
              value: parseFloat(prescription.dosis) || undefined,
              unit: extractUnit(prescription.dosis),
            }
          : undefined,
        timing: prescription.frecuencia
          ? {
              repeat: {
                frequency: extractFrequency(prescription.frecuencia),
                period: 1,
                periodUnit: 'd' as const,
              },
            }
          : undefined,
      },
    ],
    dispenseRequest: prescription.duracion_dias
      ? {
          expectedSupplyDuration: {
            value: prescription.duracion_dias,
            unit: 'days',
            system: 'http://unitsofmeasure.org',
            code: 'd',
          },
        }
      : undefined,
    meta: {
      lastUpdated: prescription.updated_at || prescription.created_at,
      source: '#hosix-prescription-service',
      profile: ['http://hl7.org/fhir/StructureDefinition/MedicationRequest'],
    },
  };
}

/**
 * Mapea un FHIR MedicationRequest a HOSIX
 */
export function mapFHIRMedicationRequestToDB(
  fhirRx: FHIR.MedicationRequest
): Partial<any> {
  const dosage = fhirRx.dosageInstruction?.[0];
  const subjectId = fhirRx.subject?.reference?.replace('Patient/', '');
  const encounterId = fhirRx.encounter?.reference?.replace('Encounter/', '');
  const requesterId = fhirRx.requester?.reference?.replace('Practitioner/', '');

  return {
    paciente_id: subjectId,
    episodio_id: encounterId,
    prescriptor_id: requesterId,
    medicamento_texto: fhirRx.medicationCodeableConcept?.text,
    medicamento_id: fhirRx.medicationReference?.reference?.replace('Medication/', ''),
    dosis: dosage?.doseQuantity?.value?.toString() || dosage?.text,
    frecuencia: dosage?.timing?.repeat
      ? `${dosage.timing.repeat.frequency}x al día`
      : undefined,
    via_administracion: dosage?.route?.coding?.[0]?.code || dosage?.route?.text,
    duracion_dias: fhirRx.dispenseRequest?.expectedSupplyDuration?.value,
    fecha_prescripcion: fhirRx.authoredOn || new Date().toISOString(),
    estado: mapFHIRStatusToPrescription(fhirRx.status),
    urgente: fhirRx.priority === 'urgent' || fhirRx.priority === 'stat',
  };
}

function mapPrescriptionStatusToFHIR(
  estado: string
): FHIR.MedicationRequest['status'] {
  const statusMap: Record<string, FHIR.MedicationRequest['status']> = {
    activa: 'active',
    suspendida: 'on-hold',
    cancelada: 'cancelled',
    completada: 'completed',
    borrador: 'draft',
  };
  return statusMap[estado] || 'unknown';
}

function mapFHIRStatusToPrescription(
  status: FHIR.MedicationRequest['status']
): string {
  const statusMap: Record<string, string> = {
    active: 'activa',
    'on-hold': 'suspendida',
    cancelled: 'cancelada',
    completed: 'completada',
    draft: 'borrador',
    stopped: 'suspendida',
  };
  return statusMap[status] || 'activa';
}

function mapRouteToFHIR(via: string): string {
  const routeMap: Record<string, string> = {
    oral: 'PO',
    intravenosa: 'IV',
    intramuscular: 'IM',
    subcutanea: 'SC',
    topica: 'TOP',
    inhalatoria: 'INH',
  };
  return routeMap[via.toLowerCase()] || via;
}

function extractUnit(dosis: string): string {
  const match = dosis.match(/(\d+)\s*(mg|g|ml|l|unidades?|tabletas?|capsulas?)/i);
  return match ? match[2] : '';
}

function extractFrequency(frecuencia: string): number {
  const match = frecuencia.match(/(\d+)\s*x/i);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Obtiene prescripciones de un paciente en formato FHIR Bundle
 */
export async function getPrescriptionsAsFHIR(
  patientId: string
): Promise<FHIR.Bundle> {
  const { data: prescriptions, error } = await (supabase
    .from('hosix_prescripciones' as any)
    .select('*')
    .eq('paciente_id', patientId)
    .eq('estado', 'activa')
    .order('fecha_prescripcion', { ascending: false }) as any);

  if (error) {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };
  }

  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: prescriptions?.length || 0,
    entry:
      prescriptions?.map((rx: any) => ({
        fullUrl: `http://hosix.health/fhir/MedicationRequest/${rx.id}`,
        resource: mapDBPrescriptionToFHIR(rx),
      })) || [],
  };
}

