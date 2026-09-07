/**
 * Pruebo que detecte el SVG del logo y que la conversión falle o pase.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { afterEach, describe, expect, it } from 'vitest';
import { esImagenSvg, prepararImagenesCarnet, svgUrlAPng } from '../carnetLogo';

const ImageOrig = globalThis.Image;
const ctxOrig = HTMLCanvasElement.prototype.getContext;
const urlOrig = HTMLCanvasElement.prototype.toDataURL;

/** Pongo una imagen falsa para no pedir red. */
function usarImagenFalsa(ok: boolean): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 20;
    naturalHeight = 10;
    set src(_v: string) {
      queueMicrotask(() => (ok ? this.onload?.() : this.onerror?.()));
    }
  }
  globalThis.Image = FakeImage as unknown as typeof Image;
}

/** El lienzo de prueba no pinta; yo le dejo un PNG de mentira. */
function usarLienzoFalso(): void {
  HTMLCanvasElement.prototype.getContext = () =>
    ({ drawImage: () => undefined }) as unknown as CanvasRenderingContext2D;
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,abc';
}

afterEach(() => {
  globalThis.Image = ImageOrig;
  HTMLCanvasElement.prototype.getContext = ctxOrig;
  HTMLCanvasElement.prototype.toDataURL = urlOrig;
});

describe('esImagenSvg', () => {
  it('reconoce svg por archivo o data', () => {
    expect(esImagenSvg('/logo-sena.svg')).toBe(true);
    expect(esImagenSvg('data:image/svg+xml;base64,abc')).toBe(true);
    expect(esImagenSvg('data:image/png;base64,abc')).toBe(false);
  });
});

describe('svgUrlAPng', () => {
  it('falla si la imagen no carga', async () => {
    usarImagenFalsa(false);
    await expect(svgUrlAPng('logo.svg')).rejects.toThrow('logo');
  });

  it('deja un png si la imagen carga', async () => {
    usarImagenFalsa(true);
    usarLienzoFalso();
    await expect(svgUrlAPng('logo.svg')).resolves.toMatch(/^data:image\/png/);
  });

  it('falla si el lienzo no pinta', async () => {
    usarImagenFalsa(true);
    HTMLCanvasElement.prototype.getContext = () => null;
    await expect(svgUrlAPng('logo.svg')).rejects.toThrow('dibujar');
  });
});

describe('prepararImagenesCarnet', () => {
  it('cambia el svg y deja el png', async () => {
    usarImagenFalsa(true);
    usarLienzoFalso();
    const caja = document.createElement('div');
    const svg = document.createElement('img');
    const png = document.createElement('img');
    svg.src = 'https://local.test/logo.svg';
    png.src = 'https://local.test/foto.png';
    caja.append(svg, png);
    await prepararImagenesCarnet(caja);
    expect(svg.src).toMatch(/^data:image\/png/);
    expect(png.src).toContain('foto.png');
  });
});
