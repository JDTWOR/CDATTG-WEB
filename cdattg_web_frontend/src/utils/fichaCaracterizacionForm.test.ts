import { describe, expect, it } from 'vitest';
import {
  construirPayloadFicha,
  formStateFromFicha,
} from './fichaCaracterizacionForm';
import type {
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
} from '../types';

function fichaResponse(overrides: Partial<FichaCaracterizacionResponse> = {}): FichaCaracterizacionResponse {
  return {
    id: 1,
    ficha: '2520001',
    nombre: '',
    tipo_formacion: 'REGULAR',
    status: true,
    dias_formacion_ids: [],
    horarios: [],
    ...overrides,
  };
}

describe('construirPayloadFicha status_manual', () => {
  it('envía null cuando el modo es automático por fechas', () => {
    const form: FichaCaracterizacionRequest = {
      ficha: '2520001',
      tipo_formacion: 'REGULAR',
      status: true,
      status_manual: null,
      horarios: [{ dia_formacion_id: 1, hora_inicio: '07:00', hora_fin: '13:00' }],
    };
    const payload = construirPayloadFicha(form, null, []);
    expect(payload.status_manual).toBeNull();
    expect(payload.status).toBe(true);
  });

  it('envía el override manual tal cual', () => {
    const form: FichaCaracterizacionRequest = {
      ficha: '2520001',
      tipo_formacion: 'REGULAR',
      status: false,
      status_manual: false,
      horarios: [{ dia_formacion_id: 1, hora_inicio: '07:00', hora_fin: '13:00' }],
    };
    const payload = construirPayloadFicha(form, null, []);
    expect(payload.status_manual).toBe(false);
    expect(payload.status).toBe(false);
  });

  it('normaliza undefined a null', () => {
    const form: FichaCaracterizacionRequest = {
      ficha: '2520001',
      tipo_formacion: 'REGULAR',
      status: true,
      status_manual: undefined,
      horarios: [{ dia_formacion_id: 1, hora_inicio: '07:00', hora_fin: '13:00' }],
    };
    const payload = construirPayloadFicha(form, null, []);
    expect(payload.status_manual).toBeNull();
  });
});

describe('formStateFromFicha status_manual', () => {
  it('trae el override manual de la respuesta', () => {
    const form = formStateFromFicha(fichaResponse({ status: false, status_manual: false }));
    expect(form.status_manual).toBe(false);
    expect(form.status).toBe(false);
  });

  it('usa null cuando la ficha es automática (sin status_manual)', () => {
    const form = formStateFromFicha(fichaResponse({ status: true }));
    expect(form.status_manual).toBeNull();
  });

  it('usa null cuando la respuesta trae status_manual nil explícito', () => {
    const form = formStateFromFicha(fichaResponse({ status: false, status_manual: null }));
    expect(form.status_manual).toBeNull();
  });

  it('mantiene la fecha fin de la respuesta en el form', () => {
    const form = formStateFromFicha(fichaResponse({ fecha_fin: '2026-12-31T00:00:00Z' }));
    expect(form.fecha_fin).toBe('2026-12-31');
  });
});