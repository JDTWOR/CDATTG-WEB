/**
 * Aquí compruebo que NINGUNA quite las demás casillas y que el API reciba un solo id.
 * Prueba caracterizacionSeleccion.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { alternarCaracterizacion, idNinguna, parametroIdDesdeChecks } from './caracterizacionSeleccion';

const cars = [
  { id: 1, name: 'CAMPESINO' },
  { id: 2, name: 'INDÍGENA' },
  { id: 9, name: 'NINGUNA' },
];

describe('caracterizacionSeleccion', () => {
  it('localiza NINGUNA ignorando mayúsculas', () => {
    expect(idNinguna(cars)).toBe(9);
    expect(idNinguna([{ id: 1, name: '  ninguna  ' }])).toBe(1);
  });

  it('permite combinar varias categorías', () => {
    expect(alternarCaracterizacion([1], 2, 9)).toEqual([1, 2]);
  });

  it('NINGUNA es exclusiva y se puede desmarcar', () => {
    expect(alternarCaracterizacion([1, 2], 9, 9)).toEqual([9]);
    expect(alternarCaracterizacion([9], 9, 9)).toEqual([]);
  });

  it('quitar una deja el resto y el API usa el primer id', () => {
    expect(alternarCaracterizacion([1, 2], 1, 9)).toEqual([2]);
    expect(parametroIdDesdeChecks([2, 1])).toBe(2);
    expect(parametroIdDesdeChecks([])).toBe(0);
  });
});
