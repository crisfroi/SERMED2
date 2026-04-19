/**

 * HOSIX - FASE 3 Module 14: Advanced Authentication & Authorization

 * Componentes para login mejorado, registro, reset de contraseña, y RBAC

 */



import React, { useState } from 'react';

import { useApp } from '@hosix/hooks/shared';

import { loginViaHosixEdgeFunction } from '@hosix/services/auth';
import { mapHosixApiUserToContextUser } from '@hosix/utils/mapHosixApiUserToContextUser';



export interface EnhancedLoginFormProps {

  onSuccess?: () => void;

  showRegisterLink?: boolean;

  onRegisterClick?: () => void;

}



export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({

  onSuccess,

  showRegisterLink = true,

  onRegisterClick,

}) => {

  const { setAuth, addNotification } = useApp();

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();



    if (!username.trim() || !password.trim()) {

      addNotification({ type: 'error', message: 'Por favor complete todos los campos' });

      return;

    }



    setIsLoading(true);



    try {

      const result = await loginViaHosixEdgeFunction(username, password);



      if (result) {

        // Sesión Hosix: solo usuario en localStorage. Supabase Hosix usa VITE_HOSIX_SUPABASE_ANON_KEY del build, no JWT de usuario.
        localStorage.removeItem('hosix_token');
        localStorage.setItem('hosix_user', JSON.stringify(result.user));

        const mapped = mapHosixApiUserToContextUser(result.user as unknown as Record<string, unknown>);

        // Si "recordarme" está activado

        if (rememberMe) {

          localStorage.setItem('rememberMe', 'true');

          localStorage.setItem('rememberedUsername', username);

        }



        // Actualizar estado global

        setAuth({

          user: mapped,

          isAuthenticated: true,

          isLoading: false,

          error: null,

        });



        addNotification({
          type: 'success',
          message: `Bienvenido, ${mapped.nombre_completo}!`,
        });

        onSuccess?.();

      }

    } catch (error: any) {

      addNotification({ type: 'error', message: error.message || 'Error al iniciar sesión' });

    } finally {

      setIsLoading(false);

    }

  };



  return (

    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">

      {/* Username */}

      <div className="space-y-2">

        <label htmlFor="username" className="block text-sm font-medium text-gray-700">

          Usuario

        </label>

        <input

          id="username"

          type="text"

          value={username}

          onChange={(e) => setUsername(e.target.value)}

          placeholder="Tu usuario"

          disabled={isLoading}

          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

        />

      </div>



      {/* Password */}

      <div className="space-y-2">

        <label htmlFor="password" className="block text-sm font-medium text-gray-700">

          Contraseña

        </label>

        <div className="relative">

          <input

            id="password"

            type={showPassword ? 'text' : 'password'}

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            placeholder="Tu contraseña"

            disabled={isLoading}

            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

          />

          <button

            type="button"

            onClick={() => setShowPassword(!showPassword)}

            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"

          >

            {showPassword ? '👁️' : '🙈'}

          </button>

        </div>

      </div>



      {/* Remember Me */}

      <div className="flex items-center">

        <input

          id="rememberMe"

          type="checkbox"

          checked={rememberMe}

          onChange={(e) => setRememberMe(e.target.checked)}

          disabled={isLoading}

          className="h-4 w-4 text-blue-600 border-gray-300 rounded"

        />

        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">

          Recordarme

        </label>

      </div>



      {/* Submit Button */}

      <button

        type="submit"

        disabled={isLoading}

        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"

      >

        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}

      </button>



      {/* Links */}

      <div className="flex justify-between text-xs text-blue-600">

        <a href="#forgot-password" className="hover:underline">

          ¿Olvidaste tu contraseña?

        </a>

        {showRegisterLink && (

          <button

            type="button"

            onClick={onRegisterClick}

            className="hover:underline text-blue-600"

          >

            Crear cuenta

          </button>

        )}

      </div>

    </form>

  );

};



export default EnhancedLoginForm;

