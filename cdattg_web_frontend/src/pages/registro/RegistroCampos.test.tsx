/**
 * Aquí compruebo que RegistroCampos pinte solo el paso de ahora.
 * No monto el wizard completo: le paso un formulario vacío y el número de paso.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { registroVacio } from './registroForm';
import { RegistroCampos } from './RegistroCampos';

const bind = { errores: {}, tocar: () => undefined };
const base = {
  form: registroVacio, set: () => undefined, setForm: () => undefined, bind,
  tipos: [], generos: [], cars: [{ id: 9, name: 'NINGUNA' }],
  paises: [], deps: [], muns: [], ids: [] as number[], onToggle: () => undefined,
};

describe('RegistroCampos', () => {
  it('en identidad no muestra acceso ni dirección', () => {
    const html = renderToStaticMarkup(createElement(RegistroCampos, { ...base, paso: 0 }));
    expect(html).toContain('Identidad');
    expect(html).toContain('Sin puntos, guiones ni espacios');
    expect(html).not.toContain('Contraseña');
    expect(html).not.toContain('Dirección deshabilitada');
  });

  it('en ubicación muestra el aviso de dirección', () => {
    const html = renderToStaticMarkup(createElement(RegistroCampos, { ...base, paso: 3 }));
    expect(html).toContain('Ubicación');
    expect(html).toContain('Dirección deshabilitada');
    expect(html).not.toContain('NINGUNA');
  });

  it('en cuenta muestra caracterización y acceso', () => {
    const html = renderToStaticMarkup(createElement(RegistroCampos, { ...base, paso: 4 }));
    expect(html).toContain('Caracterización');
    expect(html).toContain('NINGUNA');
    expect(html).toContain('Acceso');
  });

  it('marca campos opcionales en el nombre', () => {
    const html = renderToStaticMarkup(createElement(RegistroCampos, { ...base, paso: 1 }));
    expect(html).toContain('Nombre');
    expect(html).toContain('(opcional)');
  });
});
