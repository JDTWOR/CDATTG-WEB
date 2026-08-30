/**
 * Pruebo pendiente y devuelto del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { fichaCarnetAprobado, fichaCarnetDevuelto, fichaCarnetPendiente } from './carnetEstado';

describe('estado del carnet', () => {
  it('detecta pendiente', () => {
    expect(fichaCarnetPendiente('pendiente')).toBe(true);
    expect(fichaCarnetPendiente('ninguna')).toBe(false);
  });

  it('trata rechazado viejo como devuelto', () => {
    expect(fichaCarnetDevuelto('devuelto')).toBe(true);
    expect(fichaCarnetDevuelto('rechazado')).toBe(true);
    expect(fichaCarnetDevuelto('aprobado')).toBe(false);
  });

  it('solo esa ficha queda aprobada', () => {
    expect(fichaCarnetAprobado('aprobado')).toBe(true);
    expect(fichaCarnetAprobado('ninguna')).toBe(false);
  });
});
