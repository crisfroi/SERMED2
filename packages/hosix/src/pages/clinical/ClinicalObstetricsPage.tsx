import { Link } from 'react-router-dom';

/** Paso intermedio: pantallas con hooks obstétricos requieren `pregnancyId`; se enlaza desde episodio/embarazo. */
const ClinicalObstetricsPage = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-700 space-y-3">
    <h2 className="text-lg font-semibold text-gray-900">Obstetricia</h2>
    <p>
      Los componentes ASIS (p. ej. <code className="text-xs bg-gray-100 px-1 rounded">GestationMonitor</code>) esperan un{' '}
      <strong>identificador de embarazo</strong>. En la siguiente iteración se enlazará desde la ficha de la gestante o
      desde admisión obstétrica.
    </p>
    <p>
      Referencia Tryton: <code className="text-xs">tryton/health_gyneco</code>,{' '}
      <code className="text-xs">tryton/health</code>.
    </p>
    <Link className="text-blue-600 hover:underline" to="/hosix/patients">
      Ir a pacientes
    </Link>
  </div>
);

export default ClinicalObstetricsPage;
