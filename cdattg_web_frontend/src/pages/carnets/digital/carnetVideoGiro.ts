/**
 * Calculo el giro 3D y el nombre del video del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const CARNET_VIDEO_MS = 3600;

/**
 * Calculo el tamaño del carnet sin estirarlo.
 * @param imgW ancho real
 * @param imgH alto real
 * @param canvasW ancho del video
 * @param canvasH alto del video
 * @param escalaX 1 de frente; menos de 1 al girar
 */
export function tamanoDibujo(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number,
  escalaX: number,
): { dw: number; dh: number } {
  const ratio = imgW / Math.max(imgH, 1);
  let dh = canvasH;
  let dw = dh * ratio;
  if (dw > canvasW) {
    dw = canvasW;
    dh = dw / ratio;
  }
  return { dw: dw * Math.max(escalaX, 0.08), dh };
}

/**
 * Paso de 0° (cara) a 180° (reverso) según el tiempo.
 * @param tMs milisegundos desde el inicio
 * @returns ángulo en grados
 */
export function anguloGiroCarnet(tMs: number): number {
  const espera = 700;
  const giro = 1400;
  if (tMs <= espera) return 0;
  if (tMs >= espera + giro) return 180;
  return ((tMs - espera) / giro) * 180;
}

/** Digo si en ese ángulo se ve la cara. */
export function caraVisibleEnGiro(angulo: number): boolean {
  return angulo < 90;
}

/** Eligo un tipo de video que el navegador sepa grabar. */
export function mimeVideoCarnet(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const tipos = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  return tipos.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * Armo el nombre del archivo sin caracteres raros.
 * @param nombres nombres del aprendiz
 * @param documento cédula
 * @param mime tipo del video
 */
export function nombreVideoCarnet(nombres: string, documento: string, mime: string): string {
  const limpio = `${nombres}-${documento}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  return `carnet-${limpio || 'digital'}.${ext}`;
}

/** Disparo la descarga del archivo. */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
