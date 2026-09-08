/**
 * Paso el logo SVG a PNG para que el video lo pueda pintar.
 * html2canvas se come el SVG y el logo no salía en la descarga.
 *
 * @author Cristian Deysdayr Jiménez
 */

const LOGO_LADO_PX = 400;
const LOGO_ESPERA_MS = 4000;

/**
 * Digo si esa imagen es un SVG.
 * @param src ruta o data de la imagen
 * @returns true si es SVG
 */
export function esImagenSvg(src: string): boolean {
  const s = src.toLowerCase();
  return s.includes('.svg') || s.startsWith('data:image/svg');
}

/**
 * Espero a que el logo cargue o corto si se queda quieto.
 * @param img imagen del logo
 * @returns nada cuando ya cargó
 */
function esperarCarga(img: HTMLImageElement): Promise<void> {
  return new Promise((ok, mal) => {
    const t = globalThis.setTimeout(() => mal(new Error('No pude leer el logo del SENA')), LOGO_ESPERA_MS);
    img.onload = () => {
      globalThis.clearTimeout(t);
      ok();
    };
    img.onerror = () => {
      globalThis.clearTimeout(t);
      mal(new Error('No pude leer el logo del SENA'));
    };
  });
}

/**
 * Dibujo el SVG en un lienzo y lo dejo como PNG, sin estirarlo.
 * @param src ruta o data del logo
 * @returns imagen PNG lista para el carnet
 */
export async function svgUrlAPng(src: string): Promise<string> {
  const img = new Image();
  img.src = src;
  await esperarCarga(img);
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const ancho = ratio >= 1 ? LOGO_LADO_PX : Math.max(1, Math.round(LOGO_LADO_PX * ratio));
  const alto = ratio >= 1 ? Math.max(1, Math.round(LOGO_LADO_PX / ratio)) : LOGO_LADO_PX;
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No pude dibujar el logo');
  ctx.drawImage(img, 0, 0, ancho, alto);
  return lienzo.toDataURL('image/png');
}

/**
 * Cambio los SVG del carnet a PNG antes de grabar el video.
 * @param el cara o reverso
 * @returns nada cuando las fotos ya están listas
 */
export async function prepararImagenesCarnet(el: HTMLElement): Promise<void> {
  const imgs = [...el.querySelectorAll('img')];
  await Promise.all(
    imgs.map(async (img) => {
      if (esImagenSvg(img.src)) {
        img.src = await svgUrlAPng(img.src);
        await img.decode().catch(() => undefined);
        return;
      }
      if (img.complete) return;
      await img.decode().catch(() => undefined);
    }),
  );
}
