/** Permisos Casbin (act) para programación de instructores y agenda personal. */
export const PERM_PROGRAMAR_INSTRUCTORES = 'PROGRAMAR INSTRUCTORES';
export const PERM_VER_MI_AGENDA = 'VER MI AGENDA';

/** Roles que pueden programar instructores (coordinación y administración). */
export const ROLES_PROGRAMACION = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'] as const;

export function canProgramarInstructores(
  roles: string[],
  hasPermission: (permission: string) => boolean,
): boolean {
  if (hasPermission(PERM_PROGRAMAR_INSTRUCTORES)) return true;
  return ROLES_PROGRAMACION.some((r) => roles.includes(r));
}

export function canVerMiAgenda(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission(PERM_VER_MI_AGENDA);
}
