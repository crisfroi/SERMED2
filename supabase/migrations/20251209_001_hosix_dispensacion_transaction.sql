-- Migration: 20251209_001_hosix_dispensacion_transaction.sql
-- Purpose: Create a PL/pgSQL function to perform a dispensación atomically:
--  - insert into hosix_dispensaciones
--  - create stock movimiento and update stock
--  - register caja movimiento (cobro) when amount provided

CREATE OR REPLACE FUNCTION public.dispensar_prescripcion(
  p_prescripcion_id uuid,
  p_prescripcion_numero text,
  p_medicamento_id uuid,
  p_medicamento_texto text,
  p_cantidad_dispensada numeric,
  p_unidad text,
  p_lote text,
  p_fecha_caducidad date,
  p_dispensador_id uuid,
  p_cantidad_a_facturar numeric,
  p_caja_id uuid,
  p_forma_pago text,
  p_registrado_por uuid
) RETURNS TABLE(dispensacion_id uuid) AS
$$
DECLARE
  v_dispensacion_id uuid;
  v_stock_record RECORD;
  v_cantidad_anterior numeric;
  v_cantidad_nueva numeric;
BEGIN
  -- Start transaction implicitly (function runs inside transaction)

  -- 1) Insert dispensación
  INSERT INTO public.hosix_dispensaciones(
    prescripcion_id, prescripcion_numero, medicamento_id, medicamento_texto,
    cantidad_dispensada, unidad, lote, fecha_caducidad, dispensador_id, fecha_dispensacion
  ) VALUES (
    p_prescripcion_id, p_prescripcion_numero, p_medicamento_id, p_medicamento_texto,
    p_cantidad_dispensada, p_unidad, p_lote, p_fecha_caducidad, p_dispensador_id, now()
  ) RETURNING id INTO v_dispensacion_id;

  -- 2) If medicamento_id provided, update stock with FOR UPDATE to ensure consistency
  IF p_medicamento_id IS NOT NULL THEN
    SELECT * INTO v_stock_record FROM public.hosix_stock_medicamentos WHERE medicamento_id = p_medicamento_id FOR UPDATE;
    IF FOUND THEN
      v_cantidad_anterior := COALESCE(v_stock_record.cantidad_disponible, 0);
      v_cantidad_nueva := v_cantidad_anterior - p_cantidad_dispensada;

      INSERT INTO public.hosix_stock_movimientos(medicamento_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, referencia_documento, usuario_id, fecha_movimiento, observaciones)
      VALUES (p_medicamento_id, 'salida_prescripcion', p_cantidad_dispensada, v_cantidad_anterior, v_cantidad_nueva, v_dispensacion_id::text, p_registrado_por, now(), 'Dispensación automática por prescripción');

      UPDATE public.hosix_stock_medicamentos SET cantidad_disponible = v_cantidad_nueva, updated_at = now() WHERE medicamento_id = p_medicamento_id;
    ELSE
      -- If no stock record exists, create one with negative stock (indicates backorder)
      v_cantidad_anterior := 0;
      v_cantidad_nueva := -p_cantidad_dispensada;
      INSERT INTO public.hosix_stock_medicamentos(medicamento_id, cantidad_disponible, created_at, updated_at)
      VALUES (p_medicamento_id, v_cantidad_nueva, now(), now());

      INSERT INTO public.hosix_stock_movimientos(medicamento_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, referencia_documento, usuario_id, fecha_movimiento, observaciones)
      VALUES (p_medicamento_id, 'salida_prescripcion', p_cantidad_dispensada, v_cantidad_anterior, v_cantidad_nueva, v_dispensacion_id::text, p_registrado_por, now(), 'Dispensación (stock inexistente, creado registro)');
    END IF;
  END IF;

  -- 3) Register movement in caja when amount provided
  IF p_cantidad_a_facturar IS NOT NULL AND p_cantidad_a_facturar > 0 THEN
    INSERT INTO public.hosix_cajas_movimientos(cantidad, concepto, fecha_movimiento, tipo_movimiento, registrado_por, forma_pago, referencia_pago, caja_id)
    VALUES (p_cantidad_a_facturar, CONCAT('Dispensación prescripción ', COALESCE(p_prescripcion_numero::text, p_prescripcion_id::text)), now(), 'cobro', p_registrado_por, p_forma_pago, COALESCE(p_prescripcion_numero::text, p_prescripcion_id::text), p_caja_id);
  END IF;

  dispensacion_id := v_dispensacion_id;
  RETURN NEXT;
EXCEPTION WHEN OTHERS THEN
  -- Bubble up error to caller; transaction will be rolled back
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.dispensar_prescripcion(uuid,text,uuid,text,numeric,text,text,date,uuid,numeric,uuid,text,uuid) IS 'Atomically dispensar prescripción: crea dispensación, actualiza stock y registra cobro en caja.';
