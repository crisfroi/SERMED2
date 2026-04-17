import { useAuth } from '../hooks/useApp';

const DashboardPage = () => {
  const { auth } = useAuth();
  
  // Obtener información del usuario
  const userRole = auth.user?.role || 'PUBLICO';
  const hospitalName = auth.user?.hospital_nombre || 'Hospital Central';
  const userName = auth.user?.nombre_completo || 'Usuario';

  // Dashboards específicos por rol
  const renderDashboardByRole = () => {
    switch (userRole) {
      case 'SUPER_ADMINISTRADOR':
        return <SuperAdminDashboard hospitalName={hospitalName} />;
      case 'DIRECTOR_HOSPITAL':
        return <DirectorDashboard hospitalName={hospitalName} />;
      case 'PROFESIONAL':
        return <ProfesionalDashboard hospitalName={hospitalName} />;
      case 'GESTOR_ADMINISTRATIVO':
        return <GestorAdminDashboard hospitalName={hospitalName} />;
      default:
        return <DefaultDashboard hospitalName={hospitalName} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-lg text-white">
        <h1 className="text-4xl font-bold mb-2">
          Bienvenido, {userName}
        </h1>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-blue-100 text-sm">Sistema de Gestión de Salud</p>
            <p className="text-2xl font-semibold">{hospitalName}</p>
          </div>
          <div className="bg-blue-500 px-4 py-2 rounded-lg">
            <p className="text-sm text-blue-100">Rol:</p>
            <p className="font-bold text-lg">{userRole.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {renderDashboardByRole()}
    </div>
  );
};

// ============================================================================
// SUPER_ADMINISTRADOR - Acceso a todo
// ============================================================================
const SuperAdminDashboard = ({ hospitalName }: { hospitalName: string }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon="🏥" label="Hospitales" value="3" color="blue" />
      <StatCard icon="👥" label="Usuarios" value="7" color="green" />
      <StatCard icon="👨‍⚕️" label="Profesionales" value="24" color="purple" />
      <StatCard icon="⚙️" label="Edge Functions" value="54+" color="orange" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Panel de Control</h2>
        <ul className="space-y-3">
          <li className="flex items-center p-3 bg-blue-50 rounded">
            <span className="text-green-600 mr-3">✓</span>
            <span>Ver todos los hospitales</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded">
            <span className="text-green-600 mr-3">✓</span>
            <span>Gestionar usuarios y roles</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded">
            <span className="text-green-600 mr-3">✓</span>
            <span>Ver auditoría del sistema</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded">
            <span className="text-green-600 mr-3">✓</span>
            <span>Configurar RLS policies</span>
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Estadísticas Globales</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Pacientes totales:</span>
            <span className="font-bold text-lg">1,243</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Citas programadas:</span>
            <span className="font-bold text-lg">248</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Procedimientos:</span>
            <span className="font-bold text-lg">89</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// DIRECTOR_HOSPITAL - Gestión del hospital
// ============================================================================
const DirectorDashboard = ({ hospitalName }: { hospitalName: string }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon="👥" label="Pacientes" value="245" color="blue" />
      <StatCard icon="👨‍⚕️" label="Profesionales" value="12" color="green" />
      <StatCard icon="🛏️" label="Camas" value="45/52" color="purple" />
      <StatCard icon="⚠️" label="Alertas" value="3" color="orange" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏥 Gestión de {hospitalName}</h2>
        <ul className="space-y-3">
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">📋</span>
            <span>Registro de pacientes</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">👥</span>
            <span>Gestionar profesionales</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">📊</span>
            <span>Reportes y estadísticas</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">⚙️</span>
            <span>Configuración del hospital</span>
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Ocupación de Camas</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Piso 1 - Obstétrica</span>
              <span className="text-sm font-bold">8/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Piso 2 - Pediatría</span>
              <span className="text-sm font-bold">12/15</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Piso 3 - Cirugía</span>
              <span className="text-sm font-bold">5/12</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// PROFESIONAL - Módulos clínicos
// ============================================================================
const ProfesionalDashboard = ({ hospitalName }: { hospitalName: string }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon="👥" label="Mis Pacientes" value="18" color="blue" />
      <StatCard icon="📅" label="Citas Hoy" value="6" color="green" />
      <StatCard icon="📝" label="Pendientes" value="4" color="purple" />
      <StatCard icon="✅" label="Completados" value="12" color="orange" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔬 Módulos Clínicos</h2>
        <ul className="space-y-3">
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">🤰</span>
            <span>Obstétrica</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">👶</span>
            <span>Pediatría</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">💊</span>
            <span>Farmacología</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">🩻</span>
            <span>Imagenología</span>
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Mis Pacientes Hoy</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
            <p className="font-medium text-gray-900">Sofía Martínez García</p>
            <p className="text-sm text-gray-600">Cita a las 9:00 AM</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
            <p className="font-medium text-gray-900">María Consuelo Rodríguez</p>
            <p className="text-sm text-gray-600">Control embarazo - 10:30 AM</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
            <p className="font-medium text-gray-900">Andrés Yánez López</p>
            <p className="text-sm text-gray-600">Seguimiento - 2:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// GESTOR_ADMINISTRATIVO - Gestión administrativa
// ============================================================================
const GestorAdminDashboard = ({ hospitalName }: { hospitalName: string }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon="📊" label="Facturación" value="$125,450" color="blue" />
      <StatCard icon="💼" label="Nóminas" value="42 empleados" color="green" />
      <StatCard icon="📦" label="Inventario" value="1,234 items" color="purple" />
      <StatCard icon="📑" label="Reportes" value="12" color="orange" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💼 Gestión Administrativa</h2>
        <ul className="space-y-3">
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">💰</span>
            <span>Facturación y cobros</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">👨‍💼</span>
            <span>Nómina de empleados</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">📦</span>
            <span>Gestión de inventario</span>
          </li>
          <li className="flex items-center p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
            <span className="text-blue-600 mr-3">📄</span>
            <span>Reportes y auditoría</span>
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💵 Resumen Financiero</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
            <span>Ingresos mes:</span>
            <span className="font-bold text-lg text-green-600">$125,450</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
            <span>Gastos mes:</span>
            <span className="font-bold text-lg text-orange-600">$87,320</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span>Balance:</span>
            <span className="font-bold text-lg text-blue-600">$38,130</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// DEFAULT - Dashboard genérico
// ============================================================================
const DefaultDashboard = ({ hospitalName }: { hospitalName: string }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon="👥" label="Pacientes" value="245" color="blue" />
      <StatCard icon="📅" label="Citas" value="89" color="green" />
      <StatCard icon="📊" label="Reportes" value="12" color="purple" />
      <StatCard icon="⚡" label="Activo" value="100%" color="orange" />
    </div>

    <div className="bg-white p-8 rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido a HOSIX</h2>
      <p className="text-gray-600 mb-6">
        Sistema de Gestión de Salud con Edge Functions desplegadas y RLS Policies activas
      </p>
      <div className="inline-block bg-blue-50 p-6 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-2">Tu rol permite acceso a:</p>
        <p className="text-lg font-semibold text-blue-600">Módulos según configuración</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// Componentes reutilizables
// ============================================================================
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) => {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`${colorMap[color as keyof typeof colorMap]} p-6 rounded-lg shadow border`}>
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default DashboardPage;
