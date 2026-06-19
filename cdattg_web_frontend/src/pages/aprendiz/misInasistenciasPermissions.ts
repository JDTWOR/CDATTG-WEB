export const PERM_VER_MIS_INASISTENCIAS = 'VER MIS INASISTENCIAS';

export function canViewMisInasistencias(roles: string[], permissions: string[]): boolean {
  const normalized = roles.map((r) => r.toUpperCase());
  if (normalized.includes('APRENDIZ')) return true;
  return permissions.includes('*') || permissions.includes(PERM_VER_MIS_INASISTENCIAS);
}

export const MENSAJE_SIN_PERMISO_MIS_INASISTENCIAS =
  'No tiene permiso para consultar inasistencias (requiere rol Aprendiz).';
