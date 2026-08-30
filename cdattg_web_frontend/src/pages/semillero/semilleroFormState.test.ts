/**
 * Aquí compruebo cómo se arma el semillero nuevo para mandarlo al API.
 * Prueba semilleroFormState.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { claveHijo, semilleroARequest, semilleroVacio } from './semilleroFormState';

describe('semilleroARequest', () => {
  it('copia campos del formulario', () => {
    const body = semilleroARequest({ ...semilleroVacio, nombre: 'BIO', slug: 'bio', sigla: 'BIO' });
    expect(body.nombre).toBe('BIO');
    expect(body.sigla).toBe('BIO');
    expect(body.slug).toBe('bio');
    expect(body.lineas).toEqual([]);
  });

  it('omite clave de UI en hijos', () => {
    const body = semilleroARequest({
      ...semilleroVacio,
      lineas: [{ clave: 'tmp', nombre: 'Agua', descripcion: '', estado_publicacion: 'publicado' }],
    });
    expect(body.lineas[0]).toEqual({ nombre: 'Agua', descripcion: '', estado_publicacion: 'publicado' });
    expect('clave' in body.lineas[0]).toBe(false);
  });
});

describe('claveHijo', () => {
  it('prioriza clave local y luego id', () => {
    expect(claveHijo(3, 'abc')).toBe('abc');
    expect(claveHijo(8)).toBe('id-8');
    expect(claveHijo()).toBe('nueva');
  });
});
