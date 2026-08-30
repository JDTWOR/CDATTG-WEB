/**
 * Aquí miro que el botón de luna diga “pasar a oscuro” y el de sol “pasar a claro”.
 * Prueba ThemeToggle.tsx. Fingo el tema con un mock.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

vi.mock('../context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

describe('ThemeToggle', () => {
  it('ofrece pasar a oscuro cuando el tema es claro', () => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    expect(renderToStaticMarkup(createElement(ThemeToggle))).toContain('Cambiar a modo oscuro');
  });

  it('ofrece pasar a claro cuando el tema es oscuro', () => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
    expect(renderToStaticMarkup(createElement(ThemeToggle))).toContain('Cambiar a modo claro');
  });

  it('acepta clases extra en el botón', () => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    expect(renderToStaticMarkup(createElement(ThemeToggle, { className: 'extra-clase' }))).toContain(
      'extra-clase',
    );
  });
});
