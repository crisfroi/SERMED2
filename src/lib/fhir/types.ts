/**
 * FHIR R4 Type Definitions
 * Based on HL7 FHIR 4.0.1 specification
 */

export namespace FHIR {
  export interface Patient {
    resourceType: 'Patient';
    id?: string;
    identifier?: Identifier[];
    name?: HumanName[];
    telecom?: ContactPoint[];
    gender?: 'male' | 'female' | 'other' | 'unknown';
    birthDate?: string;
    address?: Address[];
    maritalStatus?: CodeableConcept;
    contact?: PatientContact[];
    generalPractitioner?: Reference[];
    managingOrganization?: Reference[];
    active?: boolean;
    meta?: Meta;
  }

  export interface Encounter {
    resourceType: 'Encounter';
    id?: string;
    identifier?: Identifier[];
    status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
    class: Coding;
    type?: CodeableConcept[];
    subject: Reference;
    participant?: EncounterParticipant[];
    period?: Period;
    reasonCode?: CodeableConcept[];
    diagnosis?: EncounterDiagnosis[];
    hospitalization?: EncounterHospitalization;
    location?: EncounterLocation[];
    meta?: Meta;
  }

  export interface Observation {
    resourceType: 'Observation';
    id?: string;
    status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
    category?: CodeableConcept[];
    code: CodeableConcept;
    subject: Reference;
    encounter?: Reference;
    effectiveDateTime?: string;
    valueQuantity?: Quantity;
    valueString?: string;
    valueBoolean?: boolean;
    valueCodeableConcept?: CodeableConcept;
    interpretation?: CodeableConcept[];
    referenceRange?: ObservationReferenceRange[];
    meta?: Meta;
  }

  export interface MedicationRequest {
    resourceType: 'MedicationRequest';
    id?: string;
    status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
    intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
    category?: CodeableConcept[];
    priority?: 'routine' | 'urgent' | 'asap' | 'stat';
    medicationCodeableConcept?: CodeableConcept;
    medicationReference?: Reference;
    subject: Reference;
    encounter?: Reference;
    authoredOn?: string;
    requester?: Reference;
    dosageInstruction?: Dosage[];
    dispenseRequest?: MedicationRequestDispenseRequest;
    meta?: Meta;
  }

  export interface DiagnosticReport {
    resourceType: 'DiagnosticReport';
    id?: string;
    status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
    category?: CodeableConcept[];
    code: CodeableConcept;
    subject: Reference;
    encounter?: Reference;
    effectiveDateTime?: string;
    issued?: string;
    performer?: Reference[];
    result?: Reference[];
    conclusion?: string;
    meta?: Meta;
  }

  export interface Identifier {
    system?: string;
    value: string;
    use?: 'usual' | 'official' | 'temp' | 'secondary';
  }

  export interface HumanName {
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
  }

  export interface ContactPoint {
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }

  export interface Address {
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }

  export interface CodeableConcept {
    coding?: Coding[];
    text?: string;
  }

  export interface Coding {
    system?: string;
    code?: string;
    display?: string;
  }

  export interface Reference {
    reference?: string;
    display?: string;
    identifier?: Identifier;
  }

  export interface Period {
    start?: string;
    end?: string;
  }

  export interface Quantity {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  }

  export interface Meta {
    lastUpdated?: string;
    source?: string;
    profile?: string[];
    versionId?: string;
  }

  export interface PatientContact {
    relationship?: CodeableConcept[];
    name?: HumanName;
    telecom?: ContactPoint[];
  }

  export interface EncounterParticipant {
    type?: CodeableConcept[];
    period?: Period;
    individual?: Reference;
  }

  export interface EncounterDiagnosis {
    condition: Reference;
    use?: CodeableConcept;
  }

  export interface EncounterHospitalization {
    admitSource?: CodeableConcept;
    dischargeDisposition?: CodeableConcept;
  }

  export interface EncounterLocation {
    location: Reference;
    status?: 'planned' | 'active' | 'reserved' | 'completed';
    period?: Period;
  }

  export interface ObservationReferenceRange {
    low?: Quantity;
    high?: Quantity;
    text?: string;
  }

  export interface Dosage {
    text?: string;
    timing?: Timing;
    route?: CodeableConcept;
    method?: CodeableConcept;
    doseQuantity?: Quantity;
    rateRatio?: Ratio;
    rateQuantity?: Quantity;
  }

  export interface Timing {
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
      timeOfDay?: string[];
    };
  }

  export interface Ratio {
    numerator?: Quantity;
    denominator?: Quantity;
  }

  export interface MedicationRequestDispenseRequest {
    numberOfRepeatsAllowed?: number;
    quantity?: Quantity;
    expectedSupplyDuration?: Quantity;
  }

  export interface Bundle {
    resourceType: 'Bundle';
    type: 'searchset' | 'history' | 'transaction' | 'batch' | 'collection' | 'document' | 'message';
    total?: number;
    entry?: BundleEntry[];
  }

  export interface BundleEntry {
    fullUrl?: string;
    resource?: any;
    request?: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
    };
  }

  export interface OperationOutcome {
    resourceType: 'OperationOutcome';
    issue: {
      severity: 'fatal' | 'error' | 'warning' | 'information';
      code: string;
      details?: CodeableConcept;
      diagnostics?: string;
    }[];
  }
}

