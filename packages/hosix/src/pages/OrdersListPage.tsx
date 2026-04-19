import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hosixSupabase } from '@hosix/integrations/supabase/client';

export type OrdenMedicaRow = {
  id: string;
  tipo_orden: string;
  estado: string | null;
  prioridad: string | null;
  motivo_consulta: string;
  fecha_creacion: string;
  paciente_id: string;
  hosix_pacientes: { ppi: string; primer_nombre: string; primer_apellido: string } | null;
};

const OrdersListPage = () => {
  const [rows, setRows] = useState<OrdenMedicaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await hosixSupabase
      .from('hosix_ordenes_medicas')
      .select(
        `
        id,
        tipo_orden,
        estado,
        prioridad,
        motivo_consulta,
        fecha_creacion,
        paciente_id,
        hosix_pacientes ( ppi, primer_nombre, primer_apellido )
      `
      )
      .order('fecha_creacion', { ascending: false })
      .limit(200);

    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setRows((data as OrdenMedicaRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 text-gray-800">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <Link className="text-blue-600 hover:underline text-sm" to="/hosix/dashboard">
          ← Volver al panel
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Órdenes médicas</h1>
        <p className="text-gray-600 text-sm mt-1">
          Worklist desde <code className="text-xs bg-gray-100 px-1 rounded">hosix_ordenes_medicas</code>. Si RLS exige
          usuario autenticado en Supabase Auth, esta vista puede fallar con anon (mensaje abajo).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">No se pudieron cargar las órdenes</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500">Sin órdenes o sin permisos de lectura.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Prioridad</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((o) => {
                  const p = o.hosix_pacientes;
                  const nombre = p ? `${p.primer_nombre} ${p.primer_apellido}`.trim() : '—';
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(o.fecha_creacion).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {p ? (
                          <Link className="text-blue-600 hover:underline" to={`/hosix/patients/${o.paciente_id}`}>
                            {nombre}
                          </Link>
                        ) : (
                          nombre
                        )}
                      </td>
                      <td className="px-4 py-3">{o.tipo_orden}</td>
                      <td className="px-4 py-3">{o.estado || '—'}</td>
                      <td className="px-4 py-3">{o.prioridad || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={o.motivo_consulta}>
                        {o.motivo_consulta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersListPage;
