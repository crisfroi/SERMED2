# 🏛️ THALAMUS - Arquitectura General de Centralización de Datos

**Versión**: 2.0  
**Estado**: Specification  
**Fecha**: Abril 2026  
**Impacto**: Cambio CRÍTICO en WEEK 8 - ASIS 13 debe diseñarse con THALAMUS desde el principio

---

## 1. CONCEPTO GENERAL DE THALAMUS

### Evolución del Concepto
- **v1.0 (GAP Analysis)**: Solo epidemiología + alertas + transferencias
- **v2.0 (USER REQUEST)**: **Generalizado** - sincronización de TODOS los datos entre hospitales

### ¿Qué es THALAMUS v2.0?

**THALAMUS es una plataforma centralizada que sincroniza datos CLÍNICOS + ADMINISTRATIVOS de múltiples hospitales RENAPROSA.**

```
RENAPROSA Hospital Network Architecture:

    ┌─────────────────────────────────────────────────────────────┐
    │                  THALAMUS CENTRAL CLOUD                     │
    │  (Sincronización General de Datos + Orquestación Central)   │
    │                                                              │
    │  ├─ REPLICATED CLONE of each hospital DB (read-only)       │
    │  ├─ Aggregation and deduplication layer                    │
    │  ├─ Cross-hospital query engine                            │
    │  ├─ Patient master index (MPI)                             │
    │  ├─ Alert orchestration                                    │
    │  ├─ Analytics + Reporting                                  │
    │  └─ Inter-hospital coordination                            │
    └─────────────────────────────────────────────────────────────┘
                          ↑       ↑       ↑
              API         │       │       │         API
          Webhooks ┌──────┴───┬───┴───┬───┴──────┐  Events
                   │          │       │          │
            ┌──────▼──┐ ┌─────▼──┐ ┌──▼────┐ ┌───▼─────┐
            │ HOSIX 1 │ │ HOSIX 2│ │HOSIX 3│ │ HOSIX N │
            │(Quito)  │ │(Ibarra)│ │(Ambat)│ │ (Loja)  │
            │DB Clone │ │ DB Clone│ │DB Clone│ │ DB Clone│
            └─────────┘ └────────┘ └───────┘ └─────────┘
            Local Frontend + APIs
```

### Principios Clave

```
┌─────────────────────────────────────────────────────────────────┐
│ PRINCIPIO 1: Autonomía Local                                    │
│ Cada hospital mantiene su propia DB. THALAMUS = réplica read-only│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PRINCIPIO 2: Sincronización Bidireccional                        │
│ Hospital → THALAMUS (push) + THALAMUS → Hospital (pull queries) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PRINCIPIO 3: Privacy by Default                                 │
│ Datos sensibles HCE criptados end-to-end. Agregaciones públicas │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PRINCIPIO 4: Single Source of Truth                              │
│ Patient Master Index (MPI) evita duplicados entre hospitales    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENTES PRINCIPALES DE THALAMUS

### 2.1 LAYER 1: Event-Driven Sync (Pub/Sub)

**Qué se sincroniza**: TODO cambio en cualquier tabla importante

```
Eventos que THALAMUS escucha (via Edge Functions Webhooks):

CLÍNICO:
  ├─ nuevo_paciente (demographics)
  ├─ nueva_consulta (encounter, diagnosis, vitals)
  ├─ nuevo_procedimiento (surgery, hospitalization)
  ├─ nueva_orden (lab, medication, imaging)
  ├─ nuevo_resultado (lab_result, imaging_result)
  └─ nuevo_problema_clínico (diagnosis)

ADMINISTRATIVO:
  ├─ cambio_ocupación_cama (bed_status)
  ├─ recurso_faltante (supply_shortage)
  ├─ cambio_staff_disponible (staff_availability)
  ├─ nueva_admisión (hospital_admission)
  ├─ alta_hospitalaria (hospital_discharge)
  └─ transferencia_solicitada (inter_hospital_transfer)

