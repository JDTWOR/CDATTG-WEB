/**
 * Aquí miro que el carrusel quede del ancho de las tarjetas y tenga flechas.
 * Prueba PortalCarousel.tsx. No llamo al API: le paso banners de mentira.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PortalBannerItem } from '../../types/portal';
import { PortalCarousel } from './PortalCarousel';

/**
 * Banner mínimo para el markup.
 */
function banner(id: number): PortalBannerItem {
  return {
    id,
    titulo: `Banner ${id}`,
    descripcion: '',
    imagen_url: '',
    etiqueta: '',
    boton_texto: '',
    enlace_url: '',
    orden: id,
    estado_publicacion: 'publicado',
  };
}

describe('PortalCarousel', () => {
  it('se alinea al contenido y muestra flechas laterales', () => {
    const html = renderToStaticMarkup(
      createElement(PortalCarousel, { banners: [banner(1), banner(2)] }),
    );
    expect(html).toContain('max-w-6xl');
    expect(html).toContain('rounded-xl');
    expect(html).toContain('Banner anterior');
    expect(html).toContain('Banner siguiente');
    expect(html).not.toContain('bg-sena-green');
  });

  it('sin banners no muestra flechas', () => {
    const html = renderToStaticMarkup(createElement(PortalCarousel, { banners: [] }));
    expect(html).not.toContain('Banner anterior');
  });
});
