import type { FichaCaracterizacionResponse } from '../types';

/** Mismo mapeo que WeekdayToDiaFormacionID en backend Go: 1=lunes … 6=sábado, 7=domingo. */
export function weekdayToDiaFormacionId(date: Date): number {
  const w = date.getDay();
  return w === 0 ? 7 : w;
}

function formatHoraRango(horaInicio: string, horaFin: string): string {
  const inicio = horaInicio.trim().slice(0, 5);
  const fin = horaFin.trim().slice(0, 5);
  if (!inicio || !fin) return '';
  return `${inicio}–${fin}`;
}

/** Horario de la ficha para el día de referencia; null si no hay clase ese día. */
export function getHorarioHoy(
  ficha: FichaCaracterizacionResponse,
  refDate: Date = new Date(),
): string | null {
  const dias = ficha.dias_formacion;
  if (!dias?.length) return null;

  const diaHoy = weekdayToDiaFormacionId(refDate);
  const match = dias.find((d) => d.dia_formacion_id === diaHoy);
  if (!match?.hora_inicio || !match.hora_fin) return null;

  const rango = formatHoraRango(match.hora_inicio, match.hora_fin);
  return rango || null;
}
