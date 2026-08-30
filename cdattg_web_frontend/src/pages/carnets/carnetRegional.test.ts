/**
 * Pruebo la etiqueta Regional. Guaviare.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { etiquetaRegionalCarnet } from './carnetRegional';

describe('etiquetaRegionalCarnet', () => {
  it('antepone Regional. si solo viene Guaviare', () => {
    expect(etiquetaRegionalCarnet('Guaviare')).toBe('Regional. Guaviare');
  });

  it('no duplica la palabra Regional', () => {
    expect(etiquetaRegionalCarnet('Regional Guaviare')).toBe('Regional. Guaviare');
  });
});
