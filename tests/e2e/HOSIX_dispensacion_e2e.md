# E2E Test: Prescripción → Dispensación → Stock → Caja

Objetivo: Verificar que el flujo completo funcione en staging después de aplicar la función `dispensar_prescripcion`.

Pre-requisitos
- Base de datos de staging con migración aplicada (function + tablas).
- Usuario de prueba y token válido (si aplica).

Paso 1 — Preparar datos de prueba
1. Crear paciente de prueba (o usar paciente existente). Nota: ajustar UUIDs según tu entorno.

SQL de ejemplo:
```sql
INSERT INTO hosix_pacientes(id, nombre, created_at) VALUES ('00000000-0000-0000-0000-000000000001','E2E Test', now());
```

2. Crear medicamento y stock inicial:

```sql
INSERT INTO hosix_articulos(id, nombre) VALUES ('00000000-0000-0000-0000-000000000010','Med Test');
INSERT INTO hosix_stock_medicamentos(medicamento_id, cantidad, updated_at) VALUES ('00000000-0000-0000-0000-000000000010', 10, now());
```

3. Crear prescripción de prueba:

```sql
INSERT INTO hosix_cpoe_prescripciones(id, paciente_id, medico_id, medicamento_id, nombre_medicamento, dosis, via_administracion, frecuencia, fecha_inicio, estado, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000200','00000000-0000-0000-0000-000000000010','Med Test','1','oral','1 dia', now(), 'activa', now()
);
```

Paso 2 — Llamada RPC (simular desde frontend o psql)

Ejemplo con psql (usando supabase service role connection):

```sql
SELECT * FROM public.dispensar_prescripcion(
  '00000000-0000-0000-0000-000000000100', -- prescripcion id
  'E2E-0001', -- numero
  '00000000-0000-0000-0000-000000000010'::uuid, -- medicamento id
  'Med Test', -- texto
  1, -- cantidad
  NULL, NULL, NULL, -- unidad/lote/fecha
  '00000000-0000-0000-0000-000000000300'::uuid, -- dispensador
  5.00, -- cantidad_a_facturar
  NULL, -- caja_id
  NULL, -- forma_pago
  '00000000-0000-0000-0000-000000000300'::uuid -- registrado_por
);
```

Paso 3 — Verificar resultados

- Comprobar `hosix_dispensaciones` contiene el registro creado:

```sql
SELECT * FROM hosix_dispensaciones WHERE prescripcion_id = '00000000-0000-0000-0000-000000000100';
```

- Comprobar `hosix_stock_movimientos` contiene movimiento de salida:

```sql
SELECT * FROM hosix_stock_movimientos WHERE referencia_documento = (SELECT id FROM hosix_dispensaciones WHERE prescripcion_id = '00000000-0000-0000-0000-000000000100' LIMIT 1);
```

- Comprobar `hosix_stock_medicamentos` cantidad reducida:

```sql
SELECT cantidad FROM hosix_stock_medicamentos WHERE medicamento_id = '00000000-0000-0000-0000-000000000010';
```

- Comprobar `hosix_cajas_movimientos` contiene cobro si se solicitó:

```sql
SELECT * FROM hosix_cajas_movimientos WHERE referencia_pago = 'E2E-0001';
```

Paso 4 — Limpiar datos de prueba

```sql
DELETE FROM hosix_cajas_movimientos WHERE referencia_pago = 'E2E-0001';
DELETE FROM hosix_stock_movimientos WHERE referencia_documento = (SELECT id FROM hosix_dispensaciones WHERE prescripcion_id = '00000000-0000-0000-0000-000000000100');
DELETE FROM hosix_dispensaciones WHERE prescripcion_id = '00000000-0000-0000-0000-000000000100';
DELETE FROM hosix_cpoe_prescripciones WHERE id = '00000000-0000-0000-0000-000000000100';
DELETE FROM hosix_stock_medicamentos WHERE medicamento_id = '00000000-0000-0000-0000-000000000010';
DELETE FROM hosix_articulos WHERE id = '00000000-0000-0000-0000-000000000010';
DELETE FROM hosix_pacientes WHERE id = '00000000-0000-0000-0000-000000000001';
```

Observaciones
- Ejecutar en staging con backups y ojo a RLS.
