const PERM_GESTIONAR_APRENDICES_FICHA = 'GESTIONAR APRENDICES FICHA';

const ROLES_GESTION_APRENDICES_FICHA = [
  'SUPER ADMINISTRADOR',
  'ADMINISTRADOR',
  'COORDINADOR',
] as const;

/** Superadmin, admin y coordinador (Casbin o rol en sesión). */
export function canGestionarAprendicesFicha(
  roles: string[],
  hasPermission: (permission: string) => boolean,
): boolean {
  if (hasPermission('*') || hasPermission(PERM_GESTIONAR_APRENDICES_FICHA)) {
    return true;
  }
  return ROLES_GESTION_APRENDICES_FICHA.some((r) => roles.includes(r));
}

/** Visible en la pantalla de toma de asistencia del día (excluye ocultos explícitos). */
export function aprendizVisibleEnTomaAsistencia(a: {
  estado: boolean;
  oculto_en_asistencia?: boolean;
}): boolean {
  return a.estado && a.oculto_en_asistencia !== true;
}
