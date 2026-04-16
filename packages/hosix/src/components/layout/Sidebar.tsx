import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../../src/hooks/useApp';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { auth } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Pacientes', path: '/patients', icon: '👥' },
    { label: 'Citas', path: '/appointments', icon: '📅' },
    { label: 'Clínica', path: '/clinical', icon: '📝' },
    { label: 'Órdenes', path: '/orders', icon: '🧪' },
    { label: 'Facturación', path: '/billing', icon: '💰' },
    { label: 'Reportes', path: '/reports', icon: '📈' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">HOSIX</h1>
        <p className="text-gray-400 text-sm mt-1">Healthcare System</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <p className="font-semibold text-gray-300">{auth.user?.nombre_completo}</p>
          <p className="text-xs">{auth.user?.username}</p>
        </div>
      </div>
    </aside>
  );
};
