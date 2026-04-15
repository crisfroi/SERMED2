// @ts-nocheck
import React from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';
import ComunicacionForm from './ComunicacionForm';

type Props = {
  interconsultaId?: string;
};

export const ComunicacionesManager: React.FC<Props> = ({ interconsultaId }) => {
  const { comunicaciones, loading, error, refresh } = useHosixInterconsultas({ pollingMs: 0 });

  const items = interconsultaId ? comunicaciones?.filter((c) => c.interconsulta_id === interconsultaId) : comunicaciones;

  return (
    <div className="hosix-comunicaciones-manager">
      <header>
        <h3>Comunicaciones</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>

      <section style={{ margin: '1rem 0' }}>
        {interconsultaId ? (
          <ComunicacionForm interconsultaId={interconsultaId} onCreated={() => refresh()} />
        ) : (
          <p>Seleccione una interconsulta para enviar comunicaciones.</p>
        )}
      </section>

      {loading && <p>Cargando comunicaciones...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}

      {!loading && items && items.length === 0 && <p>No hay comunicaciones registradas.</p>}

      <ul>
        {items?.map((c) => (
          <li key={c.id}>
            <div><strong>{c.from_user_id}</strong> → {c.to_user_id ?? 'Todos'}</div>
            <div>{c.message}</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>{c.created_at}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ComunicacionesManager;
