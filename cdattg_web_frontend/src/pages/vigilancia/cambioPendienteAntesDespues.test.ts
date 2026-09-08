import { describe, expect, it } from 'vitest';
import { armarCamposAntesDespues, nombreCampo, parsearCampos } from './cambioPendienteAntesDespues';

describe('cambioPendienteAntesDespues', () => {
  it('muestra el antes de la persona y el despues propuesto', () => {
    const campos = { primer_nombre: 'Ana', rh: 'O+' };
    const persona = { primer_nombre: 'Pedro', rh: 'A+' };
    const filas = armarCamposAntesDespues(campos, persona);
    expect(filas).toEqual([
      { clave: 'primer_nombre', etiqueta: 'Primer nombre', antes: 'Pedro', despues: 'Ana' },
      { clave: 'rh', etiqueta: 'Rh', antes: 'A+', despues: 'O+' },
    ]);
  });

  it('marca con raya cuando no hay valor actual', () => {
    const filas = armarCamposAntesDespues({ segundo_nombre: 'María' }, {});
    expect(filas[0].antes).toBe('—');
  });

  it('convierte el JSON de campos de forma segura', () => {
    expect(parsearCampos('{"rh":"B+"}')).toEqual({ rh: 'B+' });
    expect(parsearCampos('corrupto')).toEqual({});
  });

  it('deja la clave si no conoce el nombre del campo', () => {
    expect(nombreCampo('desconocido')).toBe('desconocido');
  });
});