# GAP ANALYSIS: Hooks vs Migraciones

**Fecha**: 15 Abril 2026  
**Scope**: ASIS_13 Electronic Health Record

## 🔍 TABLA: electronic_health_record

| Referencias en Código | Hooks Necesarios | Status |
|----------------------|------------------|--------|
| Components: ElectronicHealthRecordDashboard, EHRTimeline | `useEHR()`, `useEHRHistory()` | ❌ FALTANTES |
| THALAMUS Integration (GNU Health) | `useThalamusSync()` | ⚠️ EXISTE pero necesita adaptación |

## 🔍 TABLA: ehr_episode_links

| Referencias en Código | Hooks Necesarios | Status |
|----------------------|------------------|--------|
| Components: ASIS_13 (hospitalization, consult, procedure) | `useEHREpisodes()` | ❌ FALTANTE |
| Filters by episode_type | incluido en `useEHREpisodes()` | ❌ FALTANTE |

## 🔍 TABLA: ehr_document_storage

| Referencias en Código | Hooks Necesarios | Status |
|----------------------|------------------|--------|
| Document upload/view/search | `useEHRDocuments()`, `useEHRDocumentUpload()` | ❌ FALTANTES |
| Digital signatures | `useEHRDocumentSign()` | ❌ FALTANTE |
| Full-text search | `useEHRDocumentSearch()` | ❌ FALTANTE |

---

## 📋 Hooks Críticos a Crear

### 1. `useEHR()` - Lectura de Historia Médica
```typescript
// Path: src/hooks/useEHR.ts
const { ehr, loading, error } = useEHR(patientId);
// Retorna: { ehr, loading, error }
// Queries: electronic_health_record WHERE patient_id = ?
```

### 2. `useEHREpisodes()` - Episodios Clínicos
```typescript
// Path: src/hooks/useEHREpisodes.ts
const { episodes, loading } = useEHREpisodes(ehrId, { episodeType?: string });
// Retorna: { episodes: [], loading }
// Queries: ehr_episode_links WHERE ehr_id = ?
```

### 3. `useEHRDocuments()` - Documentos Médicos
```typescript
// Path: src/hooks/useEHRDocuments.ts
const { documents, loading } = useEHRDocuments(ehrId);
// Retorna: { documents: [], loading }
// Queries: ehr_document_storage WHERE ehr_id = ?
```

### 4. `useEHRDocumentUpload()` - Subir Documentos
```typescript
// Path: src/hooks/useEHRDocumentUpload.ts
const { upload, uploading, error } = useEHRDocumentUpload(ehrId);
// Interactúa con: Edge Function + Storage
// Retorna: { upload(file, type) => Promise, uploading, error }
```

### 5. `useEHRDocumentSearch()` - Búsqueda FTS
```typescript
// Path: src/hooks/useEHRDocumentSearch.ts
const { results, loading } = useEHRDocumentSearch(query);
// Retorna: { results: [], loading }
// Queries: ehr_document_storage FTS search
```

---

## ⚙️ Edge Functions Críticas a Crear

1. `/functions/v1/ehr-sync-thalamus` - Sincronizar con GNU Health
2. `/functions/v1/ehr-upload-document` - Guardar documento + metadata
3. `/functions/v1/ehr-search-documents` - Search FTS
4. `/functions/v1/ehr-sign-document` - Digital signature

---

## 🎯 Impacto

**Sin estos hooks + edge functions**: ASIS_13 components no pueden funcionar (queries = undefined)

**Priority**: 🔴 CRÍTICA - Bloquea deployment de ASIS_13

---

## 📊 Estado Actual

| Item | Migración | Hooks | Edge Functions |
|------|-----------|-------|-----------------|
| electronic_health_record | ✅ HECHA | ❌ FALTA | ❌ FALTA |
| ehr_episode_links | ✅ HECHA | ❌ FALTA | ❌ FALTA |
| ehr_document_storage | ✅ HECHA | ❌ FALTA | ❌ FALTA |

**Próximo Paso**: Generar hooks + edge functions en paralelo
