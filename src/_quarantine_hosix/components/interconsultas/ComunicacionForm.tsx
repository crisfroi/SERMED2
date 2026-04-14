import React, { useState } from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';

export const ComunicacionForm: React.FC<{ interconsultaId: string; onCreated?: () => void }> = ({ interconsultaId, onCreated }) => {
  const { sendComunicacion } = useHosixInterconsultas();
  const [toUserId, setToUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const res = await sendComunicacion({ interconsulta_id: interconsultaId, from_user_id: 'system', to_user_id: toUserId || null, message });
    setLoading(false);
    if (res.error) setError(res.error);
    else { setMessage(''); setToUserId(''); onCreated && onCreated(); }
  };

  return (
    <form className="hosix-comunicacion-form" onSubmit={submit}>
      <div>
        <label>Para (user id)</label>
        <input value={toUserId} onChange={(e) => setToUserId(e.target.value)} />
      </div>
      <div>
        <label>Mensaje</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Comunicación'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default ComunicacionForm;
