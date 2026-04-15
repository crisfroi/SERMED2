// @ts-nocheck
import React, { useState } from 'react';
import useHosixMedicamentos from '../../../hooks/hosix/useHosixMedicamentos';

export const MedicamentoForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const { create } = useHosixMedicamentos();
  const [nombre, setNombre] = useState('');
  const [principio, setPrincipio] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const res = await create({ nombre_comercial: nombre, principio_activo: principio, presentacion });
    setLoading(false);
    if (res.error) setError(res.error);
    else { setNombre(''); setPrincipio(''); setPresentacion(''); onCreated && onCreated(); }
  };

  return (
    <form onSubmit={submit} className="hosix-medicamento-form">
      <div>
        <label>Nombre comercial</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div>
        <label>Principio activo</label>
        <input value={principio} onChange={(e) => setPrincipio(e.target.value)} />
      </div>
      <div>
        <label>Presentación</label>
        <input value={presentacion} onChange={(e) => setPresentacion(e.target.value)} />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear medicamento'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default MedicamentoForm;
