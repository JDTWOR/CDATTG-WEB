/**
 * Aquí manejo las casillas de caracterización: si marcan NINGUNA, quito las demás.
 * Al API mando un solo parametro_id (el primero que esté marcado).
 * Lo usa useRegistroWizard; la pantalla solo pinta checkboxes.
 * @author Cristian Deysdayr Jiménez
 */

type Catalogo = Readonly<{ id: number; name: string }>;

/**
 * Identificador de la opción NINGUNA, si existe en el catálogo.
 * Comparo en mayúsculas por si el API manda “Ninguna”.
 * @param items Categorías cargadas
 * @returns Id o undefined si no hay NINGUNA
 */
export function idNinguna(items: readonly Catalogo[]): number | undefined {
  return items.find((c) => c.name.trim().toUpperCase() === 'NINGUNA')?.id;
}

/**
 * Alterna una categoría. Marcar NINGUNA deja solo esa opción.
 * Desmarcar NINGUNA deja la lista vacía.
 * @param ids Selección actual
 * @param id Categoría pulsada
 * @param ningunaId Id de NINGUNA, si aplica
 * @returns Nueva lista de ids
 * @example alternarCaracterizacion([1], 2, 99) // [1, 2]
 */
export function alternarCaracterizacion(ids: readonly number[], id: number, ningunaId?: number): number[] {
  // Pulsaron NINGUNA: o la enciendo sola, o la apago por completo.
  if (ningunaId != null && id === ningunaId) {
    return ids.includes(ningunaId) ? [] : [ningunaId];
  }
  // Si había NINGUNA y ahora marcan otra, NINGUNA ya no aplica.
  const sinNinguna = ids.filter((x) => x !== ningunaId);
  if (sinNinguna.includes(id)) {
    return sinNinguna.filter((x) => x !== id);
  }
  return [...sinNinguna, id];
}

/**
 * El API acepta un solo parametro_id; se envía el primero marcado.
 * @param ids Categorías seleccionadas
 * @returns Id a persistir o 0 si no hay selección
 */
export function parametroIdDesdeChecks(ids: readonly number[]): number {
  return ids[0] ?? 0;
}
