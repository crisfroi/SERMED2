import { useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '@/hooks/useApp';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('authState');
    localStorage.removeItem('hosix_user');
    localStorage.removeItem('hosix_token');
    navigate('/hosix/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ☰
        </button>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.user?.id}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{auth.user?.nombre_completo}</p>
              <p className="text-xs text-gray-500">{auth.user?.username}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};
