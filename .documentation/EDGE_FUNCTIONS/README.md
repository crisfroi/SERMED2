# Edge Functions & API Layer

**Status**: ⏳ PLANNING

## 🚀 Edge Functions Requeridas para ASIS_13

### 1. Sync THALAMUS (GNU Health)
- **Ruta**: `/functions/v1/ehr-sync-thalamus`
- **Método**: POST
- **Propósito**: Sincronizar electronic_health_record con THALAMUS
- **Body**: `{ ehr_id: UUID, action: 'push'|'pull' }`
- **Respuesta**: `{ synced_at: timestamp, status: 'synced'|'failed' }`

### 2. Upload EHR Document
- **Ruta**: `/functions/v1/ehr-upload-document`
- **Método**: POST (multipart)
- **Propósito**: Guardar documento médico en Storage + metadata en DB
- **Body**:
  ```json
  {
    "ehr_id": "UUID",
    "document_type": "lab_result|prescription|...",
    "file": "binary",
    "signed_by": "UUID (optional)"
  }
  ```

### 3. Generate EHR Report
- **Ruta**: `/functions/v1/ehr-generate-report`
- **Método**: GET
- **Propósito**: Generar PDF con history resumida
- **Query**: `?ehr_id=UUID&format=pdf|json`

### 4. Search EHR Documents
- **Ruta**: `/functions/v1/ehr-search-documents`
- **Método**: GET
- **Propósito**: Full-text search en documentos
- **Query**: `?q=term&hospital_id=UUID`

## 📦 Stack

- **Runtime**: Deno (Supabase)
- **Auth**: Service Role (si es necesario), JWT (si es user)
- **Storage**: Supabase Storage (documentos)
- **DB**: Supabase PostgreSQL

## 🔄 Secuencia de Desarrollo

1. Crear scaffolding en `supabase/functions/`
2. Implementar lógica para cada función
3. Testing local con `supabase functions serve`
4. Deploying con `supabase functions deploy`
5. Integrar en React hooks

## 📤 Outputs

Cada edge function debe retornar:
```json
{
  "success": boolean,
  "data": {...},
  "error": "mensaje si success=false"
}
```
