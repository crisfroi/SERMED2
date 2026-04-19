/**
 * HOSIX - Module 14: Password Reset Form
 * Componente para resetear contraseña
 */

import React, { useState } from 'react';
import { useApp } from '@hosix/hooks/shared';
import { validateEmail, validatePassword } from '@sermed2/shared/utils/validators';

export interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
  onBackClick?: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token,
  onSuccess,
  onBackClick,
}) => {
  const { addNotification } = useApp();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      addNotification('error', 'Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar a edge function para enviar email de reset
      addNotification('success', 'Email de reset enviado. Revisa tu correo.');
      setStep('reset');
    } catch (error: any) {
      addNotification('error', error.message || 'Error al enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordErrors.length > 0) {
      addNotification('error', 'La contraseña no cumple con los requisitos');
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification('error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar a edge function para reset password
      addNotification('success', 'Contraseña actualizada. Por favor inicia sesión.');
      onSuccess?.();
    } catch (error: any) {
      addNotification('error', error.message || 'Error al resetear contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={step === 'email' ? handleEmailSubmit : handleResetSubmit}
      className="space-y-4 w-full max-w-md"
    >
      <h2 className="text-xl font-bold text-gray-900">
        {step === 'email' ? 'Resetear Contraseña' : 'Nueva Contraseña'}
      </h2>

      {step === 'email' ? (
        <>
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? 'Enviando...' : 'Enviar link de reset'}
          </button>
        </>
      ) : (
        <>
          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                const { errors } = validatePassword(e.target.value);
                setPasswordErrors(errors);
              }}
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </>
      )}

      {/* Back Button */}
      <button
        type="button"
        onClick={onBackClick}
        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
      >
        Volver
      </button>
    </form>
  );
};

export default PasswordResetForm;
