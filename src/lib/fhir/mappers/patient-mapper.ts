import { FHIR } from '../types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mapea un paciente de HOSIX a FHIR Patient
 */
export function mapDBPatientToFHIR(patient: any): FHIR.Patient {
  return {
    resourceType: 'Patient',
    id: patient.ppi || patient.id,
    identifier: [
      {
        system: 'http://hosix.health/ppi',
        value: patient.ppi,
        use: 'official',
      },
      ...(patient.numero_documento
        ? [
            {
              system: 'http://hosix.health/cedula',
              value: patient.numero_documento,
              use: 'official',
            },
          ]
        : []),
    ],
    name: [
      {
        use: 'official',
        family: [patient.primer_apellido, patient.segundo_apellido].filter(Boolean).join(' '),
        given: [patient.primer_nombre, patient.segundo_nombre].filter(Boolean),
      },
    ],
    telecom: [
      ...(patient.telefono_movil
        ? [
            {
              system: 'phone' as const,
              value: patient.telefono_movil,
              use: 'mobile' as const,
            },
          ]
        : []),
      ...(patient.email
        ? [
            {
              system: 'email' as const,
              value: patient.email,
              use: 'work' as const,
            },
          ]
        : []),
    ],
    gender: patient.sexo?.toLowerCase() as 'male' | 'female' | 'other' | undefined,
    birthDate: patient.fecha_nacimiento
      ? new Date(patient.fecha_nacimiento).toISOString().split('T')[0]
      : undefined,
    address: [
      {
        use: 'home' as const,
        type: 'physical' as const,
        line: patient.direccion ? [patient.direccion] : undefined,
        city: patient.ciudad,
        state: patient.provincia,
        postalCode: patient.codigo_postal,
        country: patient.pais || 'GQ',
      },
    ],
    maritalStatus: patient.estado_civil
      ? {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
              code: patient.estado_civil,
            },
          ],
        }
      : undefined,
    active: patient.activo !== false,
    meta: {
      lastUpdated: patient.updated_at || patient.created_at,
      source: '#hosix-patient-service',
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
  };
}

/**
 * Mapea un FHIR Patient a HOSIX
 */
export function mapFHIRPatientToDB(fhirPatient: FHIR.Patient): Partial<any> {
  const nameValue = fhirPatient.name?.[0];
  const phoneValue = fhirPatient.telecom?.find((t) => t.system === 'phone');
  const emailValue = fhirPatient.telecom?.find((t) => t.system === 'email');
  const addressValue = fhirPatient.address?.[0];

  const familyParts = nameValue?.family?.split(' ') || [];
  const givenParts = nameValue?.given || [];

  return {
    ppi:
      fhirPatient.identifier?.find((i) => i.system === 'http://hosix.health/ppi')?.value ||
      fhirPatient.id,
    numero_documento: fhirPatient.identifier?.find(
      (i) => i.system === 'http://hosix.health/cedula'
    )?.value,
    primer_nombre: givenParts[0],
    segundo_nombre: givenParts[1],
    primer_apellido: familyParts[0],
    segundo_apellido: familyParts[1],
    fecha_nacimiento: fhirPatient.birthDate
      ? new Date(fhirPatient.birthDate).toISOString()
      : undefined,
    sexo: fhirPatient.gender?.charAt(0).toUpperCase() as 'M' | 'F' | 'O' | undefined,
    telefono_movil: phoneValue?.value,
    email: emailValue?.value,
    direccion: addressValue?.line?.join(', '),
    ciudad: addressValue?.city,
    provincia: addressValue?.state,
    codigo_postal: addressValue?.postalCode,
    pais: addressValue?.country || 'GQ',
    estado_civil: fhirPatient.maritalStatus?.coding?.[0]?.code,
    activo: fhirPatient.active !== false,
  };
}

/**
 * Obtiene un paciente de HOSIX y lo convierte a FHIR
 */
export async function getPatientAsFHIR(patientId: string): Promise<FHIR.Patient | null> {
  const { data: patient, error } = await supabase
    .from('hosix_pacientes')
    .select('*')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    return null;
  }

  return mapDBPatientToFHIR(patient);
}

/**
 * Busca pacientes por identificador y retorna en formato FHIR Bundle
 */
export async function searchPatientsAsFHIR(
  identifier?: string,
  name?: string
): Promise<FHIR.Bundle> {
  let query = supabase.from('hosix_pacientes').select('*').eq('activo', true);

  if (identifier) {
    query = query.or(`ppi.ilike.%${identifier}%,numero_documento.ilike.%${identifier}%`);
  }

  if (name) {
    query = query.or(
      `primer_nombre.ilike.%${name}%,primer_apellido.ilike.%${name}%,segundo_nombre.ilike.%${name}%,segundo_apellido.ilike.%${name}%`
    );
  }

  const { data: patients, error } = await query.limit(50);

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
    total: patients?.length || 0,
    entry:
      patients?.map((patient) => ({
        fullUrl: `http://hosix.health/fhir/Patient/${patient.ppi}`,
        resource: mapDBPatientToFHIR(patient),
      })) || [],
  };
}

