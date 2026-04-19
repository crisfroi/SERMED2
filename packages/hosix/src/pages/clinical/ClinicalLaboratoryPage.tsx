import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hosixSupabase } from '@hosix/integrations/supabase/client';
import LabOrderForm from '@hosix/components/ASIS_08_Laboratorio/LabOrderForm';

/**
 * Formulario de orden de laboratorio cuando hay `?patientId=` (p. ej. desde ficha paciente).
 */
const ClinicalLaboratoryPage = () => {
  const [search] = useSearchParams();
  const patientId = search.get('patientId') || '';
  const [patientName, setPatientName] = useState('Paciente');

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await hosixSupabase
        .from('hosix_pacientes')
        .select('primer_nombre, segundo_nombre, primer_apellido, segundo_apellido')
        .eq('id', patientId)
        .maybeSingle();
      if (cancelled || !data) return;
      const d = data as Record<string, string | null>;
      const name = [d.primer_nombre, d.segundo_nombre, d.primer_apellido, d.segundo_apellido]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (name) setPatientName(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <Link className="text-blue-600 hover:underline" to="/hosix/clinical">
          ← Resumen clínica
        </Link>
        {' · '}
        <Link className="text-blue-600 hover:underline" to="/hosix/patients">
          Pacientes
        </Link>
      </div>

      {!patientId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium">Seleccione un paciente</p>
          <p className="mt-1">
            Abra una{' '}
            <Link className="underline" to="/hosix/patients">
              ficha de paciente
            </Link>{' '}
            y use el enlace &quot;Nueva orden de laboratorio&quot;, o añada{' '}
            <code className="text-xs">?patientId=&lt;uuid&gt;</code> a la URL.
          </p>
        </div>
      ) : (
        <LabOrderForm patientId={patientId} patientName={patientName} />
      )}
    </div>
  );
};

export default ClinicalLaboratoryPage;
