import React from 'react';
import useQuirofanos from '../../../hooks/hosix/useQuirofanos';

export const QuirofanosManager: React.FC = () => {
  const { quirofanos, loading, error, refresh } = useQuirofanos();

  return (
    <div className="hosix-quirofanos-manager">
      <header>
        <h3>Quirófanos</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>
      {loading && <p>Cargando quirofanos...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
      <ul>
        {quirofanos?.map(q => (
          <li key={q.id}>{q.nombre} <small style={{color:'#666'}}>{q.codigo}</small></li>
        ))}
      </ul>
    </div>
  );
};

export default QuirofanosManager;