EPIDEMIOLÓGICO:
  ├─ enfermedad_notificable (reportable_disease)
  ├─ contacto_identificado (contact_tracing)
  └─ evento_adverso (pharmacovigilance)

Cada evento dispara:
  1. THALAMUS recibe webhook con delta
  2. Criptación end-to-end si es sensible
  3. Actualiza réplica en THALAMUS DB
  4. Dispara reglas de agregación
  5. Genera alertas si es necesario
  6. Actualiza dashboard de síntesis nacional
```

### 2.2 LAYER 2: Patient Master Index (PMI)

**Problema que resuelve**: Mismo paciente registrado en 3 hospitales con ID diferente

```
Tabla THALAMUS: patient_master_index
  - id (PMI global)
  - name, birthdate, national_id
  - hospital_ids: [
      { hospital: "HOSIX_QUITO", local_id: "uuid-1" },
      { hospital: "HOSIX_IBARRA", local_id: "uuid-2" },
      { hospital: "HOSIX_AMBATO", local_id: "uuid-3" }
    ]
  - encounters_all: ["list de UUIDs of all encounters across hospitals"]
  - problems_all: ["list of all diagnoses across hospitals"]
  - medications_all: ["list of all meds across hospitals"]
  - last_seen_hospital: "HOSIX_QUITO"
  - last_seen_date: timestamp

Cuando paciente llega a HOSIX_IBARRA:
  1. Recepcionista busca por cédula
  2. Sistema consulta PMI en THALAMUS
  3. RESULTADO: "Este paciente existe en HOSIX_QUITO, últimas consultas hace 2 meses"
  4. OPCIÓN: Traer HCE resumen de HOSIX_QUITO (si autorización) or crear nuevo local
  5. PMI se actualiza: nuevo hospital agregado
```

### 2.3 LAYER 3: Real-time Analytics

**Dashboard THALAMUS**:
```
┌─────────────────────────────────────────────────────────────────┐
│ THALAMUS NATIONAL DASHBOARD (en tiempo real)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ OPERACIONAL:                      EPIDEMIOLÓGICO:              │
│ ├─ Camas libres RENAPROSA    │    ├─ TB casos activos        │
│ ├─ Staff disponible por rol  │    ├─ VIH pacientes en TARV   │
│ ├─ Medicamentos en falta     │    ├─ Malaria: casos x semana │
│ └─ Equipos fuera de servicio │    ├─ Dengue: brote indicator │
│                              │    └─ Rastreo contactos: %    │
│ CLÍNICO:                      │    RECURSOS:                   │
│ ├─ Pacientes en urgencias    │    ├─ Occupancy rate          │
│ ├─ Cirugías programadas      │    ├─ Lab turnaround          │
│ ├─ Interconsultas pendientes │    └─ Stock crítico x medicina
│                              │                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 LAYER 4: Inter-Hospital Coordination

**Use Case**: Paciente en HOSIX_QUITO necesita transferencia a HOSIX_IBARRA

```
WORKFLOW THALAMUS Transfer Coordination:

1. MÉDICO en QUITO solicita transferencia
   └─ Sistema genera: transfer_request {
       patient_id, reason, clinical_urgency, required_specialty
     }

2. THALAMUS busca en PMI + DB IBARRA
   └─ ¿Camas disponibles en IBARRA para esa especialidad?
   └─ ¿Equipo de ese specialty disponible?

3. THALAMUS genera opciones:
   └─ "IBARRA tiene 2 camas UCI, Dr. Laura disponible"
   └─ "AMBATO tiene 1 cama UCI, Dr. Carlos disponible"

4. QUITO acepta transferencia a IBARRA
   └─ THALAMUS:
      ├─ Notifica IBARRA: "Recibidor: Paciente X llegará en 2hrs"
      ├─ Envía resumen clínico CIFRADO (no HCE completa)
      ├─ Crea transfer_order en THALAMUS
      ├─ Reserva cama en IBARRA
      ├─ Coordina transporte si es necesario
      └─ Log de auditoría

5. Paciente llega a IBARRA
   └─ IBARRA ve que está en PMI
   └─ Puedo ver resumen pero NOT full HCE unless authorized
   └─ Creo nueva "encounter" local but linked via PMI
   └─ Opción: importar medicamentos vigentes de QUITO
```

