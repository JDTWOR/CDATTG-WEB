/**
 * Aquí confirmo que, sin sesión, la entrada es el portal y no el login.
 * Prueba rutaPublicaDeEntrada de ProtectedRoute.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { rutaPublicaDeEntrada } from './ProtectedRoute';
import { portalPaths } from '../routes/paths';

describe('rutaPublicaDeEntrada', () => {
  it('es el portal publico', () => {
    expect(rutaPublicaDeEntrada()).toBe(portalPaths.index);
    expect(rutaPublicaDeEntrada()).toBe('/');
  });
});
