import { describe, expect, it } from 'vitest';
import {
  formatDiaSemana,
  formatFechaVista,
  formatHoraVista,
  formatLocalISOColombia,
  fromDatetimeLocalColombia,
  toDatetimeLocalColombia,
} from './formatFecha';

describe('formatFechaVista', () => {
  it('formatea ISO yyyy-MM-dd como dd/mm/yyyy', () => {
    expect(formatFechaVista('2026-06-21')).toBe('21/06/2026');
    expect(formatFechaVista('2026-06-21T15:00:00Z')).toBe('21/06/2026');
  });

  it('devuelve em dash para valores vacíos', () => {
    expect(formatFechaVista(null)).toBe('—');
    expect(formatFechaVista('')).toBe('—');
  });
});

describe('formatHoraVista', () => {
  it('convierte UTC a hora de Bogotá (UTC-5)', () => {
    expect(formatHoraVista('2026-06-21T19:30:00Z')).toBe('14:30');
    expect(formatHoraVista('2026-06-21T04:00:00Z')).toBe('23:00');
  });
});

describe('formatDiaSemana', () => {
  it('devuelve día capitalizado', () => {
    expect(formatDiaSemana('2026-06-21')).toBe('Domingo');
  });
});

describe('formatLocalISOColombia', () => {
  it('usa zona horaria Colombia', () => {
    const utc = new Date('2026-06-21T04:00:00Z');
    expect(formatLocalISOColombia(utc)).toBe('2026-06-20');
  });
});

describe('datetime-local Colombia', () => {
  it('convierte ISO a datetime-local y viceversa', () => {
    const iso = '2026-06-21T19:30:00.000Z';
    expect(toDatetimeLocalColombia(iso)).toBe('2026-06-21T14:30');
    expect(fromDatetimeLocalColombia('2026-06-21T14:30')).toBe('2026-06-21T19:30:00.000Z');
  });
});
