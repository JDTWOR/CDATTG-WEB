import { describe, expect, it, vi } from 'vitest';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockReturnValue(undefined) },
}));

import Swal from 'sweetalert2';
import { mostrarToastApp } from './appToast';

describe('mostrarToastApp', () => {
  it('lanza un toast con las opciones recibidas', () => {
    mostrarToastApp({ icon: 'success', titulo: 'Cambios enviados', texto: 'Acérquese a portería.' });
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        toast: true,
        icon: 'success',
        title: 'Cambios enviados',
        text: 'Acérquese a portería.',
        timer: 7000,
      }),
    );
  });

  it('respeta el timer indicado', () => {
    mostrarToastApp({ icon: 'info', titulo: 'Aviso', texto: 'Cierre la ventana', timer: 2500 });
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ timer: 2500 }));
  });

  it('no lanza error aunque SweetAlert2 falle', () => {
    vi.mocked(Swal.fire).mockReturnValueOnce({ then() { throw new Error('boom'); } } as never);
    expect(() => mostrarToastApp({ icon: 'success', titulo: 'T', texto: 'X' })).not.toThrow();
  });
});