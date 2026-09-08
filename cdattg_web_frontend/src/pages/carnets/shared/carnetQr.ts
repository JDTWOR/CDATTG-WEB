/**
 * Armo el texto que va en el QR del carnet: el número de cédula.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Devuelvo solo dígitos de la cédula para el QR.
 * @param documento número de documento
 * @returns texto del QR
 */
export function textoQrCarnet(documento: string): string {
  const limpio = documento.replaceAll(/\D/g, '');
  return limpio || documento.trim();
}
