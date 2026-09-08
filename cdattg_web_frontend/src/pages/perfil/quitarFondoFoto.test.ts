/**
 * Pruebo que el fondo claro de las esquinas quede transparente.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { quitarFondoFoto } from './quitarFondoFoto';

describe('quitarFondoFoto', () => {
  it('deja transparente un pixel igual a las esquinas', () => {
    const data = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 240;
      data[i + 1] = 240;
      data[i + 2] = 240;
      data[i + 3] = 255;
    }
    const centro = (1 * 3 + 1) * 4;
    data[centro] = 20;
    data[centro + 1] = 20;
    data[centro + 2] = 20;
    const img = { data, width: 3, height: 3 } as ImageData;
    quitarFondoFoto(img, 20);
    expect(img.data[3]).toBe(0);
    expect(img.data[centro + 3]).toBe(255);
  });
});
