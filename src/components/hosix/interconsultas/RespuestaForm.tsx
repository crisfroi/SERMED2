// @ts-nocheck
import React, { useState } from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';

export const RespuestaForm: React.FC<{ interconsultaId: string; onCreated?: () => void }> = ({ interconsultaId, onCreated }) => {
  const { createRespuesta } = useHosixInterconsultas();
  const [texto, setTexto] = useState('');
  const [especialistaId, setEspecialistaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await createRespuesta({ interconsulta_id: interconsultaId, texto, especialista_id: especialistaId });
    setLoading(false);
    if (res.error) setError(res.error);
    else { setTexto(''); setEspecialistaId(''); onCreated && onCreated(); }
  };

  return (
    <form className="hosix-respuesta-form" onSubmit={submit}>
      <div>
        <label>Especialista ID</label>
        <input value={especialistaId} onChange={(e) => setEspecialistaId(e.target.value)} />
      </div>
      <div>
        <label>Respuesta</label>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} required />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Respuesta'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default RespuestaForm;
