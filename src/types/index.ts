// Core type definitions for the application

export interface User {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
  perfil_id: string;
  activo: boolean;
  ultimo_acceso?: string;
  /** Rol Hosix (edge / hospital); opcional para compatibilidad con Renaprosa */
  role?: string;
  hospital_id?: string;
  hospital_nombre?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PermissionLevel {
  usuario_id: string;
  modulo: string;
  accion: 'leer' | 'crear' | 'editar' | 'eliminar' | 'aprobar';
  tiene_permiso: boolean;
  nivel_acceso: number;
}

export interface Patient {
  id: string;
  ppi: string;
  numero_documento: string;
  tipo_documento: 'cedula' | 'pasaporte' | 'otro';
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  genero: 'M' | 'F' | 'O';
  email?: string;
  telefono?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  facility_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'consultation' | 'procedure' | 'follow_up' | 'checkup' | 'emergency' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  chief_complaint?: string;
  notes?: string;
  created_at: string;
}

export interface BillingAccount {
  account_id: string;
  patient_id: string;
  account_number: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'closed';
  balance_due: number;
  credit_limit?: number;
}

export interface Report {
  definition_id: string;
  report_name: string;
  report_type: 'clinical' | 'operational' | 'financial' | 'patient_demographics' | 'appointment' | 'treatment' | 'custom';
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
