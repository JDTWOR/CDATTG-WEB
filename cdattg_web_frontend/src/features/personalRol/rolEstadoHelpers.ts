/**
 * @module features/personalRol/rolEstadoHelpers
 * @description Utilidades de estado activo/inactivo para el módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */

/**
 * Determina si un ítem del módulo Personal está activo.
 * @param estado Valor de estado opcional (undefined se considera activo).
 * @returns true cuando el ítem está activo.
 */
export function rolEstaActivo(estado: boolean | undefined): boolean {
  return estado !== false;
}

/**
 * Devuelve las clases CSS del badge de estado.
 * @param activo Estado activo/inactivo del ítem.
 * @returns Clases Tailwind para el badge.
 */
export function rolEstadoBadgeClass(activo: boolean): string {
  return activo
    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}