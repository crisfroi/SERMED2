import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../hooks/useApp';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the hosix-auth-login edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hosix-auth-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (data.success && data.user) {
        setAuth({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: '¡Login exitoso!',
          duration: 2000,
        });

        navigate('/dashboard');
      } else {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: data.error || 'Error en el login',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Error al conectar con el servidor',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HOSIX</h1>
          <p className="text-gray-600">Healthcare Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Ingrese su usuario"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Ingrese su contraseña"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !credentials.username || !credentials.password}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Demo credentials:
            <br />
            Usuario: <code className="bg-gray-100 px-2 py-1 rounded text-xs">admin</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
