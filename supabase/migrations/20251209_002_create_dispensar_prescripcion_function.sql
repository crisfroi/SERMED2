-- Migration: Create dispensar_prescripcion RPC (transactional)
-- NOTE: Review and apply in staging before production. This function assumes
-- the existence of tables: hosix_dispensaciones, hosix_stock_medicamentos,
-- hosix_stock_movimientos, hosix_cajas_movimientos, hosix_auditoria (optional).

CREATE OR REPLACE FUNCTION public.dispensar_prescripcion(
  p_prescripcion_id text,
  p_prescripcion_numero text DEFAULT NULL,
  p_medicamento_id uuid DEFAULT NULL,
  p_medicamento_texto text DEFAULT NULL,
  p_cantidad_dispensada numeric,
  p_unidad text DEFAULT NULL,
  p_lote text DEFAULT NULL,
  p_fecha_caducidad timestamptz DEFAULT NULL,
  p_dispensador_id uuid DEFAULT NULL,
  p_cantidad_a_facturar numeric DEFAULT NULL,
  p_caja_id uuid DEFAULT NULL,
  p_forma_pago text DEFAULT NULL,
  p_registrado_por uuid DEFAULT NULL
) RETURNS TABLE(dispensacion_id uuid) AS $$
DECLARE
  v_dispensacion_id uuid;
  v_stock_before numeric;
BEGIN
  -- Start transaction block implicit in function

  -- Insert dispensacion record
  INSERT INTO public.hosix_dispensaciones(
    prescripcion_id, prescripcion_numero, medicamento_id, medicamento_texto,
    cantidad_dispensada, unidad, lote, fecha_caducidad, dispensador_id, created_at
  ) VALUES (
    p_prescripcion_id, p_prescripcion_numero, p_medicamento_id, p_medicamento_texto,
    p_cantidad_dispensada, p_unidad, p_lote, p_fecha_caducidad, p_dispensador_id, now()
  ) RETURNING id INTO v_dispensacion_id;

  -- If medicamento provided, update stock atomically
  IF p_medicamento_id IS NOT NULL THEN
    -- Lock the stock row to prevent race conditions
    SELECT cantidad INTO v_stock_before FROM public.hosix_stock_medicamentos
      WHERE medicamento_id = p_medicamento_id FOR UPDATE;

    IF v_stock_before IS NULL THEN
      RAISE EXCEPTION 'stock_not_found: medicamento %', p_medicamento_id;
    END IF;

    IF v_stock_before < p_cantidad_dispensada THEN
      RAISE EXCEPTION 'stock_insufficient: have=% quantity=%', v_stock_before, p_cantidad_dispensada;
    END IF;

    -- Create stock movement (salida)
    INSERT INTO public.hosix_stock_movimientos(
      medicamento_id, tipo_movimiento, cantidad, referencia_documento, usuario_id, observaciones, created_at
    ) VALUES (
      p_medicamento_id, 'salida_prescripcion', -abs(p_cantidad_dispensada), v_dispensacion_id, p_dispensador_id,
      concat('Dispensación RPC prescripcion ', p_prescripcion_id), now()
    );

    -- Update stock summary
    UPDATE public.hosix_stock_medicamentos
      SET cantidad = cantidad - abs(p_cantidad_dispensada), updated_at = now()
      WHERE medicamento_id = p_medicamento_id;
  END IF;

  -- If amount to charge provided, insert caja movement
  IF p_cantidad_a_facturar IS NOT NULL AND p_cantidad_a_facturar > 0 THEN
    INSERT INTO public.hosix_cajas_movimientos(
      cantidad, concepto, fecha_movimiento, tipo_movimiento, registrado_por, forma_pago, referencia_pago, caja_id, created_at
    ) VALUES (
      p_cantidad_a_facturar, concat('Dispensación prescripción ', COALESCE(p_prescripcion_numero, p_prescripcion_id)), now(), 'cobro',
      p_registrado_por, p_forma_pago, COALESCE(p_prescripcion_numero, p_prescripcion_id), p_caja_id, now()
    );
  END IF;

  -- Optional: insert audit log (if table exists)
  BEGIN
    INSERT INTO public.hosix_auditoria(evento, detalle, registrado_por, referencia_id, created_at)
    VALUES ('dispensar_prescripcion', json_build_object('prescripcion_id', p_prescripcion_id, 'dispensacion_id', v_dispensacion_id), p_registrado_por, v_dispensacion_id, now());
  EXCEPTION WHEN undefined_table THEN
    -- ignore if audit table does not exist
    NULL;
  END;

  -- Return the created dispensacion id
  dispensacion_id := v_dispensacion_id;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.dispensar_prescripcion IS
  'Función RPC para realizar una dispensación completa y atómica: crea dispensación, crea movimiento de stock, actualiza stock, crea movimiento de caja si aplica y registra auditoría. Use SECURITY DEFINER con cuenta propietaria con permisos.';
