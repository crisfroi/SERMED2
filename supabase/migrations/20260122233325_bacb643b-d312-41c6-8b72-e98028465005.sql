-- Crear trigger para establecer fecha_generacion_resolucion cuando el estado pasa a 'Pendiente de Firma'
CREATE OR REPLACE FUNCTION public.set_fecha_generacion_resolucion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo establecer la fecha si el estado cambia a 'Pendiente de Firma' 
    -- y la fecha aún no ha sido establecida (para mantenerla inmutable)
    IF NEW.estado_solicitud = 'Pendiente de Firma' 
       AND (OLD.estado_solicitud IS NULL OR OLD.estado_solicitud != 'Pendiente de Firma')
       AND NEW.fecha_generacion_resolucion IS NULL THEN
        NEW.fecha_generacion_resolucion = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_set_fecha_generacion_resolucion ON public.profesionales_sanitarios;

-- Crear el trigger
CREATE TRIGGER trigger_set_fecha_generacion_resolucion
    BEFORE UPDATE ON public.profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION public.set_fecha_generacion_resolucion();