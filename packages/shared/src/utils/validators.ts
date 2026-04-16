/**
 * @sermed2/shared/utils/validators.ts
 * Funciones de validación
 */

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar teléfono
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}

/**
 * Validar contraseña (mínimo 8 caracteres)
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener número');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validar URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validar UUID
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validar que no esté vacío
 */
export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Validar longitud mínima
 */
export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Validar longitud máxima
 */
export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Validar rango de números
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
