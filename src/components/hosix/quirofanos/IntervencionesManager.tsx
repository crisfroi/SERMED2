import React from 'react';
import useQuirofanos from '../../../hooks/hosix/useQuirofanos';
import IntervencionForm from './IntervencionForm';
import IntervencionEdit from './IntervencionEdit';
import { useState } from 'react';

export const IntervencionesManager: React.FC = () => {
  const { intervenciones, loading, error, refresh } = useQuirofanos();

  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="hosix-intervenciones-manager">
      <header>
        <h3>Intervenciones / Quirófano</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>

      <section style={{ margin: '1rem 0' }}>
        <h4>Nueva intervención</h4>
        <IntervencionForm onCreated={() => refresh()} />
      </section>

      {loading && <p>Cargando intervenciones...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}

      <ul>
        {intervenciones?.map(i => (
          <li key={i.id} style={{ marginBottom: 12 }}>
            <div>
              <strong>{i.procedimiento_principal}</strong> — {i.paciente_id} — <small style={{ color: '#666' }}>{i.fecha_programada}</small>
            </div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => setEditing(i)}>Editar</button>
            </div>
            {editing && editing.id === i.id && (
              <div style={{ marginTop: 8, padding: 8, border: '1px solid #eee' }}>
                <IntervencionEdit intervencion={i} onSaved={() => { refresh(); setEditing(null); }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IntervencionesManager;
