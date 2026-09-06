/**
 * Pruebo los avisos de éxito del módulo de perfil.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/appToast', () => ({
  mostrarToastApp: vi.fn(),
}));

import { mostrarToastApp } from '../../utils/appToast';
import { avisoFotoGuardada, avisoPerfilGuardado } from './avisoExitoPerfil';

describe('avisoPerfilGuardado', () => {
  it('muestra toast success indicando que los datos se guardaron', () => {
    avisoPerfilGuardado();
    expect(mostrarToastApp).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', titulo: 'Perfil actualizado' }),
    );
  });
});

describe('avisoFotoGuardada', () => {
  it('muestra toast success indicando que la foto se guardó', () => {
    avisoFotoGuardada();
    expect(mostrarToastApp).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', titulo: 'Foto guardada' }),
    );
  });
});