---

## 3. DATOS SINCRONIZADOS EN THALAMUS

### CATEGORÍA 1: DEMOGRÁFICOS (NO Encriptado - Agregado)
```
Tabla: thalamus_patients_demographics
  - patient_id (PMI)
  - age_group
  - gender
  - region_last_seen
  - num_hospitals_registered
  - last_encounter_date
```

### CATEGORÍA 2: CLÍNICO (Encriptado end-to-end)
```
Tabla: thalamus_encounters_mirror
  - encounter_id (hash)
  - patient_id_pmi
  - hospital_source
  - encounter_type (consultation, hospitalization, etc.)
  - date
  - primary_diagnosis (ICD-10)
  - problems_list (ICD-10 array)
  - treatment_summary (anónimo)

Tabla: thalamus_active_problems
  - problem_id
  - patient_id_pmi
  - icd10_code
  - hospitals_where_active (array)
  - date_first_recorded_network
  - status (active, resolved)

Tabla: thalamus_medications_active
  - medication_id
  - patient_id_pmi
  - medication_name
  - active_hospitals (array)
  - start_date_network
  - indication (ICD-10)
```

### CATEGORÍA 3: ADMINISTRATIVO (NO Encriptado - Necesario para coordinación)
```
Tabla: thalamus_capacity_realtime
  - hospital_id
  - total_beds_icu, occupied_icu, available_icu
  - total_beds_medical, occupied_medical, available_medical
  - total_beds_surgery, occupied_surgery, available_surgery
  - total_beds_pediatric, occupied_pediatric, available_pediatric
  - timestamp
  - updated_at

Tabla: thalamus_staff_availability
  - hospital_id
  - specialty (cardiologist, surgeon, etc.)
  - num_available
  - num_on_call
  - timestamp

Tabla: thalamus_supply_status
  - hospital_id
  - medication_name
  - stock_days
  - critical_shortage (bool)
  - last_resupply_date
```

### CATEGORÍA 4: EPIDEMIOLÓGICO (Agregado, NO individual)
```
Tabla: thalamus_disease_surveillance
  - disease_code (ICD-10 or custom)
  - week
  - hospital_id
  - num_cases
  - num_deaths
  - status (endemic, epidemic, outbreak)
  - source_hospital

Tabla: thalamus_contact_tracing
  - contact_tracing_id
  - disease
  - num_contacts_identified
  - num_contacts_followed
  - num_became_ill
  - hospital_network (array)
```

---

## 4. ARQUITECTURA TÉCNICA PARA ASIS 13 (HME) con THALAMUS

### 4.1 Base de Datos Local (cada hospital)

**ASIS 13 HME tiene estas tablas nuevas:**

```sql
-- TABLA PRINCIPAL: EHR local (HOSIX_QUITO)
electronic_health_record
  - id UUID PK
  - patient_id UUID FK
  - last_summary_updated TIMESTAMP
  - active_problems TEXT[] (JSON)
  - medications_active TEXT[] (JSON)
  - thalamus_synced_at TIMESTAMP <- NEW
  - thalamus_sync_status VARCHAR (pending, synced, error)
  - encryption_key_id UUID <- NEW (para replic encriptada)
  
-- TABLA NUEVA: Sync metadata
ehr_thalamus_sync_log
  - id UUID
  - ehr_id UUID FK
  - last_push_at TIMESTAMP
  - last_push_status VARCHAR (success, failed)
  - sync_hash VARCHAR (para detectar cambios)
  - retry_count INT
```

### 4.2 THALAMUS Central DB

