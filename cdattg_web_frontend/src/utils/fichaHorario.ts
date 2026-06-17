import type { FichaCaracterizacionResponse } from '../types';
import type { InstructorAgendaEvent } from '../types/agenda';
import { eventoEnHorarioActual, formatLocalISO } from '../components/calendar/calendarUtils';

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

/** Ficha sin días ni fechas de programación (modo legacy en backend). */
export function fichaPermiteAsistenciaLegacy(ficha: FichaCaracterizacionResponse): boolean {
  const sinDias = !ficha.dias_formacion?.length && !ficha.dias_formacion_ids?.length;
  const sinFechas = !ficha.fecha_inicio && !ficha.fecha_fin;
  return sinDias && sinFechas;
}

export function fichaEnHorarioAsistencia(
  fichaId: number,
  eventosHoy: InstructorAgendaEvent[],
  now: Date = new Date(),
): boolean {
  const hoy = formatLocalISO(now);
  return eventosHoy.some(
    (evento) =>
      evento.ficha_id === fichaId && evento.fecha === hoy && eventoEnHorarioActual(evento, now),
  );
}

/** Bloques de agenda del instructor para la ficha en la fecha de referencia. */
export function eventosFichaEnFecha(
  fichaId: number,
  eventos: InstructorAgendaEvent[],
  refDate: Date = new Date(),
): InstructorAgendaEvent[] {
  const iso = formatLocalISO(refDate);
  return eventos.filter((evento) => evento.ficha_id === fichaId && evento.fecha === iso);
}

/** Horario programado del instructor para la ficha hoy (según agenda, no solo días de la ficha). */
export function getHorarioHoyInstructor(
  fichaId: number,
  eventosHoy: InstructorAgendaEvent[],
  now: Date = new Date(),
): string | null {
  const bloques = eventosFichaEnFecha(fichaId, eventosHoy, now)
    .map((evento) => formatHoraRango(evento.hora_inicio, evento.hora_fin))
    .filter(Boolean);
  if (bloques.length === 0) return null;
  return bloques.join(', ');
}

/** Indica si el instructor puede entrar a tomar asistencia en este momento. */
export function puedeTomarAsistenciaAhora(
  ficha: FichaCaracterizacionResponse,
  eventosHoy: InstructorAgendaEvent[],
  now: Date = new Date(),
  relaxarRestriccionAsistencia = false,
): boolean {
  if (relaxarRestriccionAsistencia) {
    return true;
  }
  if (fichaPermiteAsistenciaLegacy(ficha)) {
    return true;
  }
  return fichaEnHorarioAsistencia(ficha.id, eventosHoy, now);
}

/** Texto auxiliar cuando el botón de asistencia no está disponible. */
export function mensajeEstadoAsistenciaFicha(
  ficha: FichaCaracterizacionResponse,
  eventosHoy: InstructorAgendaEvent[],
  now: Date = new Date(),
  relaxarRestriccionAsistencia = false,
): string {
  if (puedeTomarAsistenciaAhora(ficha, eventosHoy, now, relaxarRestriccionAsistencia)) {
    return '';
  }

  const horarioInstructor = getHorarioHoyInstructor(ficha.id, eventosHoy, now);
  if (horarioInstructor) {
    return `Disponible en horario ${horarioInstructor}`;
  }

  return 'Sin clase programada hoy';
}
