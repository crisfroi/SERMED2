import type { User } from '@/types';

/**
 * Convierte el objeto `user` devuelto por la edge `hosix-auth-login` al shape `User` del AppContext.
 */
export function mapHosixApiUserToContextUser(raw: Record<string, unknown>): User {
  const id = String(raw.id ?? '').trim();
  const email = String(raw.email ?? raw.username ?? '').trim();
  const fromParts = [raw.primer_nombre, raw.segundo_nombre, raw.primer_apellido, raw.segundo_apellido]
    .filter((v) => typeof v === 'string' && (v as string).trim())
    .join(' ')
    .trim();
  const nombreCompleto = (() => {
    if (typeof raw.nombre_completo === 'string' && raw.nombre_completo.trim()) {
      return raw.nombre_completo.trim();
    }
    if (fromParts) return fromParts;
    if (email) return email;
    return 'Usuario Hosix';
  })();

  const usernameBase =
    (typeof raw.username === 'string' && raw.username.trim()) ||
    (email.includes('@') ? email.split('@')[0] : email) ||
    id ||
    'usuario';

  const role = typeof raw.role === 'string' ? raw.role : undefined;
  const hospital_id = typeof raw.hospital_id === 'string' ? raw.hospital_id : undefined;
  const hospital_nombre = typeof raw.hospital_nombre === 'string' ? raw.hospital_nombre : undefined;

  return {
    id: id || usernameBase,
    username: usernameBase,
    email: email || `${usernameBase}@hosix.local`,
    nombre_completo: nombreCompleto,
    perfil_id: role ?? 'HOSIX',
    activo: true,
    role,
    hospital_id,
    hospital_nombre,
    permissions: Array.isArray(raw.permissions)
      ? (raw.permissions as unknown[]).filter((p): p is string => typeof p === 'string')
      : undefined,
  };
}
