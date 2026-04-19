import { Link } from 'react-router-dom';

export interface ModulePlaceholderPageProps {
  title: string;
  description?: string;
  trytonRefs?: string[];
}

/**
 * Vista intermedia v2: ruta registrada y accesible; el contenido operativo se integra por fases
 * (ver docs/implementacion version 2).
 */
const ModulePlaceholderPage = ({
  title,
  description,
  trytonRefs = [],
}: ModulePlaceholderPageProps) => {
  return (
    <div className="max-w-4xl space-y-6 text-gray-800">
      <div>
        <Link className="text-blue-600 hover:underline text-sm" to="/hosix/dashboard">
          ← Volver al panel
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
        <p className="mt-4 text-sm text-gray-500">
          Ruta activa en Hosix. La lógica de negocio, datos y pruebas E2E se alinean con el plan en{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">packages/hosix/docs/implementacion version 2</code>.
        </p>
        {trytonRefs.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">Referencia Tryton (GNU Health) en este repo:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-0.5">
              {trytonRefs.map((r) => (
                <li key={r}>
                  <code className="text-xs bg-gray-50 px-1 rounded">{r}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ModulePlaceholderPage;
