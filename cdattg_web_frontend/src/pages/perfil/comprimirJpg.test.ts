/**
 * Pruebo la regla de JPG para la foto de perfil.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { archivoEsJpg, FOTO_MAX_BYTES } from './comprimirJpg';

describe('archivoEsJpg', () => {
  it('acepta jpeg por tipo y por extensión', () => {
    expect(archivoEsJpg(new File([], 'foto.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(archivoEsJpg(new File([], 'cara.JPG', { type: '' }))).toBe(true);
  });

  it('rechaza png', () => {
    expect(archivoEsJpg(new File([], 'foto.png', { type: 'image/png' }))).toBe(false);
  });

  it('el tope son 20 KB', () => {
    expect(FOTO_MAX_BYTES).toBe(20 * 1024);
  });
});
