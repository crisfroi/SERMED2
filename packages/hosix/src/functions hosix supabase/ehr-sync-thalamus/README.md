# EHR Sync THALAMUS

Sincroniza registros de Electronic Health Record con THALAMUS (GNU Health)

## Endpoint

```
POST /functions/v1/ehr-sync-thalamus
```

## Request

```json
{
  "ehr_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "push",
  "thalamus_patient_id": "PAT-12345"
}
```

## Response

```json
{
  "success": true,
  "ehr_id": "550e8400-e29b-41d4-a716-446655440000",
  "synced_at": "2026-04-15T10:30:00Z",
  "status": "synced",
  "message": "EHR push sync completed successfully"
}
```

## Error Response

```json
{
  "success": false,
  "message": "EHR not found",
  "status": "failed",
  "synced_at": "2026-04-15T10:30:00Z"
}
```

## Implementation Notes

- `action='push'`: Envía datos locales a THALAMUS
- `action='pull'`: Obtiene datos desde THALAMUS
- Actualiza `thalamus_synced_at` y `thalamus_sync_status`
- En caso de error, registra en `thalamus_last_error`
