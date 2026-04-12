# Módulo laboratorio: herencia GNU Health → HOSIX

## Lógica GNU Health heredada

- **Tryton:** `health_lab`, `health_services_lab` (prestaciones).
- **Tablas de referencia en dump:** `gnuhealth_lab`, `gnuhealth_lab_test_type`, `gnuhealth_lab_test_critearea` (rangos por tipo de prueba / sexo / edad), `gnuhealth_patient_lab_test`, `gnuhealth_lab_test_units`.

HOSIX ya modelaba solicitudes, muestras, resultados e interpretación. Esta entrega añade **`hosix_laboratorio_criterios_referencia`** como equivalente **simplificado** de `gnuhealth_lab_test_critearea` (rangos múltiples por prueba con `sexo` y franja etaria en meses).

## Tablas Supabase afectadas

| Tabla | Rol |
|-------|-----|
| `hosix_laboratorio_pruebas_catalogo` | Catálogo de pruebas |
| `hosix_laboratorio_solicitudes` | Cabecera de pedido |
| `hosix_laboratorio_solicitud_detalles` | Líneas de prueba |
| `hosix_laboratorio_muestras` | Toma de muestra |
| `hosix_laboratorio_resultados` | Valores cuantitativos/cualitativos |
| `hosix_laboratorio_interpretacion` | Informe médico |
| `hosix_laboratorio_criterios_referencia` | **Nuevo:** criterios de referencia por prueba |

Migración canónica: `supabase/migrations/20260412120000_hosix_laboratorio_canonical.sql` (antes solo en `supabase/code/supabase/migrations/`).

**Producción / remoto:** la tabla `hosix_laboratorio_criterios_referencia` puede haberse aplicado ya con el nombre de migración MCP `hosix_laboratorio_canonical_and_criterios` (versión `20260412085258`). El resto del módulo en remoto suele venir de `20250206_015_hosix_laboratorio_asis_8`.

## Uso para programadores

1. **Catálogo + criterios:** cargar pruebas desde `hosix_laboratorio_pruebas_catalogo`; para validar un resultado numérico contra rango dinámico, consultar filas en `hosix_laboratorio_criterios_referencia` filtrando por `prueba_id`, `sexo` del paciente (`M`/`F`/`I` o NULL = cualquiera) y edad en meses entre `edad_min_meses` y `edad_max_meses` (NULL en un extremo = abierto).
2. **JWT:** las políticas RLS actuales esperan `auth.jwt() ->> 'user_role'` (`medico`, `enfermeria`, `laboratorista`, `admin`). Alinear con el sistema real de roles del proyecto si difiere.
3. **Hooks React:** seguir usando `useHosixLaboratorio`; las nuevas lecturas/escrituras de criterios pueden añadirse como métodos en el mismo hook o RPC dedicada en una siguiente iteración.

## RLS

- Catálogo y criterios: lectura amplia del catálogo; **escritura de criterios** restringida a `admin` en esta primera versión (ajustar si el laboratorio configura rangos en producción).
