// @ts-nocheck
import React from 'react';
import useHosixMedicamentos from '../../../hooks/hosix/useHosixMedicamentos';
import MedicamentoForm from './MedicamentoForm';

export const MedicamentosManager: React.FC = () => {
  const { medicamentos, loading, error, refresh } = useHosixMedicamentos();

  return (
    <div className="hosix-medicamentos-manager">
      <header>
        <h3>Catálogo de Medicamentos</h3>
        <button onClick={() => refresh()}>Actualizar</button>
      </header>

      <section style={{ margin: '1rem 0' }}>
        <h4>Nuevo medicamento</h4>
        <MedicamentoForm onCreated={() => refresh()} />
      </section>

      {loading && <p>Cargando medicamentos...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}

      <ul>
        {medicamentos?.map((m) => (
          <li key={m.id}>{m.nombre_comercial} <small style={{color:'#666'}}>{m.principio_activo}</small></li>
        ))}
      </ul>
    </div>
  );
};

export default MedicamentosManager;
