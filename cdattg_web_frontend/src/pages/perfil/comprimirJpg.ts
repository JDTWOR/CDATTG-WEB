/**
 * Dejo la foto en JPG de máximo 20 KB para el perfil y el carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const FOTO_MAX_BYTES = 20 * 1024;

/**
 * Comprime un canvas a JPG hasta caber en el tope.
 * @param canvas foto ya recortada
 * @param topeBytes tamaño máximo
 * @returns blob jpg
 */
export async function comprimirCanvasAJpg(canvas: HTMLCanvasElement, topeBytes = FOTO_MAX_BYTES): Promise<Blob> {
  let calidad = 0.82;
  let blob = await canvasAJpg(canvas, calidad);
  while (blob.size > topeBytes && calidad > 0.28) {
    calidad -= 0.08;
    blob = await canvasAJpg(canvas, calidad);
  }
  if (blob.size > topeBytes) {
    const chico = document.createElement('canvas');
    chico.width = Math.max(120, Math.round(canvas.width * 0.7));
    chico.height = Math.max(150, Math.round(canvas.height * 0.7));
    chico.getContext('2d')?.drawImage(canvas, 0, 0, chico.width, chico.height);
    blob = await canvasAJpg(chico, 0.45);
  }
  if (blob.size > topeBytes) {
    throw new Error('La foto quedó por encima de 20 KB. Use una toma más cercana.');
  }
  return blob;
}

function canvasAJpg(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No pude armar el JPG'))), 'image/jpeg', calidad);
  });
}

/**
 * Digo si el archivo es JPG por tipo o extensión.
 * @param archivo archivo del dispositivo
 */
export function archivoEsJpg(archivo: File): boolean {
  if (archivo.type === 'image/jpeg' || archivo.type === 'image/jpg') return true;
  return /\.jpe?g$/i.test(archivo.name);
}
