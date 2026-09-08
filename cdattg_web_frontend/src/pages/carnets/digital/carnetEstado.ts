/**
 * Leo el estado de la ficha para mostrar crear, renovar o devuelto.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** Digo si esa ficha está en revisión. */
export function fichaCarnetPendiente(estado: string): boolean {
  return estado === 'pendiente';
}

/** Digo si el líder devolvió la solicitud. */
export function fichaCarnetDevuelto(estado: string): boolean {
  return estado === 'devuelto' || estado === 'rechazado';
}

/** Digo si esa ficha ya tiene carnet creado. */
export function fichaCarnetAprobado(estado: string): boolean {
  return estado === 'aprobado';
}
