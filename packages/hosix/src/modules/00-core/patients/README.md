# Module 00-core: Patient Management

## 📖 Description

Patient demographics, search, and core patient information management. Foundational for all clinical modules.

Based on GNU Health `res_partner` (patient registry).

## 🎯 Objectives

- [x] Patient search and lookup
- [x] Demographic data management
- [ ] Insurance information
- [ ] Contact tracing
- [ ] Family relationships

## 🗂️ Structure

```
patients/
├── components/
│   ├── PatientSearchForm.tsx
│   ├── PatientProfileView.tsx
│   ├── PatientDemographicsForm.tsx
│   ├── MedicalHistoryCard.tsx
│   ├── PatientListTable.tsx
│   └── PatientDetailsTabs.tsx
├── hooks/
│   └── usePatient.ts
├── types/
│   └── patient.types.ts
├── services/
│   └── patientService.ts
├── index.ts
└── README.md
```

## 🔗 Dependencies

- Module 00-core/auth (auth required)
