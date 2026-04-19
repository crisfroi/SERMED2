import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hosixSupabase } from '@hosix/integrations/supabase/client';

type PacienteDetail = {
  id: string;
  ppi: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: string;
  sexo: string;
  telefono_movil: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  activo: boolean | null;
};

type CitaMini = {
  id: string;
  fecha_hora: string;
  estado: string | null;
  motivo: string | null;
};

function nombreCompleto(p: PacienteDetail): string {
  return [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PatientDetailPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<PacienteDetail | null>(null);
  const [citas, setCitas] = useState<CitaMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    const { data: p, error: e1 } = await hosixSupabase
      .from('hosix_pacientes')
      .select(
        'id, ppi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo, telefono_movil, email, direccion, ciudad, activo'
      )
      .eq('id', patientId)
      .maybeSingle();

    if (e1 || !p) {
      setError(e1?.message || 'Paciente no encontrado');
      setPatient(null);
      setCitas([]);
      setLoading(false);
      return;
    }

    setPatient(p as PacienteDetail);

    const { data: cRows, error: e2 } = await hosixSupabase
      .from('hosix_citas')
      .select('id, fecha_hora, estado, motivo')
      .eq('paciente_id', patientId)
      .order('fecha_hora', { ascending: false })
      .limit(25);

    if (e2) {
      setCitas([]);
    } else {
      setCitas((cRows as CitaMini[]) || []);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!patientId) {
    return <p className="p-6">Identificador de paciente no válido.</p>;
  }

  return (
    <div className="space-y-6 text-gray-800">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <Link className="text-blue-600 hover:underline text-sm" to="/hosix/patients">
          ← Lista de pacientes
        </Link>
        <Link
          className="text-sm text-blue-600 hover:underline"
          to={`/hosix/clinical/laboratorio?patientId=${patientId}`}
        >
          Nueva orden de laboratorio →
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-gray-500">Cargando ficha…</p>
      ) : patient ? (
        <>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">{nombreCompleto(patient)}</h1>
            <p className="text-gray-500 font-mono text-sm mt-1">PPI: {patient.ppi}</p>
            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Nacimiento</dt>
                <dd className="font-medium">{patient.fecha_nacimiento}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Sexo</dt>
                <dd className="font-medium">{patient.sexo}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Contacto</dt>
                <dd className="font-medium">
                  {[patient.telefono_movil, patient.email].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Ubicación</dt>
                <dd className="font-medium">
                  {[patient.direccion, patient.ciudad].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd className="font-medium">{patient.activo ? 'Activo' : 'Inactivo'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Citas recientes</h2>
            {citas.length === 0 ? (
              <p className="text-gray-500 text-sm">Sin citas asociadas.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {citas.map((c) => (
                  <li key={c.id} className="py-3 flex justify-between gap-4">
                    <span>{new Date(c.fecha_hora).toLocaleString()}</span>
                    <span className="text-gray-600">{c.estado || '—'}</span>
                    <span className="text-gray-500 truncate max-w-md">{c.motivo || ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PatientDetailPage;
