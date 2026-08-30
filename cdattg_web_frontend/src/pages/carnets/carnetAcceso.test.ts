/**
 * Pruebo el acceso al carnet digital.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { puedeVerCarnetDigital } from './carnetAcceso';

describe('puedeVerCarnetDigital', () => {
  it('deja pasar al aprendiz', () => {
    expect(puedeVerCarnetDigital(['APRENDIZ'], [])).toBe(true);
  });

  it('bloquea a un instructor sin permiso', () => {
    expect(puedeVerCarnetDigital(['INSTRUCTOR'], [])).toBe(false);
  });

  it('deja pasar si tiene el permiso', () => {
    expect(puedeVerCarnetDigital([], ['VER CARNET DIGITAL'])).toBe(true);
  });
});
