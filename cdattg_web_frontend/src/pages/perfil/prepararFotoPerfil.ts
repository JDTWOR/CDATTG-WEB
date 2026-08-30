/**
 * Dejo la foto lista para subir: sin fondo, sobre blanco, JPG de 20 KB.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { comprimirCanvasAJpg } from './comprimirJpg';
import { quitarFondoConModelo, quitarFondoFoto } from './quitarFondoFoto';

const ANCHO = 240;
const ALTO = 300;

/**
 * Quito fondo, recorto a medio cuerpo y comprimo.
 * @param fuente captura o JPG del aparato
 * @returns jpg ≤ 20 KB
 */
export async function prepararFotoPerfil(fuente: Blob): Promise<Blob> {
  let sinFondo: Blob;
  try {
    sinFondo = await quitarFondoConModelo(fuente);
  } catch {
    sinFondo = fuente;
  }
  const bitmap = await createImageBitmap(sinFondo);
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No pude armar la foto');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.drawImage(bitmap, 0, 0, ANCHO, ALTO);
  if (sinFondo === fuente) {
    const recorte = ctx.getImageData(0, 0, ANCHO, ALTO);
    quitarFondoFoto(recorte);
    ctx.putImageData(recorte, 0, 0);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.globalCompositeOperation = 'source-over';
  }
  return comprimirCanvasAJpg(canvas);
}
