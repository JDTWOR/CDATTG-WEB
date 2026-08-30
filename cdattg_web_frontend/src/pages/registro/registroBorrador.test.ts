/**
 * Aquí pruebo el borrador del registro: que se guarde, que no lleve la clave,
 * y que un JSON roto no tumbe la página.
 * Prueba registroBorrador.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { borrarBorrador, guardarBorrador, leerBorrador, REGISTRO_BORRADOR_KEY } from './registroBorrador';
import { registroVacio } from './registroForm';

describe('registroBorrador', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda el avance y omite la contraseña', () => {
    guardarBorrador({ ...registroVacio, email: 'a@sena.edu.co', password: 'Clave1234', password_confirm: 'Clave1234' }, 2, [9]);
    const d = leerBorrador();
    expect(d?.form.email).toBe('a@sena.edu.co');
    expect(d?.form.password).toBe('');
    expect(d?.paso).toBe(2);
    expect(d?.ids).toEqual([9]);
  });

  it('devuelve null si no hay borrador', () => {
    expect(leerBorrador()).toBeNull();
  });

  it('ignora JSON corrupto y permite borrar', () => {
    localStorage.setItem(REGISTRO_BORRADOR_KEY, '{no');
    expect(leerBorrador()).toBeNull();
    guardarBorrador(registroVacio, 0, []);
    borrarBorrador();
    expect(localStorage.getItem(REGISTRO_BORRADOR_KEY)).toBeNull();
  });
});
