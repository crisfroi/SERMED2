/**
 * HOSIX - Module 14: Registration Form
 * Componente para registro de nuevos usuarios
 */

import React, { useState } from 'react';
import { useApp } from '@hosix/hooks/shared/useApp';
import {
  validateEmail,
  validatePassword,
  validatePhone,
} from '@sermed2/shared/utils/validators';

export interface RegistrationFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onLoginClick,
}) => {
  const { addNotification } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Validar contraseña en tiempo real
    if (name === 'password') {
      const { errors } = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const { firstName, lastName, email, password, passwordConfirm, agreeTerms } = formData;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      addNotification('error', 'Por favor complete los campos requeridos');
      return;
    }

    if (!validateEmail(email)) {
      addNotification('error', 'Email inválido');
      return;
    }

    if (passwordErrors.length > 0) {
      addNotification('error', 'La contraseña no cumple con los requisitos');
      return;
    }

    if (password !== passwordConfirm) {
      addNotification('error', 'Las contraseñas no coinciden');
      return;
    }

    if (!agreeTerms) {
      addNotification('error', 'Debe aceptar los términos y condiciones');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar a edge function de registro
      // const response = await fetch(...)
      addNotification('success', 'Registro completado. Por favor inicia sesión');
      onSuccess?.();
    } catch (error: any) {
      addNotification('error', error.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {/* First Name */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleInputChange}
          placeholder="Tu nombre"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Apellido
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleInputChange}
          placeholder="Tu apellido"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="tu@email.com"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Teléfono (opcional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+1234567890"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Mínimo 8 caracteres"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {passwordErrors.length > 0 && (
          <ul className="text-xs text-red-600 space-y-1">
            {passwordErrors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
          Confirmar contraseña
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          value={formData.passwordConfirm}
          onChange={handleInputChange}
          placeholder="Repite tu contraseña"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Agree Terms */}
      <div className="flex items-start">
        <input
          id="agreeTerms"
          name="agreeTerms"
          type="checkbox"
          checked={formData.agreeTerms}
          onChange={handleInputChange}
          disabled={isLoading}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"
        />
        <label htmlFor="agreeTerms" className="ml-2 text-xs text-gray-600">
          Acepto los términos y condiciones, y la política de privacidad
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400"
      >
        {isLoading ? 'Registrando...' : 'Crear cuenta'}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onLoginClick}
          className="text-blue-600 hover:underline"
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
};

export default RegistrationForm;
