/**
 * @file LoginForm.tsx
 * @module 00-core/auth
 * @description HOSIX - Componente de Login con 2FA
 * Maneja autenticación con email/password y detecta si requiere 2FA
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { useAuth2FA } from '@/hooks/useAuth2FA';

export interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login, requiresTwoFA, setTempSessionId } = useAuth2FA();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validación básica
      if (!credentials.email.trim()) {
        setError('El email es requerido');
        setIsLoading(false);
        return;
      }

      if (!credentials.password.trim()) {
        setError('La contraseña es requerida');
        setIsLoading(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        setError('Por favor ingresa un email válido');
        setIsLoading(false);
        return;
      }

      // Llamar a login
      const result = await login(credentials.email, credentials.password);

      if (result.success) {
        // Guardar preferencia de "recordarme"
        if (rememberMe) {
          localStorage.setItem('hosix_remember_email', credentials.email);
        } else {
          localStorage.removeItem('hosix_remember_email');
        }

        // Si requiere 2FA, no navegamos - esperamos a que el usuario vea el componente de 2FA
        if (result.requiresTwoFA) {
          setTempSessionId(result.tempSessionId);
          // El componente padre debe detectar requiresTwoFA y mostrar VerifyTwoFA
        } else {
          // Login exitoso sin 2FA, redirect al dashboard
          onLoginSuccess?.();
          navigate('/hosix/dashboard');
        }
      } else {
        setError(result.error || 'Error en autenticación. Verifica tus credenciales.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    }}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">🏥 HOSIX</div>
            <p className="text-gray-600">Healthcare Management System</p>
          </div>
          <CardTitle className="text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Accede a tu cuenta HOSIX
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={credentials.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full"
                aria-label="Email address"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full"
                aria-label="Password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Recuérdame en este dispositivo
              </label>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>

            {/* Links */}
            <div className="text-center space-y-2 text-sm">
              <a href="#forgot" className="text-blue-600 hover:underline block">
                ¿Olvidaste tu contraseña?
              </a>
              <p className="text-gray-600">
                ¿No tienes cuenta?{' '}
                <a href="#signup" className="text-blue-600 hover:underline">
                  Contacta al administrador
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
