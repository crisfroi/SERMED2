import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hosixSupabase } from '@hosix/integrations/supabase/client';

export type CitaRow = {
  id: string;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string | null;
  motivo: string | null;
  paciente_id: string;
  hosix_pacientes: {
    ppi: string;
    primer_nombre: string;
    primer_apellido: string;
  } | null;
};

const AppointmentsListPage = () => {
  const [rows, setRows] = useState<CitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await hosixSupabase
      .from('hosix_citas')
      .select(
        `
        id,
        fecha_hora,
        duracion_minutos,
        estado,
        motivo,
        paciente_id,
        hosix_pacientes ( ppi, primer_nombre, primer_apellido )
      `
      )
      .order('fecha_hora', { ascending: true })
      .limit(300);

    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setRows((data as CitaRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 text-gray-800">
      <div className="flex flex-wrap items-center gap-4 justify-between">
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
        <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
        <p className="text-gray-600 text-sm mt-1">
          Agenda desde <code className="text-xs bg-gray-100 px-1 rounded">hosix_citas</code> con datos del paciente.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">No se pudieron cargar las citas</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando citas…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500">No hay citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha y hora</th>
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((c) => {
                  const p = c.hosix_pacientes;
                  const nombre = p
                    ? `${p.primer_nombre} ${p.primer_apellido}`.trim()
                    : '—';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(c.fecha_hora).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {p ? (
                          <Link
                            className="text-blue-600 hover:underline"
                            to={`/hosix/patients/${c.paciente_id}`}
                          >
                            {nombre} <span className="text-gray-500 font-mono text-xs">({p.ppi})</span>
                          </Link>
                        ) : (
                          nombre
                        )}
                      </td>
                      <td className="px-4 py-3">{c.duracion_minutos} min</td>
                      <td className="px-4 py-3">{c.estado || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={c.motivo || ''}>
                        {c.motivo || '—'}
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

export default AppointmentsListPage;
