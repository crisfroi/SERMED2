/**
 * HOSIX - Module 15: Patient Demographics Form
 * Formulario para editar demografía del paciente
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '@hosix/hooks/shared/useApp';
import { validateEmail, validatePhone } from '@sermed2/shared/utils/validators';
import type { Patient } from '@sermed2/shared/types';

export interface PatientDemographicsFormProps {
  patient?: Patient;
  onSave?: (patient: Patient) => void;
  onCancel?: () => void;
}

export const PatientDemographicsForm: React.FC<PatientDemographicsFormProps> = ({
  patient,
  onSave,
  onCancel,
}) => {
  const { addNotification } = useApp();
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    }
  }, [patient]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      addNotification('error', 'Nombre y apellido son requeridos');
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      addNotification('error', 'Email inválido');
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      addNotification('error', 'Teléfono inválido');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Llamar a API para guardar
      addNotification('success', 'Demografía del paciente actualizada');
      onSave?.(formData as Patient);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al guardar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Demografía del Paciente</h2>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              placeholder="Nombre"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Apellido *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              placeholder="Apellido"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Fecha de Nacimiento *
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Género *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Información de Contacto</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="+1234567890"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleInputChange}
            placeholder="Calle, número, ciudad"
            disabled={isLoading}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
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

export default PatientDemographicsForm;
