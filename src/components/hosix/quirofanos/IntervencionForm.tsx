// @ts-nocheck
import React, { useState } from 'react';
import useQuirofanos from '../../../hooks/hosix/useQuirofanos';

export const IntervencionForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const { quirofanos, createIntervencion } = useQuirofanos();
  const [quirofanoId, setQuirofanoId] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [fecha, setFecha] = useState('');
  const [procedimiento, setProcedimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const payload = { quirofano_id: quirofanoId, paciente_id: pacienteId, fecha_programada: fecha, procedimiento_principal: procedimiento } as any;
    const res = await createIntervencion(payload);
    setLoading(false);
    if (res.error) setError(res.error);
    else { setQuirofanoId(''); setPacienteId(''); setFecha(''); setProcedimiento(''); onCreated && onCreated(); }
  };

  return (
    <form className="hosix-intervencion-form" onSubmit={submit}>
      <div>
        <label>Quirófano</label>
        <select value={quirofanoId} onChange={(e)=>setQuirofanoId(e.target.value)} required>
          <option value="">-- selecciona --</option>
          {quirofanos?.map(q => <option key={q.id} value={q.id}>{q.nombre} ({q.codigo})</option>)}
        </select>
      </div>
      <div>
        <label>Paciente ID</label>
        <input value={pacienteId} onChange={(e)=>setPacienteId(e.target.value)} required />
      </div>
      <div>
        <label>Fecha programada</label>
        <input type="datetime-local" value={fecha} onChange={(e)=>setFecha(e.target.value)} required />
      </div>
      <div>
        <label>Procedimiento principal</label>
        <input value={procedimiento} onChange={(e)=>setProcedimiento(e.target.value)} required />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Programar intervención'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default IntervencionForm;
