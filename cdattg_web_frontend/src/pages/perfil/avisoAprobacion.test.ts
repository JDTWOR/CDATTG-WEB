import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/appToast', () => ({
  mostrarToastApp: vi.fn(),
}));

import { mostrarToastApp } from '../../utils/appToast';
import { avisoAprobacionPorteria, construirAvisoAprobacion } from './avisoAprobacion';

describe('construirAvisoAprobacion', () => {
  it('para datos indica acercarse a portería para actualizar datos', () => {
    const aviso = construirAvisoAprobacion('datos');
    expect(aviso.titulo).toBe('Cambios enviados para aprobación');
    expect(aviso.texto).toContain('portería');
    expect(aviso.texto).toContain('actualizar sus datos');
  });

  it('para foto indica acercarse a portería para validar', () => {
    const aviso = construirAvisoAprobacion('foto');
    expect(aviso.titulo).toBe('Foto enviada para aprobación');
    expect(aviso.texto).toContain('portería');
    expect(aviso.texto).toContain('validar sus datos');
  });
});

describe('avisoAprobacionPorteria', () => {
  it('muestra el toast de estado success con el texto según el tipo', () => {
    avisoAprobacionPorteria('datos');
    expect(mostrarToastApp).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', titulo: 'Cambios enviados para aprobación' }),
    );
  });
});