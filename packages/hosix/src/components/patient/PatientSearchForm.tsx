/**
 * HOSIX - FASE 3 Module 15: Patient Management
 * Componentes para gestión integral de pacientes
 */

import React, { useState } from 'react';
import { useApp } from '@hosix/hooks/shared';
import { supabaseDb } from '@sermed2/shared/services/supabaseClient';
import { validateEmail } from '@sermed2/shared/utils/validators';
import type { Patient } from '@sermed2/shared/types';

export interface PatientSearchFormProps {
  onSearchResults?: (patients: Patient[]) => void;
  onPatientSelect?: (patient: Patient) => void;
}

export const PatientSearchForm: React.FC<PatientSearchFormProps> = ({
  onSearchResults,
  onPatientSelect,
}) => {
  const { addNotification } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'email' | 'phone' | 'id'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      addNotification('error', 'Por favor ingresa un término de búsqueda');
      return;
    }

    setIsLoading(true);

    try {
      let query = supabaseDb.query('electronic_health_record', '*');

      switch (searchType) {
        case 'name':
          // Buscar por nombre o apellido
          const nameQuery = await supabaseDb.query(
            'electronic_health_record',
            '*',
            { first_name: searchQuery }
          );
          setResults(nameQuery.data || []);
          break;

        case 'email':
          if (!validateEmail(searchQuery)) {
            addNotification('error', 'Email inválido');
            return;
          }
          const emailQuery = await supabaseDb.query(
            'electronic_health_record',
            '*',
            { email: searchQuery }
          );
          setResults(emailQuery.data || []);
          break;

        case 'phone':
          const phoneQuery = await supabaseDb.query(
            'electronic_health_record',
            '*',
            { phone: searchQuery }
          );
          setResults(phoneQuery.data || []);
          break;

        case 'id':
          const idQuery = await supabaseDb.query(
            'electronic_health_record',
            '*',
            { id: searchQuery }
          );
          setResults(idQuery.data || []);
          break;
      }

      setShowResults(true);
      onSearchResults?.(results);

      if (results.length === 0) {
        addNotification('warning', 'No se encontraron pacientes');
      } else {
        addNotification(
          'success',
          `Se encontraron ${results.length} paciente(s)`
        );
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Error al buscar pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          {/* Search Type Selector */}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Nombre</option>
            <option value="email">Email</option>
            <option value="phone">Teléfono</option>
            <option value="id">ID</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar por ${searchType}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {results.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onPatientSelect?.(patient)}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
            >
              <div className="font-medium text-gray-900">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="text-sm text-gray-600">
                {patient.email && <span>{patient.email} | </span>}
                {patient.phone && <span>{patient.phone}</span>}
              </div>
              <div className="text-xs text-gray-500">
                ID: {patient.id} | DOB: {patient.dateOfBirth}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearchForm;
