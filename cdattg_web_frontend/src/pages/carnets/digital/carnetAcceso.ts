/**
 * Digo quién puede ver el carnet digital.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const PERM_VER_CARNET_DIGITAL = 'VER CARNET DIGITAL';

/**
 * El carnet es del aprendiz. Superadmin entra por el permiso * si lo tiene.
 * @param roles roles de la sesión
 * @param permissions permisos de la sesión
 * @returns true si puede abrir la pantalla
 */
export function puedeVerCarnetDigital(roles: string[], permissions: string[]): boolean {
  const normalizados = roles.map((r) => r.toUpperCase());
  if (normalizados.includes('APRENDIZ')) return true;
  return permissions.includes('*') || permissions.includes(PERM_VER_CARNET_DIGITAL);
}
