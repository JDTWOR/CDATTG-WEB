/**
 * Valido los comprobantes de la reposición del carnet: PDF, JPG, PNG o WEBP,
 * máximo 2 MB. Lo uso en el formulario del aprendiz para avisar antes de
 * enviar, igual que el backend valida los primeros bytes del archivo.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const COMPROBANTES_MAX_BYTES = 2 * 1024 * 1024;

const EXTENSIONES_VALIDAS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const TIPOS_MIME_VALIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** Devuelve la extensión en minúsculas del nombre del archivo. */
export function extensionDeArchivo(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i >= 0 ? nombre.slice(i + 1).toLowerCase() : '';
}

/** Dice si el archivo es PDF o imagen, por extensión o tipo MIME. */
export function esComprobanteValido(archivo: File): boolean {
  return EXTENSIONES_VALIDAS.includes(extensionDeArchivo(archivo.name))
    || TIPOS_MIME_VALIDOS.includes(archivo.type);
}

/** Devuelve el motivo de rechazo o vacío si el archivo puede enviarse. */
export function validarComprobante(archivo: File | null): string {
  if (!archivo) return '';
  if (!esComprobanteValido(archivo)) {
    return 'El comprobante debe ser PDF, JPG, PNG o WEBP';
  }
  if (archivo.size > COMPROBANTES_MAX_BYTES) {
    return 'Cada comprobante debe pesar máximo 2 MB';
  }
  return '';
}

/** Dice si el comprobante es imagen (para mostrar la vista previa). */
export function esImagenComprobante(archivo: File | null): boolean {
  if (!archivo) return false;
  return archivo.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extensionDeArchivo(archivo.name));
}

/** Valida los dos comprobantes juntos antes de enviar la solicitud. */
export function validarComprobantesSeleccionados(pago: File | null, demanda: File | null): string {
  const errPago = validarComprobante(pago);
  if (errPago) return errPago;
  const errDemanda = validarComprobante(demanda);
  if (errDemanda) return errDemanda;
  if (!pago || !demanda) return 'Adjunte los dos comprobantes';
  return '';
}