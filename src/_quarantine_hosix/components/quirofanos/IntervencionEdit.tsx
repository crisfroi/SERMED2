import React, { useState } from 'react';
import useQuirofanos from '../../../hooks/hosix/useQuirofanos';

export const IntervencionEdit: React.FC<{ intervencion: any; onSaved?: () => void }> = ({ intervencion, onSaved }) => {
  const { updateIntervencion } = useQuirofanos();
  const [estado, setEstado] = useState(intervencion.estado || 'programada');
  const [fechaInicioReal, setFechaInicioReal] = useState(intervencion.fecha_inicio_real || '');
  const [fechaFinReal, setFechaFinReal] = useState(intervencion.fecha_fin_real || '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const res = await updateIntervencion(intervencion.id, { estado, fecha_inicio_real: fechaInicioReal || null, fecha_fin_real: fechaFinReal || null });
      if (res.error) alert('Error: ' + JSON.stringify(res.error));
      else onSaved && onSaved();
    } finally { setLoading(false); }
  };

  return (
    <div className="intervencion-edit">
      <div>
        <label>Estado</label>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="programada">programada</option>
          <option value="en_proceso">en_proceso</option>
          <option value="finalizada">finalizada</option>
          <option value="cancelada">cancelada</option>
        </select>
      </div>
      <div>
        <label>Inicio real</label>
        <input type="datetime-local" value={fechaInicioReal || ''} onChange={(e) => setFechaInicioReal(e.target.value)} />
      </div>
      <div>
        <label>Fin real</label>
        <input type="datetime-local" value={fechaFinReal || ''} onChange={(e) => setFechaFinReal(e.target.value)} />
      </div>
      <div>
        <button onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
};

export default IntervencionEdit;