```sql
-- TABLA: Réplica de HME (read-only)
thalamus_ehr_mirror
  - id UUID
  - thalamus_patient_id UUID (PMI reference)
  - hospital_source VARCHAR
  - local_ehr_id UUID
  - active_problems_encrypted TEXT
  - medications_active_encrypted TEXT
  - last_updated TIMESTAMP

-- TABLA: Patient Master Index
patient_master_index
  - id UUID PK
  - name VARCHAR ENCRYPTED
  - birthdate DATE ENCRYPTED
  - national_id VARCHAR ENCRYPTED
  - hospital_registrations JSONB (array of {hospital, local_id, date_registered})
  - consolidated_problems TEXT[] (aggregated ICD-10)
  - consolidated_medications TEXT[] (aggregated)
  - last_hospital VARCHAR
  - last_encounter_date TIMESTAMP
```

### 4.3 Edge Functions (New)

```
Función: sync_ehr_to_thalamus
  Input: ehr_id, hospital_source
  Process:
    1. Fetch EHR local
    2. Extract clinical summary (no full HCE)
    3. Encrypt sensitive fields
    4. UPSERT in thalamus_ehr_mirror
    5. Update patient_master_index
    6. Log sync
  Output: sync_result

Función: query_thalamus_for_patient
  Input: patient_id_local, hospital
  Process:
    1. Call THALAMUS API (JWT)
    2. Fetch PMI for this patient
    3. Return cross-hospital history (aggregated)
    4. Log access request (audit)
  Output: cross_hospital_summary

Función: coordinate_transfer
  Input: patient_id, from_hospital, to_hospital, reason
  Process:
    1. Call THALAMUS transfer_coordination
    2. Check capacity in to_hospital
    3. Reserve bed
    4. Generate transfer summary
    5. Create order locally
  Output: transfer_order_id
```

---

## 5. IMPACTO EN ASIS 13 IMPLEMENTACIÓN

El diseño de ASIS 13 debe incluir DESDE EL DÍA 1:

### SQL Migrations (Hito 1)
- ✅ Todas las tablas base (ya planificadas)
- **NEW** + `thalamus_synced_at`, `thalamus_sync_status`, `ehr_thalamus_sync_log`
- **NEW** + índices para sincronización rápida

### React Components (Hito 2)
- ✅ Dashboard base
- **NEW** + "Cross-Hospital History" tab (si acceso autorizado)
- **NEW** + "Transfer Coordination" button
- **NEW** + Sync status indicator

### Hooks (Hito 3)
- ✅ useElectronicHealthRecord
- **NEW** + useThalamusSync (manage sync state)
- **NEW** + useCrossHospitalHistory (fetch PMI data)

### Edge Functions (Hito 4)
- ✅ consolidate_ehr_summary
- **NEW** + sync_ehr_to_thalamus
- **NEW** + query_patient_in_thalamus

### Tests (Hito 5)
- ✅ All existing tests
- **NEW** + Tests for THALAMUS sync workflow
- **NEW** + Tests for PMI deduplication

---

## 6. TIMELINE INTEGRATION

### WEEK 8: ASIS 13 HME (8,500 líneas)
- Implementar con THALAMUS foundation integrada
- **No esperar a WEEK 15 para THALAMUS**
- THALAMUS es enabler de HME, no separado

### WEEK 11: ADMIN 1 (HR + Capacity)
- Integrar con thalamus_capacity_realtime
- Sincronizar staff_availability a THALAMUS
- **Capacity coordination** usa THALAMUS

### FUTURE: THALAMUS Full Implementation (WEEK 15+)
- Central orchestration layer
- Analytics dashboards
- Alert system
- Full federation portal

---

## 7. SECURITY MODEL FOR THALAMUS

```
LOCAL HOSPITAL (HOSIX_QUITO):
  ├─ All data at rest: encrypted with local key
  ├─ Sync to THALAMUS: encrypted with hospital-specific key
  └─ Only medical staff can sync

THALAMUS CENTRAL:
  ├─ All replicas: encrypted with THALAMUS master key + hospital key
  ├─ Access control: JWT + Role-based
  ├─ Audit: All access logged (who, what, when, why)
  ├─ Privacy: PII never in clear text
  └─ Network: TLS 1.3, certificate pinning

INTER-HOSPITAL TRANSFER:
  ├─ Patient data: sent encrypted with recipient hospital's public key
  ├─ Recipient: decrypts with their private key
  ├─ Transfer log: immutable audit trail
  └─ Patient consent: required flag
```

