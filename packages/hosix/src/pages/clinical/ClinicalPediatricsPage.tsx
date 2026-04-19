import { Link } from 'react-router-dom';

const ClinicalPediatricsPage = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-700 space-y-3">
    <h2 className="text-lg font-semibold text-gray-900">Pediatría / CRED</h2>
    <p>
      Aquí se integrarán <code className="text-xs bg-gray-100 px-1 rounded">ASIS_05_CRED</code> y crecimiento (vistas y
      datos por paciente pediátrico).
    </p>
    <p>
      Referencia Tryton: <code className="text-xs">tryton/health_pediatrics</code>,{' '}
      <code className="text-xs">tryton/health_pediatrics_growth_charts</code>.
    </p>
    <Link className="text-blue-600 hover:underline" to="/hosix/patients">
      Ir a pacientes
    </Link>
  </div>
);

export default ClinicalPediatricsPage;
