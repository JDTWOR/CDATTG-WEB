/**
 * Aquí compruebo que el menú Explora apunte a investigación y traiga las secciones.
 * Lo hice para no publicar un enlace roto o fuera de /investigacion.
 * Prueba portalExplora.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { EXPLORA_INVESTIGACION } from './portalExplora';

describe('EXPLORA_INVESTIGACION', () => {
  it('cubre los submódulos públicos', () => {
    // Saco los nombres que ve la gente en el portal.
    const labels = EXPLORA_INVESTIGACION.map((e) => e.label);
    expect(labels).toContain('Presentación');
    expect(labels).toContain('Revista Rupícola');
    // Todas las rutas deben quedar bajo investigación, no en el sistema interno.
    expect(EXPLORA_INVESTIGACION.every((e) => e.to.startsWith('/investigacion'))).toBe(true);
  });
});
