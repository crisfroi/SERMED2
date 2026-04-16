import { useAuth } from '../hooks/useApp';

const DashboardPage = () => {
  const { auth } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {auth.user?.nombre_completo}
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema de Gestión de Salud - HOSIX
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-blue-600 text-3xl mb-2">👥</div>
          <p className="text-gray-600 text-sm">Pacientes</p>
          <p className="text-2xl font-bold text-gray-900">245</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-green-600 text-3xl mb-2">📅</div>
          <p className="text-gray-600 text-sm">Citas Hoy</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-purple-600 text-3xl mb-2">📝</div>
          <p className="text-gray-600 text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-orange-600 text-3xl mb-2">💰</div>
          <p className="text-gray-600 text-sm">Facturación</p>
          <p className="text-2xl font-bold text-gray-900">$45,200</p>
        </div>
      </div>

      {/* Placeholder sections for future modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Citas</h2>
          <div className="text-gray-500 italic">Módulo 18 - En desarrollo...</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="text-gray-500 italic">Módulo 21 - En desarrollo...</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
