/**
 * Pruebo el texto del QR del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { textoQrCarnet } from './carnetQr';

describe('textoQrCarnet', () => {
  it('deja solo dígitos', () => {
    expect(textoQrCarnet('CC 1.120.955.821')).toBe('1120955821');
  });

  it('si no hay dígitos, deja el texto recortado', () => {
    expect(textoQrCarnet('  AB  ')).toBe('AB');
  });
});
