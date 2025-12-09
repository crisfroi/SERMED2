import React, { useState, useEffect } from 'react';
import useHosixPrescripciones from '../../../hooks/hosix/useHosixPrescripciones';
import useHosixMedicamentos from '../../../hooks/hosix/useHosixMedicamentos';
import useHosixStock from '../../../hooks/hosix/useHosixStock';

export const PrescripcionForm: React.FC<{ pacienteId?: string; onCreated?: () => void }> = ({ pacienteId, onCreated }) => {
  const { create } = useHosixPrescripciones();
  const { medicamentos } = useHosixMedicamentos();
  const { getStockForMedicamento } = useHosixStock();
  const [medicamentoTexto, setMedicamentoTexto] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [duracion, setDuracion] = useState<number | ''>('');
  const [instrucciones, setInstrucciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<any>(null);

  useEffect(() => {
    // if medicamento matches an item in catalog, set selectedMedId
    const found = medicamentos?.find(m => m.nombre_comercial?.toLowerCase() === medicamentoTexto.toLowerCase() || m.codigo === medicamentoTexto);
    if (found) setSelectedMedId(found.id);
    else setSelectedMedId(null);
  }, [medicamentoTexto, medicamentos]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (selectedMedId) {
        const s = await getStockForMedicamento(selectedMedId);
        if (mounted) setStockInfo(s.data || null);
      } else {
        setStockInfo(null);
      }
    })();
    return () => { mounted = false; };
  }, [selectedMedId, getStockForMedicamento]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    const payload: any = {
      paciente_id: pacienteId || null,
      medicamento_texto: medicamentoTexto,
      medicamento_id: selectedMedId || null,
      dosis,
      frecuencia,
      duracion_dias: duracion === '' ? null : duracion,
      instrucciones,
    };
    const res = await create(payload);
    setLoading(false);
    if (res.error) setError(res.error);
    else { setMedicamentoTexto(''); setDosis(''); setFrecuencia(''); setDuracion(''); setInstrucciones(''); onCreated && onCreated(); }
  };

  return (
    <form onSubmit={submit} className="hosix-prescripcion-form">
      <div>
        <label>Medicamento (texto)</label>
        <input value={medicamentoTexto} onChange={(e) => setMedicamentoTexto(e.target.value)} required />
      </div>
      <div>
        <label>Dosis</label>
        <input value={dosis} onChange={(e) => setDosis(e.target.value)} />
      </div>
      <div>
        <label>Frecuencia</label>
        <input value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} />
      </div>
      <div>
        <label>Duración (días)</label>
        <input type="number" value={duracion as any} onChange={(e) => setDuracion(e.target.value === '' ? '' : Number(e.target.value))} />
      </div>
      <div>
        <label>Instrucciones</label>
        <textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} />
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear Prescripción'}</button>
      </div>
      {error && <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>}
    </form>
  );
};

export default PrescripcionForm;
