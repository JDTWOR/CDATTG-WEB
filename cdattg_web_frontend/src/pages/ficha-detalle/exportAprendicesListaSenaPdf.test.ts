import { describe, expect, it } from 'vitest';
import {
  aprendicesActivosOrdenados,
  nombreArchivoListaAprendices,
} from './exportAprendicesListaSenaPdf';
import type { AprendizResponse } from '../../types';

describe('exportAprendicesListaSenaPdf', () => {
  it('genera nombre de archivo PDF seguro', () => {
    expect(nombreArchivoListaAprendices('3406451')).toBe('lista_aprendices_ficha_3406451.pdf');
    expect(nombreArchivoListaAprendices('ficha/2024')).toBe('lista_aprendices_ficha_ficha_2024.pdf');
  });

  it('ordena aprendices activos por nombre', () => {
    const rows: AprendizResponse[] = [
      {
        id: 2,
        persona_id: 2,
        persona_nombre: 'Zapata',
        ficha_caracterizacion_id: 1,
        estado: true,
      },
      {
        id: 1,
        persona_id: 1,
        persona_nombre: 'Alvarez',
        ficha_caracterizacion_id: 1,
        estado: true,
      },
      {
        id: 3,
        persona_id: 3,
        persona_nombre: 'Inactivo',
        ficha_caracterizacion_id: 1,
        estado: false,
      },
    ];
    const ordenados = aprendicesActivosOrdenados(rows);
    expect(ordenados).toHaveLength(2);
    expect(ordenados.map((a) => a.persona_nombre)).toEqual(['Alvarez', 'Zapata']);
  });
});
