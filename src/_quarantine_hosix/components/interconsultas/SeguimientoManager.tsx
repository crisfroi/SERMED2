import React from 'react';
import useHosixInterconsultas from '../../../hooks/hosix/useHosixInterconsultas';
import SeguimientoForm from './SeguimientoForm';

type Props = {
  interconsultaId?: string;
};

export const SeguimientoManager: React.FC<Props> = ({ interconsultaId }) => {
  const { seguimiento, loading, error, refresh } = useHosixInterconsultas({ pollingMs: 0 });

  const items = interconsultaId ? seguimiento?.filter((s) => s.interconsulta_id === interconsultaId) : seguimiento;

  return (
    <div className="hosix-seguimiento-manager">
      <header>
        <h3>Seguimiento Clínico</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>

      <section style={{ margin: '1rem 0' }}>
        {interconsultaId ? (
          <SeguimientoForm interconsultaId={interconsultaId} onCreated={() => refresh()} />
        ) : (
          <p>Seleccione una interconsulta para añadir seguimiento.</p>
        )}
      </section>

      {loading && <p>Cargando seguimiento...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}

      {!loading && items && items.length === 0 && <p>No hay entradas de seguimiento.</p>}

      <ol>
        {items?.map((s) => (
          <li key={s.id}>
            <div>{s.notas}</div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>{s.created_at}</div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default SeguimientoManager;

