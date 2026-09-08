/**
 * Lista de grupos sanguíneos para el desplegable de Mi perfil.
 * La saqué para no repetirla en el formulario y en las pruebas.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** Grupos que acepta el carnet y el perfil. */
export const RH_TIPOS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

export type RhTipo = (typeof RH_TIPOS)[number];

/**
 * Digo si el valor es un RH válido o está vacío.
 * @param valor texto del desplegable
 * @returns true si se puede guardar
 */
export function rhEsValido(valor: string): boolean {
  const limpio = valor.trim().toUpperCase();
  return limpio === '' || (RH_TIPOS as readonly string[]).includes(limpio);
}
