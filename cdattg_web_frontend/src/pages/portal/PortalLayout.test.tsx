/**
 * Aquí miro que la cabecera del portal traiga Inicio, Investigación, login,
 * registro y el botón de claro/oscuro. Fingo que nadie ha iniciado sesión.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PortalLayout } from './PortalLayout';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, roles: [], permissions: [] }),
}));

describe('PortalLayout', () => {
  it('muestra marca, investigación, login, registro y modo', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(PortalLayout)),
    );
    expect(html).toContain('SENA Regional Guaviare');
    expect(html).toContain('Investigación');
    expect(html).toContain('Iniciar Sesión');
    expect(html).toContain('Registrarse');
    expect(html).toContain('Cambiar a modo oscuro');
  });
});
