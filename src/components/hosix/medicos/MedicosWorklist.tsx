// @ts-nocheck
import React from 'react';
import { supabase, executeSupabaseQuery } from '../../../integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';

export type WorklistItem = {
  id: string;
  medico_id: string;
  paciente_id: string;
  motivo: string;
  fecha?: string;
};

export const MedicosWorklist: React.FC = () => {
  const [items, setItems] = useState<WorklistItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_medicos_worklist').select('*'), 'medicos_worklist_fetch');
      if (res.error) setError(res.error);
      setItems(res.data as any);
    } catch (err) {
      setError(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="hosix-medicos-worklist">
      <header>
        <h3>Worklist Médicos</h3>
        <button onClick={() => fetch()}>Actualizar</button>
      </header>
      {loading && <p>Cargando worklist...</p>}
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
      {!loading && items && items.length === 0 && <p>No hay items en la worklist.</p>}
      <ul>
        {items?.map(i => (
          <li key={i.id}><strong>{i.medico_id}</strong> — {i.paciente_id} — {i.motivo} <span style={{color:'#666'}}>{i.fecha}</span></li>
        ))}
      </ul>
    </div>
  );
};

export default MedicosWorklist;
