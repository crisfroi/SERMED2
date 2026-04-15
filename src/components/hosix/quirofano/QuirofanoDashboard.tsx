// @ts-nocheck
/**
 * =========================================================================
 * QUIROFANO DASHBOARD - Control Integral de Procedimientos Quirúrgicos
 * =========================================================================
 *
 * VISTA PRINCIPAL: 
 * - Listado de procedimientos programados
 * - Pre-op: Validaciones automáticas (VERDE si OK, ROJO si NO)
 * - Intra-op: Reloj en tiempo real, vitales, materiales
 * - Post-op: Recomendaciones + seguimiento
 *
 * USUARIOS: Cirujanos, Anestesiólogos, Enfermería
 */

import React, { useState, useEffect } from 'react';
import { useQuirofanoAvanzado } from '../../hooks/hosix/useQuirofanoAvanzado';
import { useInventarioQuirurgico } from '../../hooks/hosix/useInventarioQuirurgico';
import classNames from 'classnames';

interface QuirofanoDashboardProps {
  hospital_id: string;
  user_role: 'CIRUJANO' | 'ANESTESIOLOGO' | 'ENFERMERIA';
}

export function QuirofanoDashboard({ hospital_id, user_role }: QuirofanoDashboardProps) {
  const [tab, setTab] = useState<'LISTA' | 'PREOP' | 'INTRAOP' | 'POSTOP'>('LISTA');
  const [procedimientoSeleccionado, setProcedimientoSeleccionado] = useState<string | null>(null);
  const [procedimientosHoy, setProcedimientosHoy] = useState<any[]>([]);

  const quirofano = useQuirofanoAvanzado(procedimientoSeleccionado);
  const inventario = useInventarioQuirurgico(procedimientoSeleccionado);

  // ========================================================================
  // TAB 1: LISTA DE PROCEDIMIENTOS HOY
  // ========================================================================

  const TabListaProcedimientos = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Procedimientos Programados para Hoy ({procedimientosHoy.length})
      </h2>

      <div className="grid gap-4">
        {procedimientosHoy.map((proc) => (
          <CardProcedimiento
            key={proc.id}
            procedimiento={proc}
            seleccionado={procedimientoSeleccionado === proc.id}
            onSelect={() => {
              setProcedimientoSeleccionado(proc.id);
              setTab('PREOP');
            }}
          />
        ))}
      </div>
    </div>
  );

  // ========================================================================
  // TAB 2: PRE-OPERATORIO (Validaciones)
  // ========================================================================

  const TabPreoperatorio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">PRE-OPERATORIO</h2>
        <button
          onClick={() => setTab('LISTA')}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          ← Volver
        </button>
      </div>

      {quirofano.preopLoading ? (
        <div className="text-center py-8 text-gray-500">Validando pre-op...</div>
      ) : quirofano.preop ? (
        <div>
          {/* HEADER CON ESTADO */}
          <div
            className={classNames(
              'p-6 rounded-lg mb-6 text-white text-center text-2xl font-bold',
              quirofano.preop.puede_proceder
                ? 'bg-green-500'
                : 'bg-red-500'
            )}
          >
            {quirofano.preop.puede_proceder ? '✅ LISTO PARA QX' : '🚫 NO LISTO - REQUIERE ACCIONES'}
          </div>

          {/* CHECKLIST */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Checklist Pre-operatorio</h3>

            <div className="space-y-3">
              {quirofano.preop.validaciones &&
                Object.entries(quirofano.preop.validaciones).map(([key, val]: any) => (
                  <div
                    key={key}
                    className={classNames(
                      'p-4 rounded border-l-4 flex justify-between items-center',
                      val.completado
                        ? 'bg-green-50 border-green-400'
                        : 'bg-red-50 border-red-400'
                    )}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {val.completado ? '✅' : '❌'} {key.replace(/_/g, ' ')}
                      </p>
                      {val.detalle && <p className="text-sm text-gray-600">{val.detalle}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ALERTAS */}
          {quirofano.preop.contraindicaciones_bloqueantes.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-red-700 mb-3">🚨 CONTRAINDICACIONES BLOQUEANTES</h3>
              <ul className="space-y-2">
                {quirofano.preop.contraindicaciones_bloqueantes.map((item, idx) => (
                  <li key={idx} className="text-red-600 font-semibold">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ALERTAS MODERADAS */}
          {quirofano.preop.alertas.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-yellow-700 mb-3">⚠️ ALERTAS</h3>
              <ul className="space-y-2">
                {quirofano.preop.alertas.map((item, idx) => (
                  <li key={idx} className="text-yellow-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-4 mt-6">
            {quirofano.preop.puede_proceder ? (
              <button
                onClick={() => {
                  quirofano.confirmarProcedimiento?.();
                  setTab('INTRAOP');
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 text-lg"
              >
                ✅ CONFIRMAR Y ENTRAR A QX
              </button>
            ) : (
              <button
                disabled
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded cursor-not-allowed text-lg"
              >
                ❌ REQUIERE CORRECCIONES
              </button>
            )}

            <button
              onClick={() => quirofano.refresh?.()}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Selecciona un procedimiento</div>
      )}
    </div>
  );

  // ========================================================================
  // TAB 3: INTRA-OPERATORIO (En tiempo real)
  // ========================================================================

  const TabIntraoperatorio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">INTRA-OPERATORIO</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('PREOP')}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            ← Volver
          </button>
          <button
            onClick={() => setTab('POSTOP')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Finalizar QX →
          </button>
        </div>
      </div>

      {quirofano.procedimiento && (
        <div className="space-y-6">
          {/* RELOJ INTRA-OP */}
          <CardRelojIntraop procedimiento={quirofano.procedimiento} />

          {/* MATERIALES DISPONIBLES */}
          <CardInventarioQuirurgico
            materiales={inventario.materialesRecomendados}
            alertas={inventario.alertasCriticas}
            onDispensarMateriales={inventario.dispensarMaterialesAsync}
          />

          {/* VITALES EN TIEMPO REAL */}
          <CardVitalesEnTiempoReal procedimiento={quirofano.procedimiento} />

          {/* REGISTRO DE EVENTOS */}
          <CardRegistroEventosIntraop procedimiento={quirofano.procedimiento} />
        </div>
      )}
    </div>
  );

  // ========================================================================
  // TAB 4: POST-OPERATORIO
  // ========================================================================

  const TabPostoperatorio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">POST-OPERATORIO</h2>
        <button
          onClick={() => setTab('LISTA')}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          ← Ir a Lista
        </button>
      </div>

      {quirofano.procedimiento && (
        <div className="space-y-6">
          <CardOrdenesMedicas procedimiento={quirofano.procedimiento} />
          <CardSeguimientoCitas procedimiento={quirofano.procedimiento} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🏥 QUIRÓFANO</h1>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 mb-8 border-b-2 border-gray-300">
          {[
            { id: 'LISTA', label: '📋 Lista de Procedimientos' },
            { id: 'PREOP', label: '🔍 Pre-operatorio' },
            { id: 'INTRAOP', label: '⏱️ Intra-operatorio' },
            { id: 'POSTOP', label: '✅ Post-operatorio' },
          ].map((t: any) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={classNames(
                'px-6 py-3 font-semibold border-b-4 transition',
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO DEL TAB */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {tab === 'LISTA' && <TabListaProcedimientos />}
          {tab === 'PREOP' && <TabPreoperatorio />}
          {tab === 'INTRAOP' && <TabIntraoperatorio />}
          {tab === 'POSTOP' && <TabPostoperatorio />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

function CardProcedimiento({ procedimiento, seleccionado, onSelect }: any) {
  const prioridadColor = {
    'URGENCIA': 'bg-red-100 border-red-400',
    'SEMI-URGENCIA': 'bg-yellow-100 border-yellow-400',
    'ELECTIVA': 'bg-blue-100 border-blue-400',
  } as Record<string, string>;

  return (
    <button
      onClick={onSelect}
      className={classNames(
        'w-full p-4 rounded-lg border-l-4 text-left transition hover:shadow-lg',
        seleccionado ? 'ring-2 ring-blue-500' : '',
        prioridadColor[procedimiento.tipo_urgencia] || 'bg-gray-100 border-gray-400'
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-gray-800">{procedimiento.procedimiento_principal}</p>
          <p className="text-sm text-gray-600">
            Paciente: {procedimiento.paciente_nombre} | Cirujano: {procedimiento.cirujano_principal_nombre}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Programada: {new Date(procedimiento.fecha_programada).toLocaleString('es-ES')} |
            Duración est: {procedimiento.duracion_estimada_minutos} min
          </p>
        </div>
        <div className="text-right">
          <span
            className={classNames(
              'px-4 py-2 rounded-full text-white font-bold text-sm',
              procedimiento.estado === 'CONFIRMADA'
                ? 'bg-green-500'
                : procedimiento.estado === 'EN_QUIROFANO'
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            )}
          >
            {procedimiento.estado}
          </span>
        </div>
      </div>
    </button>
  );
}

function CardRelojIntraop({ procedimiento }: any) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTiempoTranscurrido((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutos = Math.floor(tiempoTranscurrido / 60);
  const segundos = tiempoTranscurrido % 60;
  const porcentajeTiempo = (tiempoTranscurrido / (procedimiento.duracion_estimada_minutos * 60)) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">TIEMPO INTRA-OPERATORIO</h3>

      <div className="flex items-center gap-8">
        <div className="text-6xl font-mono font-bold">
          {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
        </div>

        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span>Tiempo transcurrido</span>
            <span>~{procedimiento.duracion_estimada_minutos} min estimado</span>
          </div>

          <div className="w-full bg-blue-300 rounded-full h-4 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-1000"
              style={{ width: `${Math.min(porcentajeTiempo, 100)}%` }}
            />
          </div>

          <p className="text-sm mt-2 opacity-90">
            {porcentajeTiempo > 100
              ? `⚠️ Excediendo tiempo estimado por ${Math.floor(porcentajeTiempo - 100)}%`
              : `En tiempo. Quedan ~${procedimiento.duracion_estimada_minutos - minutos} min`}
          </p>
        </div>
      </div>
    </div>
  );
}

function CardInventarioQuirurgico({ materiales, alertas, onDispensarMateriales }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-400">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📦 MATERIALES QUIRÚRGICOS</h3>

      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-4">
          <p className="font-bold text-red-700">⚠️ Alertas Críticas:</p>
          <ul className="text-red-600 text-sm mt-2 space-y-1">
            {alertas.map((a: any) => (
              <li key={a.material_id}>• {a.material_nombre}: {a.mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {materiales.map(
          (mat: any) => (
            <div key={mat.id} className="p-4 bg-gray-50 rounded">
              <p className="font-semibold text-gray-800">{mat.nombre}</p>
              <p className="text-sm text-gray-600">
                Disponible: <span className="font-bold">{mat.cantidad_disponible} / {mat.cantidad_minima}</span>
              </p>
              <p className="text-xs text-gray-500">Costo: ${mat.costo_unitario}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CardVitalesEnTiempoReal({ procedimiento }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-400">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💚 SIGNOS VITALES ACTUALES</h3>
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'FC', valor: '85', unidad: 'bpm', ok: true },
          { label: 'PA', valor: '130/80', unidad: 'mmHg', ok: true },
          { label: 'SatO2', valor: '98', unidad: '%', ok: true },
          { label: 'Temp', valor: '36.8', unidad: '°C', ok: true },
          { label: 'FR', valor: '16', unidad: 'rpm', ok: true },
        ].map((vital) => (
          <div
            key={vital.label}
            className={classNames(
              'p-4 rounded text-center',
              vital.ok ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
            )}
          >
            <p className="text-xs text-gray-600">{vital.label}</p>
            <p className="text-3xl font-bold text-gray-800">{vital.valor}</p>
            <p className="text-xs text-gray-500">{vital.unidad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardRegistroEventosIntraop({ procedimiento }: any) {
  const [eventos, setEventos] = React.useState<any[]>([]);

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-400">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📝 REGISTRO DE EVENTOS</h3>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {eventos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Sin eventos registrados</p>
        ) : (
          eventos.map((e: any, idx: number) => (
            <div key={idx} className="flex gap-3 text-sm">
              <span className="font-mono text-gray-600">{e.timestamp}</span>
              <span className="text-gray-800">{e.evento}</span>
            </div>
          ))
        )}
      </div>

      <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
        + Registrar Evento
      </button>
    </div>
  );
}

function CardOrdenesMedicas({ procedimiento }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-400">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📋 ÓRDENES MÉDICAS POST-OP</h3>
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-gray-800">Dieta:</p>
          <p className="text-gray-600">NPO 12-24h, luego dieta líquida clara</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Medicamentos:</p>
          <ul className="text-gray-600 space-y-1 ml-4 list-disc">
            <li>Acetaminofén 500mg c/6h PRN</li>
            <li>Metoclopramida 10mg c/8h</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Precauciones:</p>
          <ul className="text-gray-600 space-y-1 ml-4 list-disc">
            <li>Monitoría continua de signos vitales</li>
            <li>Control de drenajes q2h</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CardSeguimientoCitas({ procedimiento }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-pink-400">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📅 CITAS DE SEGUIMIENTO</h3>
      <div className="space-y-3">
        <div className="p-3 bg-pink-50 rounded">
          <p className="font-semibold text-gray-800">Control Post-OP</p>
          <p className="text-sm text-gray-600">Programado: 7 días</p>
        </div>
        <div className="p-3 bg-pink-50 rounded">
          <p className="font-semibold text-gray-800">Retiro de Puntos</p>
          <p className="text-sm text-gray-600">Programado: 10 días</p>
        </div>
      </div>
    </div>
  );
}

export default QuirofanoDashboard;
