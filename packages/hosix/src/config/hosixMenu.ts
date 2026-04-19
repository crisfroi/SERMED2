/**
 * Menú lateral Hosix: rutas relativas a `/hosix/` y visibilidad por rol.
 */

export type HosixAppRole =
  | 'SUPER_ADMINISTRADOR'
  | 'DIRECTOR_HOSPITAL'
  | 'PROFESIONAL'
  | 'GESTOR_ADMINISTRATIVO'
  | 'PUBLICO';

export interface HosixMenuItem {
  label: string;
  path: string;
  icon: string;
  end?: boolean;
  /** Si se omite, visible para cualquier sesión Hosix autenticada */
  roles?: HosixAppRole[];
}

const ALL_ROLES: HosixAppRole[] = [
  'SUPER_ADMINISTRADOR',
  'DIRECTOR_HOSPITAL',
  'PROFESIONAL',
  'GESTOR_ADMINISTRATIVO',
  'PUBLICO',
];

/** Roles con acceso al área clínica (rutas bajo `/hosix/clinical/*`) */
export const CLINICAL_ROLES: HosixAppRole[] = [
  'SUPER_ADMINISTRADOR',
  'DIRECTOR_HOSPITAL',
  'PROFESIONAL',
];

/** Roles con acceso a facturación */
export const BILLING_ROLES: HosixAppRole[] = [
  'SUPER_ADMINISTRADOR',
  'DIRECTOR_HOSPITAL',
  'GESTOR_ADMINISTRATIVO',
];

/** Texto para `RoleBasedRoute.allowedRoles` (mismo orden que en edge / dashboard) */
export const CLINICAL_ROLE_STRINGS = CLINICAL_ROLES as unknown as string[];
export const BILLING_ROLE_STRINGS = BILLING_ROLES as unknown as string[];

export const HOSIX_MENU_ITEMS: HosixMenuItem[] = [
  { label: 'Dashboard', path: 'dashboard', icon: '📊', end: true, roles: ALL_ROLES },
  { label: 'Pacientes', path: 'patients', icon: '👥', roles: ALL_ROLES.filter((r) => r !== 'PUBLICO') },
  { label: 'Citas', path: 'appointments', icon: '📅', roles: ALL_ROLES.filter((r) => r !== 'PUBLICO') },
  { label: 'Clínica', path: 'clinical', icon: '📝', roles: CLINICAL_ROLES },
  { label: 'Órdenes', path: 'orders', icon: '🧪', roles: ALL_ROLES.filter((r) => r !== 'PUBLICO') },
  { label: 'Facturación', path: 'billing', icon: '💰', roles: BILLING_ROLES },
  { label: 'Reportes', path: 'reports', icon: '📈', roles: ALL_ROLES.filter((r) => r !== 'PUBLICO') },
];

export function filterHosixMenuByRole(
  items: HosixMenuItem[],
  role: string | undefined
): HosixMenuItem[] {
  const r = (role || 'PUBLICO') as HosixAppRole;
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(r);
  });
}
