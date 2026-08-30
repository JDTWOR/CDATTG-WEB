/**
 * Pruebo que las fichas se agrupen por regular, media y complementaria.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { agruparFichasPorTipo } from './carnetFichaGrupo';
import type { CarnetFichaOpcion } from '../../types/carnet';

function ficha(partial: Partial<CarnetFichaOpcion>): CarnetFichaOpcion {
  return {
    id: 1,
    numero: '1',
    programa: 'ADSO',
    fecha_fin: '',
    regional: 'Regional. Guaviare',
    centro_nombre: '',
    tipo_formacion: 'FORMACION_REGULAR',
    tipo_label: 'Regular',
    estado_solicitud: 'ninguna',
    accion: 'crear',
    ...partial,
  };
}

describe('agruparFichasPorTipo', () => {
  it('agrupa complementaria aparte de regular', () => {
    const grupos = agruparFichasPorTipo([
      ficha({ id: 2, tipo_formacion: 'FORMACION_COMPLEMENTARIA', tipo_label: 'Complementaria' }),
      ficha({ id: 1 }),
    ]);
    expect(grupos.map((g) => g.tipo)).toEqual(['FORMACION_REGULAR', 'FORMACION_COMPLEMENTARIA']);
    expect(grupos[0].fichas[0].id).toBe(1);
  });

  it('devuelve vacío si no hay fichas', () => {
    expect(agruparFichasPorTipo([])).toEqual([]);
  });
});
