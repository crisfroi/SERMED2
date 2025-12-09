import React, { useState } from 'react';
import { supabase, executeSupabaseQuery } from '../../../integrations/supabase/client';
import useDispensaciones from '../../../hooks/hosix/useDispensaciones';
import useHosixStock from '../../../hooks/hosix/useHosixStock';
import useHosixMedicamentos from '../../../hooks/hosix/useHosixMedicamentos';

export const DispensacionesManager: React.FC = () => {
  const [prescripcionNumero, setPrescripcionNumero] = useState('');
  const [prescripcion, setPrescripcion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { createDispensacion } = useDispensaciones();
  const { getStockForMedicamento } = useHosixStock();
  const { medicamentos } = useHosixMedicamentos();
  const [cajas, setCajas] = useState<any[]>([]);
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<string | null>(null);
  const [selectedFormaPago, setSelectedFormaPago] = useState<string | null>(null);
  const [dispensadorId, setDispensadorId] = useState<string | null>(null);

  const buscar = async () => {
    setLoading(true);
    try {
      const res = await executeSupabaseQuery(() => supabase.from('hosix_prescripciones').select('*').eq('id', prescripcionNumero).or(`numero.eq.${prescripcionNumero}`), 'prescripcion_lookup');
      if (res.error) throw res.error;
      setPrescripcion(res.data?.[0] ?? null);
    } catch (err) {
      console.error(err);
      setPrescripcion(null);
    } finally { setLoading(false); }
  };

  const loadCajas = async () => {
    const res = await executeSupabaseQuery(() => supabase.from('hosix_cajas').select('*').eq('activo', true), 'cajas_list');
    if (!res.error) setCajas(res.data || []);
    const formas = await executeSupabaseQuery(() => supabase.from('hosix_cajas_formas_pago').select('*').eq('activo', true), 'formas_pago_list');
    if (!formas.error) setFormasPago(formas.data || []);
  };

  React.useEffect(() => { loadCajas(); }, []);

  const dispensar = async () => {
    if (!prescripcion) return;
    setLoading(true);
    try {
      // For simplicity assume medication id present or use medicamento_texto
      const medicamento_id = prescripcion.medicamento_id;
      const cantidad = prescripcion.dosis || 1;
      // compute amount: attempt to find tarifa by medicamento id
      let monto = 0;
      if (medicamento_id) {
        const tarifaRes = await executeSupabaseQuery(() => supabase.from('hosix_tarifas').select('precio').eq('codigo_concepto', medicamento_id).limit(1), 'tarifa_lookup');
        if (!tarifaRes.error && tarifaRes.data?.[0]?.precio) {
          monto = Number(tarifaRes.data[0].precio) * Number(cantidad);
        }
      }

      const res = await createDispensacion({ prescripcion_id: prescripcion.id, prescripcion_numero: prescripcion.numero || prescripcion.id, medicamento_id: prescripcion.medicamento_id, medicamento_texto: prescripcion.medicamento_texto, cantidad_dispensada: Number(cantidad), dispensador_id: null, cantidad_a_facturar: monto, caja_id: null });
      if (res.error) {
        console.error('Error dispensing', res.error);
      } else {
        // reload prescripcion if needed
        setPrescripcion(null);
        setPrescripcionNumero('');
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="hosix-dispensaciones-manager">
      <header>
        <h3>Dispensaciones - Farmacia</h3>
      </header>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Número de receta o ID" value={prescripcionNumero} onChange={(e) => setPrescripcionNumero(e.target.value)} />
        <button onClick={buscar} disabled={loading}>Buscar</button>
      </div>

      {loading && <p>Procesando...</p>}
      {prescripcion && (
        <div>
          <h4>Receta</h4>
          <div>Paciente: {prescripcion.paciente_id}</div>
          <div>Medicamento: {prescripcion.medicamento_texto ?? prescripcion.medicamento_id}</div>
          <div>Dosis: {prescripcion.dosis}</div>
          <div>Prescriptor: {prescripcion.prescriptor_id}</div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginRight: '0.5rem' }}>Caja</label>
              <select value={selectedCaja ?? ''} onChange={(e) => setSelectedCaja(e.target.value || null)}>
                <option value="">-- Seleccionar --</option>
                {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>)}
              </select>
              <label style={{ marginLeft: '1rem', marginRight: '0.5rem' }}>Forma pago</label>
              <select value={selectedFormaPago ?? ''} onChange={(e) => setSelectedFormaPago(e.target.value || null)}>
                <option value="">-- Seleccionar --</option>
                {formasPago.map(f => <option key={f.id} value={f.codigo}>{f.nombre}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label>Dispensador (user id)</label>
              <input value={dispensadorId ?? ''} onChange={(e) => setDispensadorId(e.target.value || null)} placeholder="UUID usuario" />
            </div>

            <button onClick={async () => {
              // quick stock check
              if (prescripcion.medicamento_id) {
                const stock = await getStockForMedicamento(prescripcion.medicamento_id);
                alert(`Stock disponible: ${stock.data?.cantidad_disponible ?? 'N/A'}`);
              }
            }}>Comprobar stock</button>
            <button onClick={async () => {
              // call createDispensacion with caja/forma/dispensador
              setLoading(true);
              try {
                const cantidad = Number(prescripcion.dosis || 1);
                // determine monto (simple heuristic, may be refined)
                let monto = 0;
                if (prescripcion.medicamento_id) {
                  const tarifaRes = await executeSupabaseQuery(() => supabase.from('hosix_tarifas').select('precio').eq('codigo_concepto', prescripcion.medicamento_id).limit(1), 'tarifa_lookup');
                  if (!tarifaRes.error && tarifaRes.data?.[0]?.precio) monto = Number(tarifaRes.data[0].precio) * cantidad;
                }
                const res = await createDispensacion({ prescripcion_id: prescripcion.id, prescripcion_numero: prescripcion.numero || prescripcion.id, medicamento_id: prescripcion.medicamento_id, medicamento_texto: prescripcion.medicamento_texto, cantidad_dispensada: cantidad, dispensador_id: dispensadorId || null, cantidad_a_facturar: monto, caja_id: selectedCaja || null, forma_pago: selectedFormaPago || null });
                if (res.error) alert('Error al dispensar: ' + JSON.stringify(res.error));
                else {
                  alert('Dispensación creada');
                  setPrescripcion(null);
                  setPrescripcionNumero('');
                }
              } finally { setLoading(false); }
            }} style={{ marginLeft: '0.5rem' }} disabled={loading}>Dispensar y Cobrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensacionesManager;

