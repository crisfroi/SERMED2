// @ts-nocheck
import React, { useState } from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';

export const SolicitudForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const { createSolicitud } = useHosixInterconsultas();
  const [pacienteId, setPacienteId] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [tipo, setTipo] = useState('interconsulta');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      paciente_id: pacienteId,
      especialidad_id: especialidadId || null,
      tipo,
      estado: 'pendiente',
    } as any;
    const res = await createSolicitud(payload);
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setPacienteId(''); setEspecialidadId(''); setTipo('interconsulta');
      onCreated && onCreated();
    }
  };

  return (
    <form className="hosix-solicitud-form" onSubmit={submit}>
      <div>
        <label>Paciente ID</label>
        <input value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required />
      </div>
      <div>
        <label>Especialidad ID</label>
        <input value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)} />
      </div>
      <div>
        <label>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="interconsulta">Interconsulta</option>
          <option value="remision">Remisión</option>
        </select>
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Solicitud'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default SolicitudForm;
