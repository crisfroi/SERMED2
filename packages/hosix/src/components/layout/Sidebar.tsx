import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useApp';
import { filterHosixMenuByRole, HOSIX_MENU_ITEMS } from '@hosix/config/hosixMenu';

interface SidebarProps {
  isOpen: boolean;
}

/**
 * Rutas relativas al prefijo `/hosix/*` (ver App.tsx + HosixRoutes).
 * No usar rutas absolutas tipo `/dashboard`: sacan al usuario del árbol Hosix y producen 404.
 */

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const { auth } = useAuth();

  const menuItems = useMemo(
    () => filterHosixMenuByRole(HOSIX_MENU_ITEMS, auth.user?.role),
    [auth.user?.role]
  );

  const hosixProfile = useMemo(() => {
    try {
      const raw = localStorage.getItem('hosix_user');
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, string | undefined>;
    } catch {
      return null;
    }
  }, [auth.user?.id]);

  const displayName =
    auth.user?.nombre_completo ?? hosixProfile?.nombre_completo ?? hosixProfile?.email ?? 'Usuario Hosix';
  const displayLogin = auth.user?.username ?? hosixProfile?.email ?? hosixProfile?.username ?? '';

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">HOSIX</h1>
        <p className="text-gray-400 text-sm mt-1">Healthcare System</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <p className="font-semibold text-gray-300">{displayName}</p>
          {displayLogin ? <p className="text-xs">{displayLogin}</p> : null}
        </div>
      </div>
    </aside>
  );
};
