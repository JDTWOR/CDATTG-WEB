/**
 * Compruebo que AppLink deje un href interno.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLink } from './AppLink';

describe('AppLink', () => {
  it('pinta href interno', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(AppLink, { path: '/x' }, 'Hola')),
    );
    expect(html).toContain('href="/x"');
    expect(html).toContain('Hola');
  });
});
