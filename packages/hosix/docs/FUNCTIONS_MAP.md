# FUNCTIONS MAP

## Funciones Edge HOSIX por Categoría

### Hospitalization (health_inpatient)

Ubicación: `packages/hosix/src/functions/hospitalization/`

| Función | Descripción | Input | Output | Crítica |
|---------|-------------|-------|--------|---------|
| createKardex | Crear kardex (registro de evolución) | { hospitalization_id, visit_date, diagnosis, treatment } | { kardex } | ✅ SÍ |
| updateKardexEvolution | Actualizar evolución de kardex | { kardex_id, data } | { updated_kardex } | ✅ SÍ |
| moveBed | Mover paciente a otra cama | { hospitalization_id, bed_id } | { success } | ✅ SÍ |
| requestSurgery | Solicitar procedimiento quirúrgico | { patient_id, procedure } | { surgery_id } | ✅ SÍ |
| requestInterconsultation | Solicitar especialista | { patient_id, specialty } | { interconsultation_id } | ✅ SÍ |

### Referral

Ubicación: `packages/hosix/src/functions/referral/`

| Función | Descripción | Input | Output | Crítica |
|---------|-------------|-------|--------|---------|
| validateReferral | Validar referencia antes de enviar | { referral_id } | { valid, errors[] } | MEDIA |
| createReferral | Crear nueva referencia de paciente | { patient_id, facility_id } | { referral_id } | MEDIA |
| checkReferralStatus | Verificar estado de referencia | { referral_id } | { status, data } | BAJA |

### Shared

Ubicación: `packages/hosix/src/functions/shared/`

| Función | Descripción | Input | Output |
|---------|-------------|-------|--------|
| aiAssist | AI assistant para diagnósticos | { query, context } | { suggestions[] } |

## Deployment

### Desde packages/hosix/src/functions/

```bash
# Ubicación fuente
packages/hosix/src/functions/
  ├── hospitalization/
  ├── referral/
  └── shared/

# Desplegado en Supabase como
supabase/functions/
  ├── hospitalizacion_crear_kardex/
  ├── hospitalizacion_evolucionar/
  ├── referral_validation/
  └── ... (etc)
```

## Estado de Implementación

- ✅ Estructura definida
- ⏳ Código a implementar (placeholders creados)
- ✅ Documentación completada

## Notas

- Todas las funciones usan Deno + TypeScript
- Integración con Supabase RLS
- Autenticación via JWT en Authorization header
- Response estándar: `{ success: boolean, data, error? }`
