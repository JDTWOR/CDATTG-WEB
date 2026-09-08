/**
 * Filtro las personas de biblioteca por la ficha que eligió el usuario.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetBibliotecaItem } from '../../../types/carnet';

/**
 * Dejo solo los de esa ficha. Si no hay ficha, dejo todos.
 * @param items personas con carnet regular aprobado
 * @param fichaId ficha elegida; 0 = todas
 * @returns personas visibles
 */
export function filtrarItemsBiblioteca(items: CarnetBibliotecaItem[], fichaId: number): CarnetBibliotecaItem[] {
  if (fichaId <= 0) {
    return items;
  }
  return items.filter((it) => it.ficha_id === fichaId);
}
