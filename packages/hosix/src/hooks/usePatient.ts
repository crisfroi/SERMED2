/**
 * HOSIX - Module 15: usePatient Hook
 * Hook para gestión de datos de pacientes
 */

import { useState, useCallback } from 'react';
import { supabaseDb } from '@sermed2/shared/services/supabaseClient';
import { useApp } from './useApp';
import type { Patient, MedicalRecord, Appointment } from '@sermed2/shared/types';

export function usePatient() {
  const { addNotification } = useApp();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);

  /**
   * Obtener lista de pacientes con paginación
   */
  const fetchPatients = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const { data, count } = await supabaseDb.query(
          'electronic_health_record',
          '*'
        );

        setPatients(data || []);
        setTotalPatients(count || 0);
      } catch (error: any) {
        addNotification('error', 'Error al cargar pacientes');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Obtener detalles de un paciente
   */
  const fetchPatientDetails = useCallback(
    async (patientId: string) => {
      setIsLoading(true);
      try {
        const { data } = await supabaseDb.query(
          'electronic_health_record',
          '*',
          { id: patientId }
        );

        if (data && data.length > 0) {
          setCurrentPatient(data[0]);
          // Opcionalmente cargar registros médicos y citas
          await fetchMedicalRecords(patientId);
          await fetchAppointments(patientId);
        }
      } catch (error: any) {
        addNotification('error', 'Error al cargar detalles del paciente');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Buscar pacientes
   */
  const searchPatients = useCallback(
    async (query: string, type: 'name' | 'email' | 'phone' | 'id') => {
      setIsLoading(true);
      try {
        let filterKey = type;
        if (type === 'name') filterKey = 'first_name';

        const { data } = await supabaseDb.query(
          'electronic_health_record',
          '*',
          { [filterKey]: query }
        );

        setPatients(data || []);
        return data || [];
      } catch (error: any) {
        addNotification('error', 'Error al buscar pacientes');
        console.error(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Crear nuevo paciente
   */
  const createPatient = useCallback(
    async (patientData: Partial<Patient>) => {
      setIsLoading(true);
      try {
        const { data } = await supabaseDb.create(
          'electronic_health_record',
          patientData
        );

        if (data && data.length > 0) {
          addNotification('success', 'Paciente creado exitosamente');
          return data[0];
        }
      } catch (error: any) {
        addNotification('error', 'Error al crear paciente');
        console.error(error);
      } finally {
        setIsLoading(false);
      }

      return null;
    },
    [addNotification]
  );

  /**
   * Actualizar datos del paciente
   */
  const updatePatient = useCallback(
    async (patientId: string, updates: Partial<Patient>) => {
      setIsLoading(true);
      try {
        const { data } = await supabaseDb.update(
          'electronic_health_record',
          patientId,
          updates
        );

        if (data && data.length > 0) {
          if (currentPatient?.id === patientId) {
            setCurrentPatient(data[0]);
          }
          addNotification('success', 'Paciente actualizado exitosamente');
          return data[0];
        }
      } catch (error: any) {
        addNotification('error', 'Error al actualizar paciente');
        console.error(error);
      } finally {
        setIsLoading(false);
      }

      return null;
    },
    [addNotification, currentPatient?.id]
  );

  /**
   * Eliminar paciente
   */
  const deletePatient = useCallback(
    async (patientId: string) => {
      setIsLoading(true);
      try {
        await supabaseDb.delete('electronic_health_record', patientId);
        addNotification('success', 'Paciente eliminado exitosamente');
        setCurrentPatient(null);
      } catch (error: any) {
        addNotification('error', 'Error al eliminar paciente');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Obtener registros médicos del paciente
   */
  const fetchMedicalRecords = useCallback(
    async (patientId: string) => {
      try {
        const { data } = await supabaseDb.query(
          'medical_records',
          '*',
          { patient_id: patientId }
        );

        setMedicalRecords(data || []);
      } catch (error: any) {
        console.error('Error al cargar registros médicos:', error);
      }
    },
    []
  );

  /**
   * Obtener citas del paciente
   */
  const fetchAppointments = useCallback(
    async (patientId: string) => {
      try {
        const { data } = await supabaseDb.query(
          'appointments',
          '*',
          { patient_id: patientId }
        );

        setAppointments(data || []);
      } catch (error: any) {
        console.error('Error al cargar citas:', error);
      }
    },
    []
  );

  return {
    // State
    patients,
    currentPatient,
    medicalRecords,
    appointments,
    isLoading,
    totalPatients,

    // Methods
    fetchPatients,
    fetchPatientDetails,
    searchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    fetchMedicalRecords,
    fetchAppointments,
  };
}

export default usePatient;
