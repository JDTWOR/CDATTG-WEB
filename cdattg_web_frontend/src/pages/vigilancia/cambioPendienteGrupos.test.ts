import { describe, expect, it } from 'vitest';
import type { CambioPendiente } from './CambioPendienteCard';
import { agruparPorPersona, filtrarGrupos, normalizarTexto } from './cambioPendienteGrupos';

function cambio(id: number, personaId: number, nombre = 'Ana', documento = '123'): CambioPendiente {
  return {
    id,
    persona_id: personaId,
    campos: '{}',
    estado: 'pendiente',
    foto_path: '',
    created_at: '',
    persona: { primer_nombre: nombre, primer_apellido: 'López', numero_documento: documento },
  };
}

describe('cambioPendienteGrupos', () => {
  it('agrupa varios cambios de la misma persona en una carpeta', () => {
    const grupos = agruparPorPersona([cambio(1, 7), cambio(2, 8), cambio(3, 7)]);
    expect(grupos).toHaveLength(2);
    expect(grupos[0].cambios.map((c) => c.id)).toEqual([1, 3]);
  });

  it('usa un respaldo cuando la persona no trae datos', () => {
    const sinPersona: CambioPendiente = { ...cambio(1, 9), persona: undefined };
    const grupos = agruparPorPersona([sinPersona]);
    expect(grupos[0].nombre).toBe('Persona #9');
  });

  it('filtra por nombre ignorando tildes y mayúsculas', () => {
    const grupos = [agruparPorPersona([cambio(1, 7, 'Jesús')])[0]];
    expect(filtrarGrupos(grupos, 'jesus')).toHaveLength(1);
    expect(filtrarGrupos(grupos, 'garcia')).toHaveLength(0);
  });

  it('filtra por documento y devuelve todo con búsqueda vacía', () => {
    const grupos = [agruparPorPersona([cambio(1, 7, 'Ana', 'CC 1050')])[0]];
    expect(filtrarGrupos(grupos, '1050')).toHaveLength(1);
    expect(filtrarGrupos(grupos, '')).toHaveLength(1);
  });

  it('normaliza tildes a texto plano', () => {
    expect(normalizarTexto('JOSÉ  María')).toBe('jose maria');
  });
});