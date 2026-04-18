import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    try {
      const hosixUrl = import.meta.env.VITE_HOSIX_SUPABASE_URL || 'https://dfqefbkxounzmtggnfsc.supabase.co';
      const hosixKey = import.meta.env.VITE_HOSIX_SUPABASE_ANON_KEY;

      console.log('🔐 HOSIX Login - Attempting auth...');

      const response = await fetch(
        `${hosixUrl}/functions/v1/hosix-auth-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hosixKey}`,
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (data && data.success && data.user) {
        console.log('✅ Login successful!');
        localStorage.setItem('hosix_user', JSON.stringify(data.user));
        localStorage.setItem('hosix_token', data.token || '');
        navigate('/hosix/dashboard');
      } else if (data) {
        setError(data.error || data.message || 'Login falló');
      } else {
        setError('No se recibió respuesta válida del servidor');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        width: '100%',
        maxWidth: '28rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            HOSIX
          </h1>
          <p style={{ color: '#4b5563', margin: 0 }}>Healthcare Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem',
            }}>
              Email
            </label>
            <input
              type="email"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="admin@hosix.com"
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#2563eb',
              color: 'white',
              fontWeight: '500',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '1rem',
            }}
          >
            {loading ? 'Conectando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          color: '#4b5563',
          textAlign: 'center',
        }}>
          <p style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Demo credentials:</p>
          <small>Email: admin@hosix.com</small>
          <br />
          <small>Contraseña: Admin@Hosix123</small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;