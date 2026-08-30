/**
 * Aquí miro el aviso de datos, la barra de pasos y los botones Atrás / Siguiente.
 * Prueba RegistroAvisoDatos, RegistroAcciones y RegistroProgreso.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RegistroAvisoDatos } from './RegistroAvisoDatos';
import { RegistroAcciones } from './RegistroAcciones';
import { RegistroProgreso } from './RegistroProgreso';

describe('pie y aviso del registro', () => {
  it('explica por qué se piden los datos', () => {
    const html = renderToStaticMarkup(createElement(RegistroAvisoDatos));
    expect(html).toContain('¿Por qué pedimos estos datos?');
    expect(html).toContain('identidad');
  });

  it('muestra Siguiente en el primer paso', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(RegistroAcciones, { paso: 0, saving: false, onAtras: () => undefined })),
    );
    expect(html).toContain('Siguiente');
    expect(html).toContain('Volver al inicio');
    expect(html).not.toContain('Atrás');
  });

  it('muestra registrar en el último paso y Atrás sutil', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(RegistroAcciones, { paso: 4, saving: false, onAtras: () => undefined })),
    );
    expect(html).toContain('Registrarme ahora');
    expect(html).toContain('Atrás');
    expect(html).toContain('política de privacidad del SENA');
  });

  it('indica el paso actual en la barra', () => {
    const html = renderToStaticMarkup(createElement(RegistroProgreso, { paso: 2 }));
    expect(html).toContain('Paso 3 de 5');
    expect(html).toContain('Contacto');
  });
});
