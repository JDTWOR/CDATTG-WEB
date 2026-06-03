/** Etiqueta legible: "INSTRUCTOR" → "Instructor", "SUPER ADMINISTRADOR" → "Super Administrador". */
import { PERM_VER_MI_AGENDA } from './programacionPermissions';

export function formatRoleLabel(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRolesLine(roles: string[]): string {
  return roles.map(formatRoleLabel).join(', ');
}

export function hasAnyRole(userRoles: string[], required: string[]): boolean {
  const normalized = new Set(userRoles.map((r) => r.toUpperCase()));
  return required.some((r) => normalized.has(r.toUpperCase()));
}

const DASHBOARD_ROLES = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'] as const;

/** Ruta de inicio según rol: instructores → asistencia; coordinación → dashboard. */
export function getHomeRouteForUser(roles: string[], permissions: string[]): string {
  const normalized = roles.map((r) => r.toUpperCase());

  if (normalized.some((r) => (DASHBOARD_ROLES as readonly string[]).includes(r))) {
    return '/dashboard';
  }
  if (normalized.includes('VIGILANTE')) {
    return '/vigilancia/ambientes';
  }
  if (normalized.includes('INSTRUCTOR')) {
    if (permissions.includes('*') || permissions.includes(PERM_VER_MI_AGENDA)) {
      return '/dashboard';
    }
    const canAsistencia =
      permissions.includes('*') || permissions.includes('VER ASISTENCIA');
    return canAsistencia ? '/asistencia' : '/fichas';
  }
  return '/perfil';
}

export function canAccessMainDashboard(roles: string[]): boolean {
  return hasAnyRole(roles, [...DASHBOARD_ROLES]);
}
