# Plan de Arquitectura HOSIX — Resumen y Tareas

Objetivo: definir y documentar la arquitectura robusta para los flujos críticos de HOSIX (Farmacia ⇄ Caja ⇄ Médico, Quirófanos, Interconsultas), asegurando consistencia transaccional, seguridad (RLS/funciones) y un plan de despliegue seguro.

Resumen de decisiones principales
- Operaciones críticas (ej. dispensaciones) deben ejecutarse mediante funciones almacenadas (RPC) en la BD con transacciones atómicas.
- Las funciones críticas deben publicarse con `SECURITY DEFINER` y propietario con permisos controlados; exponer sólo `EXECUTE` al rol necesario (ej. `anon` o un role intermedio) para respetar RLS.
- Frontend: usar hooks especializados que llamen sólo a RPC en producción; mantener fallback solo en entorno de desarrollo mientras no esté desplegada la RPC.
- Validación: añadir E2E automatizados que cubran prescripción → dispensación → movimiento de caja → actualización de stock.

Secciones y pasos (detallado)

1) Documento maestro (este archivo)
- Entregar: contrato RPC, diagramas de flujo, lista de tablas afectadas, RLS y permisos, checklist de pruebas y pasos de rollback.

2) Definir contrato RPC `dispensar_prescripcion`
- Parámetros (propuesto):
  - `p_prescripcion_id text` — identificador externo de la prescripción
  - `p_prescripcion_numero text` — número visible en recibos
  - `p_medicamento_id uuid|null` — referencia al catálogo
  - `p_medicamento_texto text|null` — texto alternativo si no hay id
  - `p_cantidad_dispensada numeric` — cantidad
  - `p_unidad text|null`
  - `p_lote text|null`
  - `p_fecha_caducidad timestamp|null`
  - `p_dispensador_id uuid|null` — usuario que dispensa
  - `p_cantidad_a_facturar numeric|null` — monto a cobrar
  - `p_caja_id uuid|null` — caja destino
  - `p_forma_pago text|null` — etiqueta de forma de pago
  - `p_registrado_por uuid|null` — actor que registra
- Resultado: `RETURNS TABLE(dispensacion_id uuid)` o `RETURNS json` con status y ids creados.
- Comportamiento: en una transacción única, insertar `hosix_dispensaciones`, bloquear y actualizar `hosix_stock_medicamentos` (crear movimiento), insertar `hosix_cajas_movimientos` si aplica; registrar logs en `hosix_auditoria` opcional.

3) RLS y permisos
- Recomendación: función creada por rol admin y marcada `SECURITY DEFINER`.
- Conceder `EXECUTE` a rol mínimo que usa frontend (ej. `anon`/`service_role`) y NO conceder privilegios directos de insert/update a ese rol en las tablas sensibles.
- Verificar que la función owner tenga permisos sobre las tablas y revisar cualquier política RLS que dependa de `auth.uid()` — en funciones `SECURITY DEFINER` usar `current_setting('myapp.request_user', true)` si necesitas propagar actor real.

4) Frontend — integración y contratos
- Hooks:
  - `useDispensaciones.createDispensacion(payload)` debe llamar `supabase.rpc('dispensar_prescripcion', payload)` y gestionar códigos de error del RPC.
  - `useHosixStock` expone lectura de stock y movimientos, pero las escrituras de stock para dispensación deben centralizarse en la RPC.
- UX: mostrar estado de proceso (loading), manejar errores transaccionales con mensajes claros (ej. "No hay stock suficiente" o "Error de cobro, contactar caja").

5) Pruebas
- Unit: mocks para hooks y helpers.
- Integration: pruebas para el RPC en un entorno de staging con una base de datos temporal.
- E2E: script que realiza flujo: crear prescripción de prueba → llamar RPC → comprobar filas en `hosix_dispensaciones`, `hosix_stock_movimientos`, `hosix_cajas_movimientos`.

6) Despliegue / Rollout
- Flujo: aplicar migración en staging → ejecutar test E2E automatizados → desplegar a producción durante ventana con backup reciente.
- Rollback: mantener script SQL que deshace la función (DROP FUNCTION) y snapshot DB previo.

7) Observabilidad y auditoría
- Añadir registros en `hosix_auditoria` para cada RPC con: actor, payload, resultado, timestamp, request_id.
- Integrar alertas (si el entorno las soporta) en caso de errores repetidos en RPC.

8) Checklist final antes de marcar completado
- RPC aplicada en staging y verificada
- Roles y GRANT revisados y aplicados
- E2E green
- Documentación + runbook generada

Próximos entregables (acciones inmediatas que realizo ahora)
- Generar el SQL formal del contrato RPC (CREATE FUNCTION) con comentarios y ejemplos de llamadas.
- Generar el documento de pruebas E2E (pasos y queries SQL de verificación).
- Generar scripts de permisos (ALTER FUNCTION .. SECURITY DEFINER; GRANT EXECUTE ...).

---
Archivo creado automáticamente por el asistente para avanzar el plan de arquitectura. Si quieres, ahora genero el SQL formal del RPC y el runbook de despliegue.
