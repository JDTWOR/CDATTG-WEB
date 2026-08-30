/**
 * @module pages/administracion/carruselFormState.test
 * @description Payload del carrusel de destacados.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { destacadosARequest, destacadosVacio } from './carruselFormState';

describe('destacadosARequest', () => {
  it('copia título y botón', () => {
    const body = destacadosARequest({
      ...destacadosVacio, titulo: 'Oferta', boton_texto: 'Ver más', enlace_url: '/registro',
    });
    expect(body.titulo).toBe('Oferta');
    expect(body.boton_texto).toBe('Ver más');
    expect(body.enlace_url).toBe('/registro');
  });
});