---

## 8. SUCCESS METRICS FOR THALAMUS v2.0

```
By End of WEEK 12:
  ✓ HME syncs to THALAMUS automatically
  ✓ Patients can be found via PMI in other hospitals
  ✓ Cross-hospital transfer coordination works
  ✓ Zero data loss in sync process
  ✓ <500ms latency for THALAMUS queries

By End of WEEK 16:
  ✓ THALAMUS Central fully operational
  ✓ Real-time dashboard shows network capacity
  ✓ Alert system operational (brotes, shortages)
  ✓ All 5 RENAPROSA hospitals syncing

By End of WEEK 20:
  ✓ Analytics queries available
  ✓ Epidemiological reports automated
  ✓ Integration with Ministry of Health API
  ✓ System certified by MINSA
```

---

## 9. IMPLEMENTATION ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEEK 8-20 ARCHITECTURE                          │
│                                                                         │
│  LOCAL HOSPITAL (HOSIX_QUITO)        THALAMUS CENTRAL                 │
│  ┌──────────────────────────┐        ┌────────────────────────────┐   │
│  │ Frontend React + TS      │        │ Analytics Layer            │   │
│  │  ├─ HME Dashboard        │        │  ├─ Real-time queries      │   │
│  │  ├─ Transfer Request     │        │  ├─ Aggregations          │   │
│  │  └─ Cross-hosp History   │        │  └─ Reporting             │   │
│  └────────────┬─────────────┘        └──────────┬─────────────────┘   │
│               │                                  │                     │
│  ┌────────────▼─────────────┐        ┌──────────▼─────────────────┐   │
│  │ Local Supabase DB        │        │ THALAMUS PostgreSQL        │   │
│  │  ├─ electronic_health_   │        │  ├─ patient_master_index  │   │
│  │  │  record               │        │  ├─ thalamus_ehr_mirror   │   │
│  │  ├─ ehr_episode_links    │────┐   │  ├─ thalamus_capacity_    │   │
│  │  ├─ ehr_sync_log         │    │   │  │  realtime              │   │
│  │  └─ All other ASIS       │    │   │  └─ thalamus_diseases     │   │
│  └────────────┬─────────────┘    │   └────────────┬─────────────┘    │
│               │                  │                │                   │
│  ┌────────────▼─────────────┐    │   ┌────────────▼─────────────┐    │
│  │ Edge Functions (Deno)    │    └──▶│ Sync Engine (Node.js)    │    │
│  │  ├─ sync_ehr_to_thalamus │───────▶│  ├─ Event listeners      │    │
│  │  ├─ query_cross_hosp     │        │  ├─ Encryption/decrypt  │    │
│  │  └─ coordinator_transfer │        │  ├─ PMI dedup           │    │
│  └──────────────────────────┘        │  └─ Alert triggers       │    │
│                                      └────────────┬─────────────┘    │
│                                                   │                   │
│                                       ┌───────────▼─────────────┐    │
│                                       │ API Gateway (REST+FHIR)│    │
│                                       │  ├─ JWT auth           │    │
│                                       │  ├─ Rate limiting      │    │
│                                       │  └─ Webhooks          │    │
│                                       └────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                            Inter-Hospital API
```

---

## PRÓXIMAS ACCIONES

✅ **WEEK 8 ASIS 13**: Implementar HME con THALAMUS foundation  
✅ **WEEK 11 ADMIN 1**: Agregar coordinación de capacidad via THALAMUS  
✅ **WEEK 15**: THALAMUS Central full implementation  

**Start: NOW - Hito 1 SQL (ASIS 13 + THALAMUS metadata)**
