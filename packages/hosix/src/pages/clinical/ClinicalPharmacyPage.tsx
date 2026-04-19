import { Link } from 'react-router-dom';

const ClinicalPharmacyPage = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-700 space-y-3">
    <h2 className="text-lg font-semibold text-gray-900">Farmacia</h2>
    <p>
      Próximo paso: montar <code className="text-xs bg-gray-100 px-1 rounded">ASIS_09_Farmacia</code> /{' '}
      <code className="text-xs bg-gray-100 px-1 rounded">ASIS_12_Farmacoterapia</code> con datos de prescripción y stock.
    </p>
    <p>
      Referencia Tryton: <code className="text-xs">tryton/health_stock</code>, módulos de medicación en{' '}
      <code className="text-xs">tryton/health</code>.
    </p>
    <Link className="text-blue-600 hover:underline" to="/hosix/orders">
      Ver órdenes médicas
    </Link>
  </div>
);

export default ClinicalPharmacyPage;
