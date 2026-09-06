/**
 * Pruebo los avisos de éxito del módulo de perfil.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/appToast', () => ({
  mostrarToastApp: vi.fn(),
}));

import { mostrarToastApp } from '../../utils/appToast';
import { avisoPerfilGuardado } from './avisoExitoPerfil';

describe('avisoPerfilGuardado', () => {
  it('muestra toast success indicando que los datos se guardaron', () => {
    avisoPerfilGuardado();
    expect(mostrarToastApp).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', titulo: 'Perfil actualizado' }),
    );
  });
});