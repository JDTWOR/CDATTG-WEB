/**
 * Aquí compruebo que el carrusel sume, reste y no acepte enlaces peligrosos.
 * Lo hice para no romper el paso de banners al cambiar las cuentas.
 * Prueba portalCarouselLogic.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import {
  claseCapaCarrusel,
  hrefCarruselSeguro,
  indiceAnteriorCarrusel,
  siguienteIndiceCarrusel,
} from './portalCarouselLogic';

describe('siguienteIndiceCarrusel', () => {
  it('avanza al siguiente', () => {
    expect(siguienteIndiceCarrusel(0, 3)).toBe(1);
  });

  it('vuelve al inicio al terminar', () => {
    expect(siguienteIndiceCarrusel(2, 3)).toBe(0);
  });

  it('sin diapositivas queda en 0', () => {
    expect(siguienteIndiceCarrusel(4, 0)).toBe(0);
  });
});

describe('indiceAnteriorCarrusel', () => {
  it('retrocede al anterior', () => {
    expect(indiceAnteriorCarrusel(1, 3)).toBe(0);
  });

  it('del primero salta al último', () => {
    expect(indiceAnteriorCarrusel(0, 3)).toBe(2);
  });

  it('sin diapositivas queda en 0', () => {
    expect(indiceAnteriorCarrusel(4, 0)).toBe(0);
  });
});

describe('claseCapaCarrusel', () => {
  it('la activa es opaca y la inactiva transparente', () => {
    expect(claseCapaCarrusel(true)).toContain('opacity-100');
    expect(claseCapaCarrusel(false)).toContain('opacity-0');
    expect(claseCapaCarrusel(true)).toContain('duration-700');
  });

  it('la anterior queda opaca debajo para no ver el fondo', () => {
    expect(claseCapaCarrusel(false, true)).toContain('opacity-100');
    expect(claseCapaCarrusel(false, true)).not.toContain('opacity-0');
  });
});

describe('hrefCarruselSeguro', () => {
  it('acepta https y rutas internas', () => {
    expect(hrefCarruselSeguro('https://sena.edu.co')).toContain('https://');
    expect(hrefCarruselSeguro('/registro')).toBe('/registro');
  });

  it('rechaza javascript', () => {
    expect(hrefCarruselSeguro('javascript:alert(1)')).toBe('');
  });
});
