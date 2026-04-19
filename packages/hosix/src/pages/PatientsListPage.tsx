import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hosixSupabase } from '@hosix/integrations/supabase/client';

export type HosixPacienteListRow = {
  id: string;
  ppi: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: string;
  activo: boolean | null;
  telefono_movil: string | null;
  email: string | null;
};

function fullName(p: HosixPacienteListRow): string {
  return [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PatientsListPage = () => {
  const [rows, setRows] = useState<HosixPacienteListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await hosixSupabase
      .from('hosix_pacientes')
      .select(
        'id, ppi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, activo, telefono_movil, email'
      )
      .eq('activo', true)
      .order('primer_apellido', { ascending: true })
      .limit(200);

    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setRows((data as HosixPacienteListRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 text-gray-800">
      <div>
        <Link className="text-blue-600 hover:underline text-sm" to="/hosix/dashboard">
          ← Volver al panel
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Listado desde <code className="text-xs bg-gray-100 px-1 rounded">hosix_pacientes</code> (proyecto Hosix,
            clave anónima del entorno).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">No se pudo cargar la tabla</p>
          <p className="mt-1 text-amber-800">{error}</p>
          <p className="mt-2 text-xs text-amber-700">
            Comprueba que las migraciones estén aplicadas en el proyecto Supabase Hosix y que RLS permita lectura con rol
            anónimo según tu política.
          </p>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Cargando pacientes…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500">No hay pacientes activos o la tabla está vacía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">PPI</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Nacimiento</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link className="text-blue-600 hover:underline" to={`/hosix/patients/${p.id}`}>
                        {p.ppi}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link className="text-blue-600 hover:underline" to={`/hosix/patients/${p.id}`}>
                        {fullName(p)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.fecha_nacimiento}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[p.telefono_movil, p.email].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsListPage;
