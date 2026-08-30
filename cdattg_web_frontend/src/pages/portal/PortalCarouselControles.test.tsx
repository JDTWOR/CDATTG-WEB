/**
 * Aquí miro que las flechas salgan con dos banners y se oculten con uno.
 * Prueba PortalCarouselControles.tsx.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PortalCarouselControles } from './PortalCarouselControles';

const props = {
  indice: 0,
  onIrA: vi.fn(),
  onAnterior: vi.fn(),
  onSiguiente: vi.fn(),
};

describe('PortalCarouselControles', () => {
  it('muestra flechas y puntos si hay varios banners', () => {
    const html = renderToStaticMarkup(createElement(PortalCarouselControles, { ...props, total: 2 }));
    expect(html).toContain('Banner anterior');
    expect(html).toContain('Banner siguiente');
    expect(html).toContain('Diapositiva 1');
    expect(html).toContain('Diapositiva 2');
  });

  it('no muestra controles con un solo banner', () => {
    const html = renderToStaticMarkup(createElement(PortalCarouselControles, { ...props, total: 1 }));
    expect(html).toBe('');
  });
});
