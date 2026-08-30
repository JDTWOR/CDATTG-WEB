/**
 * Aquí miro que la ficha pública pinte el nombre del semillero.
 * Prueba PortalSemilleroFicha.tsx.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PortalSemilleroFicha } from './PortalSemilleroFicha';
import { semilleroVacio } from '../semillero/semilleroFormState';

describe('PortalSemilleroFicha', () => {
  it('muestra nombre, misión y una línea', () => {
    const html = renderToStaticMarkup(createElement(PortalSemilleroFicha, {
      item: {
        ...semilleroVacio,
        nombre: 'BIO',
        mision: 'Investigar',
        lineas: [{ nombre: 'Aguas', descripcion: 'calidad', estado_publicacion: 'publicado' }],
      },
    }));
    expect(html).toContain('BIO');
    expect(html).toContain('Investigar');
    expect(html).toContain('Aguas');
  });
});
