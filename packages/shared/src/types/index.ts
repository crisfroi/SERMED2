/**
 * @sermed2/shared/types
 * Interfaces y tipos compartidos para HOSIX y RENAPROSA
 */

// ============ Authentication ============
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: PermissionLevel;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  token?: string;
  expiresAt?: string;
}

export type PermissionLevel = 'admin' | 'doctor' | 'nurse' | 'staff' | 'patient' | 'guest';

// ============ Patient/Clinical ============
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  chronicDiseases?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  duration: number; // minutes
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: 'visit' | 'diagnosis' | 'prescription' | 'lab' | 'imaging';
  date: string;
  content: string;
  doctorId: string;
  createdAt: string;
}

// ============ Financial ============
export interface BillingAccount {
  id: string;
  patientId: string;
  totalDue: number;
  totalPaid: number;
  status: 'active' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate?: string;
}

export interface Payment {
  id: string;
  billingId: string;
  amount: number;
  method: 'card' | 'cash' | 'transfer' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  date: string;
  createdAt: string;
}

// ============ HR/Payroll ============
export interface Employee {
  id: string;
  userId: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  manager?: string;
  createdAt: string;
}

// ============ Reports & Analytics ============
export interface Report {
  id: string;
  title: string;
  type: 'patient' | 'financial' | 'operational' | 'clinical';
  dateRange: {
    start: string;
    end: string;
  };
  data: Record<string, any>;
  createdBy: string;
  createdAt: string;
}

// ============ UI/Notifications ============
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: string;
}

export interface AppContextValue {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// ============ API Responses ============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ Form Types ============
export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
}

export interface PasswordResetFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
  resetToken?: string;
}

// ============ Edge Function Types ============
export interface EdgeFunctionRequest<T = any> {
  method: string;
  headers: Record<string, string>;
  body?: T;
  queryParams?: Record<string, string>;
}

export interface EdgeFunctionResponse<T = any> {
  statusCode: number;
  body: T;
  headers?: Record<string, string>;
}

// ============ Enum-like types ============
export const PATIENT_GENDERS = ['M', 'F', 'O'] as const;
export type PatientGender = typeof PATIENT_GENDERS[number];

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show'] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

export const PAYMENT_METHODS = ['card', 'cash', 'transfer', 'check'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const NOTIFICATION_TYPES = ['success', 'error', 'warning', 'info'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];
