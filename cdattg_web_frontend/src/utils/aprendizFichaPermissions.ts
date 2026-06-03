const PERM_GESTIONAR_APRENDICES_FICHA = 'GESTIONAR APRENDICES FICHA';

/** Superadmin, admin y coordinador (vía Casbin en ficha). */
export function canGestionarAprendicesFicha(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission('*') || hasPermission(PERM_GESTIONAR_APRENDICES_FICHA);
}

export function aprendizVisibleEnTomaAsistencia(a: { estado: boolean; oculto_en_asistencia?: boolean }): boolean {
  return a.estado && !a.oculto_en_asistencia;
}
