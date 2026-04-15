// @ts-nocheck
import React from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';
import RespuestaForm from './RespuestaForm';

type Props = {
  pacienteId?: string;
  interconsultaId?: string;
};

export const RespuestasManager: React.FC<Props> = ({ pacienteId, interconsultaId }) => {
  const { respuestas, loading, error, refresh } = useHosixInterconsultas({ pollingMs: 0 });

  const items = interconsultaId ? respuestas?.filter((r) => r.interconsulta_id === interconsultaId) : respuestas;

  return (
    <div className="hosix-respuestas-manager">
      <header>
        <h3>Respuestas - Interconsultas</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>

      <section style={{ margin: '1rem 0' }}>
        {interconsultaId ? (
          <RespuestaForm interconsultaId={interconsultaId} onCreated={() => refresh()} />
        ) : (
          <p>Seleccione una interconsulta para responder.</p>
        )}
      </section>

      {loading && <p>Cargando respuestas...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}

      {!loading && items && items.length === 0 && <p>No hay respuestas registradas.</p>}

      <ul>
        {items?.map((r) => (
          <li key={r.id}>
            <strong>{r.especialista_id ?? 'Especialista'}</strong>: {r.texto}
            <div style={{ fontSize: '0.8em', color: '#666' }}>{r.created_at}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RespuestasManager;

