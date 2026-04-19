import { Link } from 'react-router-dom';

/**
 * Punto de entrada clínico: enlaces a submódulos y recordatorio de flujo (cita → paciente → acto).
 */
const ClinicalHubPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <Link className="text-blue-600 hover:underline text-sm" to="/hosix/dashboard">
          ← Volver al panel
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Área clínica</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Módulos alineados con GNU Health / Tryton (<code className="text-xs bg-gray-100 px-1 rounded">tryton/health_*</code>).
          Cada subruta irá sustituyendo placeholders por formularios conectados a datos y permisos finos.
        </p>
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <li className="border border-gray-100 rounded-lg p-4">
            <strong className="text-gray-900">Obstetricia</strong>
            <p className="text-gray-600 mt-1">Seguimiento de embarazo (requiere contexto de embarazo / paciente).</p>
            <Link className="text-blue-600 hover:underline mt-2 inline-block" to="/hosix/clinical/obstetricia">
              Abrir →
            </Link>
          </li>
          <li className="border border-gray-100 rounded-lg p-4">
            <strong className="text-gray-900">Pediatría / CRED</strong>
            <p className="text-gray-600 mt-1">Crecimiento, vacunas CRED, tamizajes.</p>
            <Link className="text-blue-600 hover:underline mt-2 inline-block" to="/hosix/clinical/pediatria">
              Abrir →
            </Link>
          </li>
          <li className="border border-gray-100 rounded-lg p-4">
            <strong className="text-gray-900">Laboratorio</strong>
            <p className="text-gray-600 mt-1">Órdenes de laboratorio; use paciente desde ficha o parámetro URL.</p>
            <Link className="text-blue-600 hover:underline mt-2 inline-block" to="/hosix/clinical/laboratorio">
              Abrir →
            </Link>
          </li>
          <li className="border border-gray-100 rounded-lg p-4">
            <strong className="text-gray-900">Farmacia</strong>
            <p className="text-gray-600 mt-1">Inventario y dispensación (ASIS farmacia).</p>
            <Link className="text-blue-600 hover:underline mt-2 inline-block" to="/hosix/clinical/farmacia">
              Abrir →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ClinicalHubPage;
