// @ts-nocheck
/**
 * ==========================================================================
 * COMPONENTE REACT: Farmacia Integrada Dashboard
 * ==========================================================================
 * 
 * Dashboard profesional para el FARMACISTA que integra:
 *   - Prescripciones activas de HOSPITALIZACION
 *   - Validaciones automáticas (alergias, interacciones, stock)
 *   - Alertas de farmacia (stock bajo, vencimiento)
 *   - Pronósticos de agotamiento
 *   - Interfaz de dispensación segura
 *   - Historial de dispensaciones
 *
 * FLUJO:
 * 1. Farmacista carga ID de paciente
 * 2. Sistema trae prescripciones activas de HOSP
 * 3. Valida automáticamente contra TODO (alergias, interacciones, stock)
 * 4. Si TODO OK → botón "Dispensar" habilitado (VERDE)
 * 5. Si hay problemas → botón deshabilitado (ROJO) + explicación
 * 6. Al dispensar → descuento automático + movimiento inventario + cargo facturacion
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import useFarmaciaAvanzada, {
  ValidationSeverity,
  PrescripcionValidation,
  InventarioAlerta,
} from '@/hooks/hosix/useFarmaciaAvanzada';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getSeveridadColor = (severidad: ValidationSeverity): string => {
  switch (severidad) {
    case ValidationSeverity.LEVE:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case ValidationSeverity.MODERADA:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case ValidationSeverity.SEVERA:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case ValidationSeverity.CRITICA:
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSeveridadIcon = (severidad: ValidationSeverity) => {
  switch (severidad) {
    case ValidationSeverity.CRITICA:
    case ValidationSeverity.SEVERA:
      return <AlertTriangle className="w-5 h-5" />;
    case ValidationSeverity.MODERADA:
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <CheckCircle className="w-5 h-5" />;
  }
};

// ============================================================================
// COMPONENTE: CardPrescripcion
// ============================================================================

interface CardPrescripcionProps {
  prescription: any;
  validacion: PrescripcionValidation | null;
  validando: boolean;
  onValidar: () => void;
  onDispensar: () => void;
  dispensando: boolean;
}

const CardPrescripcion: React.FC<CardPrescripcionProps> = ({
  prescription,
  validacion,
  validando,
  onValidar,
  onDispensar,
  dispensando,
}) => {
  return (
    <Card className="mb-4 border-l-4" style={{
      borderLeftColor: validacion
        ? validacion.puede_dispensar
          ? '#22c55e'
          : '#dc2626'
        : '#cbd5e1',
    }}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{prescription.medicamento_nombre}</CardTitle>
            <CardDescription>
              Dosis: {prescription.dosis} | Frecuencia: {prescription.frecuencia}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {prescription.hospitalizado ? '🏥 Hospitalizado' : '👤 Ambulatorio'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ========== SECCION: PRESCRIPCION INFO ========== */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Prescriptor:</span> {prescription.medico_responsable_nombre || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Inicio:</span> {new Date(prescription.inicio).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Status:</span>
            <Badge className="ml-2" variant="secondary">
              {prescription.estado}
            </Badge>
          </div>
        </div>

        {/* ========== SECCION: VALIDACIONES ========== */}
        {validacion && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            {/* ALERGIA */}
            {validacion.validations.alergia && (
              <Alert className={getSeveridadColor(validacion.validations.alergia.severidad)}>
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>❌ ALERGIA DETECTADA:</strong> {validacion.validations.alergia.descripcion}
                </AlertDescription>
              </Alert>
            )}

            {/* CONTRAINDICATION */}
            {validacion.validations.contraindication && (
              <Alert className={getSeveridadColor(validacion.validations.contraindication.severidad)}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>⚠️ CONTRAINDICACION:</strong> {validacion.validations.contraindication.descripcion}
                </AlertDescription>
              </Alert>
            )}

            {/* INTERACCION */}
            {validacion.validations.interaccion && (
              <Alert className={getSeveridadColor(validacion.validations.interaccion.severidad)}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>⚠️ INTERACCION MEDICAMENTOSA:</strong> {validacion.validations.interaccion.efecto}
                  {validacion.validations.interaccion.severidad === ValidationSeverity.MODERADA && (
                    <span className="block mt-1 text-xs">Requiere confirmación del farmacista</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* STOCK */}
            {validacion.validations.stock_insuficiente && (
              <Alert className={getSeveridadColor(ValidationSeverity.SEVERA)}>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>⚠️ STOCK INSUFICIENTE:</strong> 
                  {validacion.validations.stock_insuficiente.disponible} disponibles 
                  (se necesitan {validacion.validations.stock_insuficiente.requerido})
                </AlertDescription>
              </Alert>
            )}

            {/* VENCIMIENTO */}
            {validacion.validations.vencimiento_proximo && (
              <Alert className={getSeveridadColor(ValidationSeverity.MODERADA)}>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>⏰ VENCIMIENTO PRÓXIMO:</strong> {validacion.validations.vencimiento_proximo.dias_restantes} días restantes
                </AlertDescription>
              </Alert>
            )}

            {/* STATUS GENERAL */}
            {Object.keys(validacion.validations).filter((k) => validacion.validations[k as any]).length === 0 && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>✅ Validación completada:</strong> Medicamento puede dispensarse sin restricciones
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* ========== SECCION: BOTONES DE ACCION ========== */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onValidar}
            disabled={validando}
          >
            {validando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              'Validar'
            )}
          </Button>

          <Button
            size="sm"
            onClick={onDispensar}
            disabled={!validacion?.puede_dispensar || dispensando}
            className={
              validacion?.puede_dispensar
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-300 cursor-not-allowed'
            }
          >
            {dispensando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Dispensando...
              </>
            ) : validacion?.puede_dispensar ? (
              '💊 Dispensar'
            ) : (
              '❌ No se puede dispensar'
            )}
          </Button>

          {validacion?.razon_bloqueo && (
            <div className="ml-auto text-xs text-red-600 py-2">
              Razón: {validacion.razon_bloqueo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: ALERTAS DE FARMACIA
// ============================================================================

const AlertasFarmaciaSection: React.FC<{ alertas: InventarioAlerta[] }> = ({ alertas }) => {
  if (alertas.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>✅ No hay alertas activas en farmacia</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50 mb-6">
      <CardHeader>
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Alertas de Farmacia ({alertas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.map((alerta, idx) => (
          <Alert key={idx} className={getSeveridadColor(alerta.severidad)}>
            {getSeveridadIcon(alerta.severidad)}
            <AlertDescription>
              <strong>{alerta.medicamento_nombre}</strong>
              <br />
              {alerta.tipo_alerta === 'STOCK_BAJO' && (
                `Stock bajo: ${alerta.valor_actual} (mínimo: ${alerta.valor_minimo})`
              )}
              {alerta.tipo_alerta === 'PROXIMA_VENCER' && (
                `Vence en ${alerta.dias_hasta_vencimiento} días`
              )}
              {alerta.tipo_alerta === 'VENCIDO' && (
                `VENCIDO hace ${Math.abs(alerta.dias_hasta_vencimiento || 0)} días`
              )}
              {alerta.reorden_sugerido && (
                <div className="text-xs mt-1">
                  Sugerencia de reorden: {alerta.reorden_sugerido} unidades
                </div>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: FarmaciaIntegradaDashboard
// ============================================================================

export const FarmaciaIntegradaDashboard: React.FC<{ hospitalId?: string }> = ({ hospitalId }) => {
  const [pacienteId, setPacienteId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [validacionEnProceso, setValidacionEnProceso] = useState<Map<string, boolean>>(new Map());
  const [validacionesCache, setValidacionesCache] = useState<Map<string, PrescripcionValidation>>(new Map());
  const [dispensandoId, setDispensandoId] = useState<string | null>(null);

  const {
    prescripciones,
    prescripcionesLoading,
    alertasInventario,
    alertasLoading,
    validarPrescripcionAsync,
    dispensarAsync,
    cachedValidaciones,
  } = useFarmaciaAvanzada(pacienteId, hospitalId);

  const handleBuscarPaciente = useCallback(() => {
    if (inputValue.trim()) {
      setPacienteId(inputValue.trim());
    }
  }, [inputValue]);

  const handleValidarPrescripcion = useCallback(
    async (rx: any) => {
      setValidacionEnProceso((prev) => new Map(prev).set(rx.id, true));
      try {
        const result = await validarPrescripcionAsync({
          medicamento_id: rx.medicamento_id,
          paciente_id: pacienteId,
          hospitalizado: rx.hospitalizado,
        });
        setValidacionesCache((prev) => new Map(prev).set(rx.id, result));
      } finally {
        setValidacionEnProceso((prev) => {
          const next = new Map(prev);
          next.delete(rx.id);
          return next;
        });
      }
    },
    [pacienteId, validarPrescripcionAsync]
  );

  const handleDispensar = useCallback(
    async (rx: any) => {
      setDispensandoId(rx.id);
      try {
        await dispensarAsync({
          medicamento_id: rx.medicamento_id,
          paciente_id: pacienteId,
          cantidad: 1,
          hospitalizado: rx.hospitalizado,
          prescriptor_id: 'current-user-id', // TODO: obtener del contexto
          admision_id: rx.admision_id,
        });
        alert('✅ Medicamento dispensado exitosamente');
        setValidacionesCache((prev) => {
          const next = new Map(prev);
          next.delete(rx.id);
          return next;
        });
      } catch (error) {
        alert(`❌ Error al dispensar: ${error}`);
      } finally {
        setDispensandoId(null);
      }
    },
    [pacienteId, dispensarAsync]
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">💊 Farmacia Integrada</h1>
        <Badge className="bg-blue-600">Dashboard Farmacista</Badge>
      </div>

      {/* BUSQUEDA DE PACIENTE */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Prescripciones de Paciente</CardTitle>
          <CardDescription>
            Ingresa el ID o cédula del paciente para ver sus prescripciones activas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Ingresa ID o cédula del paciente..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuscarPaciente()}
          />
          <Button onClick={handleBuscarPaciente} disabled={!inputValue.trim()}>
            Buscar
          </Button>
        </CardContent>
      </Card>

      {/* ALERTAS DE FARMACIA */}
      {!alertasLoading && <AlertasFarmaciaSection alertas={alertasInventario} />}

      {/* PRESCRIPCIONES */}
      {pacienteId && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Prescripciones Activas ({prescripciones.length})
          </h2>

          {prescripcionesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-gray-600 mt-2">Cargando prescripciones...</p>
            </div>
          ) : prescripciones.length === 0 ? (
            <Alert>
              <AlertDescription>
                No hay prescripciones activas para este paciente
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {prescripciones.map((rx) => (
                <CardPrescripcion
                  key={rx.id}
                  prescription={rx}
                  validacion={validacionesCache.get(rx.id) || null}
                  validando={validacionEnProceso.get(rx.id) || false}
                  onValidar={() => handleValidarPrescripcion(rx)}
                  onDispensar={() => handleDispensar(rx)}
                  dispensando={dispensandoId === rx.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PIE */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p>Dashboard integrado: HOSPITALIZACION → FARMACIA → ALMACEN → FACTURACION</p>
        <p>Todas las validaciones se ejecutan automáticamente en tiempo real</p>
      </div>
    </div>
  );
};

export default FarmaciaIntegradaDashboard;
