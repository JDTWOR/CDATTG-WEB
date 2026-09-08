/**
 * Pruebo el filtro de fichas de biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { filtrarItemsBiblioteca } from '../carnetBiblioteca';
import type { CarnetBibliotecaItem } from '../../../types/carnet';

function item(id: number, fichaId: number): CarnetBibliotecaItem {
  return {
    id,
    primer_nombre: 'Ana',
    segundo_nombre: 'Maria',
    primer_apellido: 'Rojas',
    segundo_apellido: 'Perez',
    nombres: 'Ana Maria',
    apellidos: 'Rojas Perez',
    numero_documento: '1',
    rh: 'O+',
    ficha_id: fichaId,
    ficha_numero: String(fichaId),
    programa: 'ADSO',
    instructor_lider: 'Lider',
    tiene_foto: true,
    foto_url: '/api/impresora/carnets/foto?documento=1',
  };
}

describe('filtrarItemsBiblioteca', () => {
  it('deja todos si no hay ficha', () => {
    const rows = [item(1, 8), item(2, 9)];
    expect(filtrarItemsBiblioteca(rows, 0)).toHaveLength(2);
  });

  it('deja solo la ficha elegida', () => {
    const rows = [item(1, 8), item(2, 9)];
    const got = filtrarItemsBiblioteca(rows, 8);
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe(1);
  });
});
