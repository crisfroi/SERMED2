/**
 * HOSIX - Module 14: User Profile Form
 * Componente para editar perfil de usuario
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '@hosix/hooks/shared';
import type { User } from '@sermed2/shared/types';

export interface UserProfileFormProps {
  user?: User;
  onSave?: (user: User) => void;
  onCancel?: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onSave,
  onCancel,
}) => {
  const { auth, addNotification } = useApp();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else if (auth?.user) {
      setFormData(auth.user);
    }
  }, [user, auth?.user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      addNotification('error', 'Por favor complete nombre y apellido');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar a API para guardar perfil
      addNotification('success', 'Perfil actualizado exitosamente');
      onSave?.(formData as User);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al guardar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-xl font-bold text-gray-900">Perfil de Usuario</h2>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={formData.email || ''}
          disabled
          className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
        />
        <p className="text-xs text-gray-500">No se puede cambiar el email</p>
      </div>

      {/* First Name */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName || ''}
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
          value={formData.lastName || ''}
          onChange={handleInputChange}
          placeholder="Tu apellido"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Role (read-only) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium">
          {formData.role || 'N/A'}
        </div>
        <p className="text-xs text-gray-500">Contacta a administración para cambiar tu rol</p>
      </div>

      {/* Permissions (read-only) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Permisos</label>
        <div className="space-y-1">
          {formData.permissions && formData.permissions.length > 0 ? (
            formData.permissions.map((permission) => (
              <div key={permission} className="text-sm text-gray-600">
                ✓ {permission}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Sin permisos especiales</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;
