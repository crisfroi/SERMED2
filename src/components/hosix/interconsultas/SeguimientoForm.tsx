import React, { useState } from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';

export const SeguimientoForm: React.FC<{ interconsultaId: string; onCreated?: () => void }> = ({ interconsultaId, onCreated }) => {
  const { addSeguimiento } = useHosixInterconsultas();
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const res = await addSeguimiento({ interconsulta_id: interconsultaId, notas });
    setLoading(false);
    if (res.error) setError(res.error);
    else { setNotas(''); onCreated && onCreated(); }
  };

  return (
    <form className="hosix-seguimiento-form" onSubmit={submit}>
      <div>
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} required />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Agregar Seguimiento'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default SeguimientoForm;
