# Runbook: Despliegue y verificación de `dispensar_prescripcion`

Propósito: pasos rápidos para desplegar la función RPC, verificar permisos y validar en staging antes de producción.

1) Pre-requisitos
- Acceso al proyecto Supabase (owner / service role)
- Backup reciente de la base de datos (snapshot)
- Migración SQL lista en `supabase/migrations/20251209_002_create_dispensar_prescripcion_function.sql`

2) Despliegue en staging (pasos)

- Subir/aplicar migración en staging (desde Supabase Studio - SQL Editor):
  - Pegar el contenido de `supabase/migrations/20251209_002_create_dispensar_prescripcion_function.sql` y ejecutar.

- Ejecutar script de permisos:
  - Pegar y ejecutar el contenido de `supabase/sql/permissions_dispensar_prescripcion.sql`.

- Realizar E2E básico:
  - Seguir `tests/e2e/HOSIX_dispensacion_e2e.md`.

3) Verificaciones post-despliegue
- El SELECT del E2E debe devolver `dispensacion_id` y las tablas relacionadas deben mostrar los registros.
- Revisar `hosix_auditoria` para entradas de la función.

4) Rollback (si hay errores críticos)
- Ejecutar:

```sql
DROP FUNCTION IF EXISTS public.dispensar_prescripcion(text, text, uuid, text, numeric, text, text, timestamptz, uuid, numeric, uuid, text, uuid);
```

- Limpiar datos de prueba según `tests/e2e/HOSIX_dispensacion_e2e.md` y restaurar snapshot si es necesario.

5) Notas operativas
- No dar INSERT/UPDATE directo a `hosix_stock_medicamentos` ni `hosix_cajas_movimientos` al rol público.
- Monitorizar errores en logs y en auditoría durante las primeras 24h post-despliegue.
