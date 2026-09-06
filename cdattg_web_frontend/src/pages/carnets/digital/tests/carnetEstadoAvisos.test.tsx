/**
 * Pruebo los avisos y el botón crear del carnet digital.
 * Lo hice para asegurar que, si faltan datos de perfil o foto, se guíe al
 * aprendiz a completarlos y no se muestre el botón de crear.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CarnetEstadoAvisos } from '../CarnetEstadoAvisos';
import type { CarnetDigitalResponse, CarnetFichaOpcion } from '../../../../types/carnet';

function ficha(overrides: Partial<CarnetFichaOpcion> = {}): CarnetFichaOpcion {
  return {
    id: 1,
    numero: '3173334',
    programa: 'Análisis y Desarrollo de Software',
    fecha_fin: '2027-08-18',
    regional: 'Guaviare',
    centro_nombre: 'Centro de Desarrollo Agroindustrial.',
    tipo_formacion: 'FORMACION_REGULAR',
    tipo_label: 'Regular',
    estado_solicitud: 'ninguna',
    accion: 'crear',
    ...overrides,
  };
}

function data(overrides: Partial<CarnetDigitalResponse> = {}): CarnetDigitalResponse {
  return {
    habilitado: false,
    estado_solicitud: 'ninguna',
    puede_solicitar: true,
    datos_listos: true,
    persona: {
      nombres: 'ANA',
      apellidos: 'ROJAS',
      numero_documento: '1',
      tipo_documento_label: 'CC',
      rh: 'O+',
      tiene_foto: true,
    },
    fichas: [],
    cargo_regional: '',
    ...overrides,
  };
}

const avisoCompletar = 'complete los datos requeridos';

describe('CarnetEstadoAvisos', () => {
  it('avisa completar perfil y foto si faltan datos para crear', () => {
    const html = renderToStaticMarkup(
      createElement(CarnetEstadoAvisos, {
        data: data({ datos_listos: false, puede_solicitar: false }),
        ficha: ficha(),
        onEnviar: () => {},
      }),
    );
    expect(html).toContain(avisoCompletar);
    expect(html).not.toContain('Crear carnet digital');
  });

  it('muestra crear cuando los datos están completos', () => {
    const html = renderToStaticMarkup(
      createElement(CarnetEstadoAvisos, { data: data(), ficha: ficha(), onEnviar: () => {} }),
    );
    expect(html).toContain('Crear carnet digital');
    expect(html).not.toContain(avisoCompletar);
  });

  it('no avisa completar si la ficha ya venció', () => {
    const html = renderToStaticMarkup(
      createElement(CarnetEstadoAvisos, {
        data: data({ datos_listos: false, motivo: 'sin_ficha_vigente' }),
        ficha: ficha({ accion: '' }),
        onEnviar: () => {},
      }),
    );
    expect(html).not.toContain(avisoCompletar);
  });
});