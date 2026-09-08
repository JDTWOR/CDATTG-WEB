/**
 * Pruebo la lista y la validación del RH.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { RH_TIPOS, rhEsValido } from './rhTipos';

describe('rhTipos', () => {
  it('trae los ocho grupos', () => {
    expect(RH_TIPOS).toHaveLength(8);
    expect(RH_TIPOS).toContain('O+');
    expect(RH_TIPOS).toContain('AB-');
  });

  it('acepta vacío y un grupo real', () => {
    expect(rhEsValido('')).toBe(true);
    expect(rhEsValido('o+')).toBe(true);
    expect(rhEsValido('XX')).toBe(false);
  });
});
