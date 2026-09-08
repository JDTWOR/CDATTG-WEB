/**
 * Armo el texto de regional del carnet: siempre “Regional. …”
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Dejo “Regional. Guaviare” aunque la sede solo traiga “Guaviare”.
 * @param nombre nombre crudo de la regional
 * @returns etiqueta del carnet
 */
export function etiquetaRegionalCarnet(nombre: string): string {
  const limpio = nombre.trim().replace(/^regional\.?\s+/i, '');
  return `Regional. ${limpio || 'Guaviare'}`;
}
