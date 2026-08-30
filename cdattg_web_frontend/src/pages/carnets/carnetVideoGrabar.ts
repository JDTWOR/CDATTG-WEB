/**
 * Grabo el carnet tal como se ve: cara y reverso, sin estirarlo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import html2canvas from 'html2canvas';
import { prepararImagenesCarnet } from './carnetLogo';
import { anguloGiroCarnet, caraVisibleEnGiro, CARNET_VIDEO_MS, mimeVideoCarnet, tamanoDibujo } from './carnetVideoGiro';

/**
 * Pinto un fotograma respetando el tamaño real del carnet.
 */
export function pintarGiro(
  ctx: CanvasRenderingContext2D,
  cara: HTMLCanvasElement,
  reverso: HTMLCanvasElement,
  angulo: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, w, h);
  const rad = (angulo * Math.PI) / 180;
  const img = caraVisibleEnGiro(angulo) ? cara : reverso;
  const { dw, dh } = tamanoDibujo(img.width, img.height, w, h, Math.abs(Math.cos(rad)));
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/**
 * Capturo cara y reverso a la misma escala que en pantalla.
 */
export async function grabarVideoCarnet(caraEl: HTMLElement, reversoEl: HTMLElement): Promise<Blob> {
  const mime = mimeVideoCarnet();
  if (!mime) throw new Error('Este navegador no puede grabar el video del carnet');
  await prepararImagenesCarnet(caraEl);
  await prepararImagenesCarnet(reversoEl);
  // Lo dejo en PNG y con CORS para que el logo y la foto sí salgan.
  const opts = { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, allowTaint: true };
  const cara = await html2canvas(caraEl, opts);
  const reverso = await html2canvas(reversoEl, opts);
  const w = cara.width;
  const h = cara.height;
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No pude dibujar el video');
  return grabarLienzo(ctx, lienzo, cara, reverso, w, h, mime);
}

function grabarLienzo(
  ctx: CanvasRenderingContext2D,
  lienzo: HTMLCanvasElement,
  cara: HTMLCanvasElement,
  reverso: HTMLCanvasElement,
  w: number,
  h: number,
  mime: string,
): Promise<Blob> {
  const stream = lienzo.captureStream(24);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
  const partes: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) partes.push(e.data);
  };
  const fin = new Promise<Blob>((ok, mal) => {
    rec.onstop = () => ok(new Blob(partes, { type: mime }));
    rec.onerror = () => mal(new Error('Falló la grabación del video'));
  });
  rec.start();
  const inicio = performance.now();
  return new Promise((resolve, reject) => {
    const tick = (ahora: number) => {
      const t = ahora - inicio;
      pintarGiro(ctx, cara, reverso, anguloGiroCarnet(t), w, h);
      if (t >= CARNET_VIDEO_MS) {
        rec.stop();
        fin.then(resolve).catch(reject);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
