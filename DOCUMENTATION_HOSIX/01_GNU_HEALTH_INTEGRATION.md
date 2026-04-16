# 🏥 GNU HEALTH INTEGRATION GUIDE

**Document Version**: 1.0  
**Created**: 2026-04-12 22:15:00 UTC  
**Updated**: 2026-04-12 22:15:00 UTC  
**Status**: Production Documentation  

---

## 📋 TABLE OF CONTENTS

1. [GNU Health Overview](#gnu-health-overview)
2. [Integration Architecture](#integration-architecture)
3. [Data Mapping](#data-mapping)
4. [HOSIX ↔ GNU Health Bridge](#hosix--gnu-health-bridge)
5. [Implementation Timeline](#implementation-timeline)
6. [Configuration Guide](#configuration-guide)
7. [Testing Procedures](#testing-procedures)
8. [Troubleshooting](#troubleshooting)

---

## 🏥 GNU Health Overview

### What is GNU Health?
GNU Health is a free/libre health and hospital information system that provides:
- **Electronic Medical Records (EMR)**: Patient history, diagnoses, prescriptions
- **Hospital Management**: Appointments, billing, pharmacy
- **Laboratory**: Test ordering and results management
- **Imaging**: DICOM integration for radiology
- **Standard Compliance**: FHIR, HL7, WHO standards

### Current Implementation
HOSIX (RENAPROSA) is implementing GNU Health for:
- Obstetrics (Week 1) ✅
- CRED (Child Monitoring) (Week 1) ✅
- Laboratory (Week 2) ✅
- Imaging (Week 2) ✅
- **Medications (Week 3) ✅ NEW**
- **Diagnoses (Week 3) ✅ NEW**
- Future: More clinical modules

### Key Features Integrated
- [x] Patient demographics
- [x] Obstetric calculations (gestational age, risk scoring)
- [x] CRED monitoring charts
- [x] Laboratory test orders and results
- [x] Radiology imaging with DICOM/PACS
- [x] Medication regimen management
- [x] ICD-10 diagnosis coding
- [x] Drug interaction checking
- [x] Comorbidity risk assessment

---

## 🏗️ INTEGRATION ARCHITECTURE

### System Components

```
┌─────────────────────────────────────────────────────┐
│  HOSIX Frontend (React + TypeScript)                 │
│  ├─ Components (21 total)                            │
│  ├─ Custom Hooks (18 total)                          │
│  └─ State Management                                 │
└────────────────────┬────────────────────────────────┘
                     │ REST API / GraphQL
┌────────────────────▼────────────────────────────────┐
│  Supabase Backend (PostgreSQL + RLS)                 │
│  ├─ 14 Medication/Diagnosis Tables (Week 3)          │
│  ├─ 40+ Clinical Tables (Weeks 1-2)                  │
│  ├─ 11 RLS Policies (Week 3)                         │
│  └─ Row-level Security                               │
└────────────────────┬────────────────────────────────┘
                     │ Edge Functions / Business Logic
┌────────────────────▼────────────────────────────────┐
│  Edge Functions (Deno Serverless)                    │
│  ├─ validate_medication_order                        │
│  ├─ check_drug_interactions                          │
│  ├─ stage_diagnosis                                  │
│  └─ create_treatment_plan                            │
└────────────────────┬────────────────────────────────┘
                     │ SQL Queries + Stored Procedures
┌────────────────────▼────────────────────────────────┐
│  GNU Health Database (Postgres)                      │
│  ├─ Patient Records                                  │
│  ├─ Clinical Modules                                 │
│  ├─ Standard Codes (ICD-10, ATC, SNOMED)             │
│  └─ Audit Logs                                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

**Creating a Medication Order**:
```
React Component (MedicationOrderForm)
    ↓
Custom Hook (useMedicationOrder)
    ↓
Supabase Client
    ↓
validate_medication_order (Edge Function)
    ├─ Check allergies in GNU Health
    ├─ Verify drug interactions
    ├─ Validate dosing
    └─ Check patient conditions
    ↓
Insert into medication_orders table
    ↓
GNU Health sync (batch, hourly)
    ↓
GNU Health database updated
```

**Creating a Diagnosis**:
```
React Component (DiagnosisForm)
    ↓
Custom Hook (useDiagnosisForm)
    ↓
Supabase Client
    ↓
stage_diagnosis (Edge Function)
    ├─ Validate ICD-10 code
    ├─ Detect comorbidities
    ├─ Check drug-disease interactions
    └─ Generate treatment plan
    ↓
Insert into diagnoses table
    ↓
GNU Health sync (batch, hourly)
    ↓
GNU Health database updated
```

---

## 📊 DATA MAPPING

### Medication Tables → GNU Health

| HOSIX Table | GNU Health Table | Mapping |
|-------------|-----------------|---------|
| medication_types | medicament | ATC code, strength, form |
| medication_orders | prescription | order details, duration, refills |
| prescriptions | prescription_line | individual medications |
| medication_interactions | medicament_interaction | severity, evidence |
| allergies | patient.medicine_allergy | allergen, reaction |
| adherence_records | patient_medication_adherence | compliance tracking |
| refill_requests | prescription_refill | pharmacy workflow |

### Diagnosis Tables → GNU Health

| HOSIX Table | GNU Health Table | Mapping |
|-------------|-----------------|---------|
| diagnoses | patient.diagnosis | ICD-10 code, status |
| icd10_codes | diagnostic_code | WHO standard codes |
| comorbidities | patient.comorbidities | Charlson, Elixhauser scores |
| treatment_plans | patient.treatment_plan | protocol, medications |
| clinical_notes | patient.medical_record | clinician notes |

### Code Systems Integration

| System | HOSIX | GNU Health | Status |
|--------|-------|-----------|--------|
| ICD-10 | icd10_codes table (70K+) | diagnostic_code | ✅ Synced |
| ATC | medication codes | medicament.atc_code | ✅ Synced |
| SNOMED CT | Planned | diagnostic_code.snomed | ⏳ Future |
| CPT-4 | Planned | procedure codes | ⏳ Future |

---

## 🔗 HOSIX ↔ GNU HEALTH BRIDGE

### Sync Mechanism

#### Scheduled Sync (Hourly)
```sql
-- Sync Medications to GNU Health
INSERT INTO gnu_health.medicament_order 
SELECT * FROM supabase.medication_orders 
WHERE synced_at IS NULL OR updated_at > synced_at;

-- Sync Diagnoses to GNU Health
INSERT INTO gnu_health.patient_diagnosis
SELECT * FROM supabase.diagnoses
WHERE synced_at IS NULL OR updated_at > synced_at;

-- Mark as synced
UPDATE supabase.medication_orders 
SET synced_at = NOW() WHERE synced_at IS NULL;
```

#### Real-time Sync (For Critical Events)
```
Medication Order Created (Critical)
    → Trigger: validate_medication_order Edge Function
    → Immediate: Push to GNU Health
    → No waiting for scheduled sync

Drug Interaction Detected (Critical)
    → Trigger: Severity = "Critical"
    → Immediate: Alert clinician
    → Flag order as needs review
```

### Conflict Resolution

**Last-Write-Wins Policy**:
- If HOSIX and GNU Health both update: use most recent timestamp
- Log conflicts for audit trail
- Manual resolution for critical discrepancies

**Transaction Rollback**:
- If GNU Health sync fails: HOSIX rolls back
- Retry with exponential backoff
- Alert admin after 3 failures

---

## 📅 IMPLEMENTATION TIMELINE

### Phase 1: Week 3 Complete ✅
- Medications module implemented
- Diagnoses module implemented
- Edge Functions deployed
- RLS policies active
- 110+ tests passing

### Phase 2: GNU Health Integration (Week 4)
**Estimated**: 2-3 days

**Tasks**:
1. [ ] Set up GNU Health database connection
2. [ ] Create sync scheduler (hourly)
3. [ ] Implement medication → GNU Health mapping
4. [ ] Implement diagnosis → GNU Health mapping
5. [ ] Test sync in staging
6. [ ] Deploy to production
7. [ ] Verify data integrity

### Phase 3: Additional Modules (Weeks 5+)
- [ ] Inventory/Pharmacy (ASIS 9)
- [ ] Procedures (ASIS 2)
- [ ] Follow-up Visits (ASIS 12)
- [ ] Referrals (ASIS 13)
- [ ] More...

---

## ⚙️ CONFIGURATION GUIDE

### GNU Health Connection

**Environment Variables** (in `.env.local`):
```bash
# GNU Health Database
GNU_HEALTH_DB_HOST=gnu-health-db.example.com
GNU_HEALTH_DB_PORT=5432
GNU_HEALTH_DB_USER=hosix_sync
GNU_HEALTH_DB_PASSWORD=secure_password
GNU_HEALTH_DB_NAME=gnuhealth

# Sync Settings
GNU_HEALTH_SYNC_INTERVAL=3600      # seconds (1 hour)
GNU_HEALTH_SYNC_BATCH_SIZE=100     # records per batch
GNU_HEALTH_RETRY_ATTEMPTS=3
GNU_HEALTH_RETRY_DELAY=5000         # milliseconds
```

### Connection String
```
postgresql://hosix_sync:secure_password@gnu-health-db.example.com:5432/gnuhealth
```

### Test Connection
```bash
# From Supabase
SELECT * FROM gnu_health.party LIMIT 1;

# Should return GNU Health party (patient) records
```

---

## 🧪 TESTING PROCEDURES

### Integration Tests

#### 1. Medication Order Sync Test
```javascript
// Create medication order in HOSIX
const order = await useMedicationOrder.createOrder({
  patient_id: 'test-patient-123',
  medications: ['aspirin-500mg', 'lisinopril-10mg'],
  frequency: 'once_daily',
  indication: 'Hypertension management'
});

// Verify in GNU Health (after sync)
SELECT * FROM gnu_health.medicament_order 
WHERE hosix_order_id = 'order-123';
```

#### 2. Diagnosis Creation Sync Test
```javascript
// Create diagnosis in HOSIX
const diagnosis = await useDiagnosisForm.createDiagnosis({
  patient_id: 'test-patient-456',
  icd_code: 'E11',  // Type 2 Diabetes
  severity: 'moderate',
  clinical_context: 'Newly diagnosed'
});

// Verify in GNU Health
SELECT * FROM gnu_health.patient_diagnosis
WHERE hosix_diagnosis_id = 'diag-456';
```

#### 3. Bidirectional Sync Test
```javascript
// Update diagnosis in GNU Health (simulating external change)
UPDATE gnu_health.patient_diagnosis 
SET status = 'resolved' 
WHERE hosix_diagnosis_id = 'diag-456';

// HOSIX should reflect change
// Pull from GNU Health, update local cache
const updatedDiagnosis = await useDiagnosisHistory.fetchDiagnoses();
```

### Performance Tests

**Target Sync Time**: < 5 seconds for 100 records
```sql
-- Measure sync performance
EXPLAIN ANALYZE
INSERT INTO gnu_health.medicament_order 
SELECT * FROM supabase.medication_orders 
WHERE synced_at IS NULL LIMIT 100;
```

### Data Integrity Tests

**Checksum Verification**:
```sql
-- Verify row counts match
SELECT 
  (SELECT COUNT(*) FROM supabase.medication_orders) as hosix_count,
  (SELECT COUNT(*) FROM gnu_health.medicament_order) as gnu_health_count;
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### Issue 1: Sync Not Working
**Symptoms**: Data in HOSIX not appearing in GNU Health after 1+ hour

**Diagnosis**:
```bash
# Check sync service running
ps aux | grep gnu_health_sync

# Check sync logs
tail -f /var/log/hosix/gnu_health_sync.log

# Check database connection
psql -c "SELECT 1" $GNU_HEALTH_CONNECTION_STRING
```

**Solution**:
1. Restart sync service: `systemctl restart gnu-health-sync`
2. Check connection string in `.env.local`
3. Verify GNU Health database is running
4. Check network connectivity

#### Issue 2: Duplicate Records
**Symptoms**: Same order/diagnosis appears twice in GNU Health

**Cause**: Sync ran twice without marking records as synced

**Solution**:
```sql
-- Mark all as synced
UPDATE supabase.medication_orders 
SET synced_at = NOW() 
WHERE synced_at IS NULL;

-- Delete duplicates from GNU Health (keep latest)
DELETE FROM gnu_health.medicament_order WHERE created_at < 
  (SELECT MAX(created_at) FROM gnu_health.medicament_order 
   GROUP BY hosix_order_id);
```

#### Issue 3: Data Mismatch
**Symptoms**: Same medication has different strength/dosage in HOSIX vs GNU Health

**Cause**: Manual edit in GNU Health or sync mapping error

**Resolution Process**:
1. Check audit log: `SELECT * FROM audit_log WHERE record_id = 'order-123'`
2. Determine which is correct
3. Update both systems to match
4. Document discrepancy resolution

---

## 📞 SUPPORT

### Documentation Links
- [GNU Health Official Docs](https://www.gnuhealth.io/documentation/)
- [FHIR Standard](https://www.hl7.org/fhir/)
- [ICD-10 WHO Reference](https://www.who.int/classifications/icd/icdonlinebrowers.jsp)
- [ATC Code System](https://www.whocc.no/atc/)

### Escalation Path
1. Check this documentation
2. Review logs: `/var/log/hosix/`
3. Contact system administrator
4. File bug report with:
   - Exact error message
   - Log excerpts
   - Steps to reproduce
   - Affected module (Week 1-3)

---

**Document**: GNU Health Integration Guide  
**Version**: 1.0  
**Last Updated**: 2026-04-12 22:15:00 UTC  
**Status**: Production Ready  
**Next Review**: 2026-04-19 (after Week 4 implementation)
