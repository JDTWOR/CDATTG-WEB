import type { InstructorAgendaEvent } from '../../types/agenda';

export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 24;
export const GRID_SLOT_MINUTES = 60;
export const SLOT_HEIGHT_PX = 48;

export type GridTimeRange = { startMinutes: number; endMinutes: number };

export const DEFAULT_GRID_RANGE: GridTimeRange = {
  startMinutes: GRID_START_HOUR * 60,
  endMinutes: GRID_END_HOUR * 60,
};

const FICHA_COLORS = [
  'bg-primary-500/90 border-primary-600',
  'bg-emerald-500/90 border-emerald-600',
  'bg-violet-500/90 border-violet-600',
  'bg-amber-500/90 border-amber-600',
  'bg-rose-500/90 border-rose-600',
  'bg-cyan-500/90 border-cyan-600',
];

export function gridBodyHeightPx(range: GridTimeRange = DEFAULT_GRID_RANGE): number {
  const hours = (range.endMinutes - range.startMinutes) / GRID_SLOT_MINUTES;
  return hours * SLOT_HEIGHT_PX;
}

export function hourTicksForRange(range: GridTimeRange): { hour: number; label: string; topPercent: number }[] {
  const startHour = Math.floor(range.startMinutes / 60);
  const endHour = Math.ceil(range.endMinutes / 60);
  const total = range.endMinutes - range.startMinutes;
  if (total <= 0) return [];

  const ticks: { hour: number; label: string; topPercent: number }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const minute = h * 60;
    const topPercent = Math.max(0, Math.min(100, ((minute - range.startMinutes) / total) * 100));
    ticks.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      topPercent,
    });
  }
  return ticks;
}

export function computeGridTimeRangeFromEvents(
  events: InstructorAgendaEvent[],
  marginMinutes = 30,
): GridTimeRange {
  if (events.length === 0) {
    return DEFAULT_GRID_RANGE;
  }

  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = Number.NEGATIVE_INFINITY;

  for (const ev of events) {
    const start = parseTimeToMinutes(ev.hora_inicio);
    const end = parseTimeToMinutes(ev.hora_fin);
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }

  const startMinutes = Math.max(GRID_START_HOUR * 60, minStart - marginMinutes);
  const endMinutes = Math.min(24 * 60, maxEnd + marginMinutes);

  if (endMinutes <= startMinutes) {
    return DEFAULT_GRID_RANGE;
  }

  return { startMinutes, endMinutes };
}

export function formatGridRangeLabel(range: GridTimeRange): string {
  const formatMinutes = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  return `${formatMinutes(range.startMinutes)}–${formatMinutes(range.endMinutes)}`;
}

export function buildInstructorColorMap(events: InstructorAgendaEvent[]): Map<number, string> {
  const instructors = uniqueInstructorsFromEvents(events);
  const map = new Map<number, string>();
  instructors.forEach((ins, i) => {
    map.set(ins.id, FICHA_COLORS[i % FICHA_COLORS.length]);
  });
  return map;
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Duración de un bloque horario en minutos (horario de pared). */
export function duracionBloqueMinutos(horaInicio: unknown, horaFin: unknown): number {
  const inicioStr = extractHoraHHMM(horaInicio);
  const finStr = extractHoraHHMM(horaFin);
  if (!inicioStr || !finStr) {
    return 0;
  }
  const start = parseTimeToMinutes(inicioStr);
  let end = parseTimeToMinutes(finStr);
  if (end < start) {
    end += 24 * 60;
  }
  return Math.max(0, end - start);
}

export function totalMinutosProgramados(
  eventos: Pick<InstructorAgendaEvent, 'hora_inicio' | 'hora_fin'>[],
): number {
  return eventos.reduce((acc, ev) => acc + duracionBloqueMinutos(ev.hora_inicio, ev.hora_fin), 0);
}

/** Ej.: "42 h", "42 h 30 min". */
export function formatHorasProgramadas(totalMinutos: number): string {
  if (totalMinutos <= 0) {
    return '0 h';
  }
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (m === 0) {
    return `${h} h`;
  }
  return `${h} h ${m} min`;
}

export function formatMesAnioLabel(d: Date): string {
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Extrae HH:MM de la API sin aplicar zona horaria (horario de pared). */
export function extractHoraHHMM(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') {
    const text = raw.trim();
    const wall = /^(\d{1,2}):(\d{2})/.exec(text);
    if (wall) {
      return `${wall[1].padStart(2, '0')}:${wall[2]}`;
    }
    const iso = /T(\d{1,2}):(\d{2})/.exec(text);
    if (iso) {
      return `${iso[1].padStart(2, '0')}:${iso[2]}`;
    }
    return text.slice(0, 5);
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return extractHoraHHMM(raw.toISOString());
  }
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return extractHoraHHMM(String(raw));
  }
  return '';
}

export function parseTimeToMinutes(raw: unknown): number {
  const hhmm = extractHoraHHMM(raw);
  const parts = hhmm.split(':');
  const h = Number.parseInt(parts[0] ?? '0', 10);
  const m = Number.parseInt(parts[1] ?? '0', 10);
  return h * 60 + m;
}

/** Minutos después de hora_fin en que aún cuenta como ventana activa (alineado con backend). */
export const EXTENSION_FIN_JORNADA_MIN = 60;

export function minutosDelDia(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Indica si `now` cae en [hora_inicio, hora_fin + extensión] del evento (horario de pared).
 * Espejo de validarHorarioRango en el backend.
 */
export function eventoEnHorarioActual(
  event: Pick<InstructorAgendaEvent, 'hora_inicio' | 'hora_fin'>,
  now: Date = new Date(),
  extMin = EXTENSION_FIN_JORNADA_MIN,
): boolean {
  const inicioStr = extractHoraHHMM(event.hora_inicio);
  const finStr = extractHoraHHMM(event.hora_fin);
  if (!inicioStr || !finStr) {
    return false;
  }

  let actual = minutosDelDia(now);
  const start = parseTimeToMinutes(inicioStr);
  let end = parseTimeToMinutes(finStr);

  if (end < start) {
    end += 24 * 60;
    if (actual < start) {
      actual += 24 * 60;
    }
  }

  const endEffective = end + extMin;
  return actual >= start && actual <= endEffective;
}

export function weekDaysFromStart(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function eventsForDay(events: InstructorAgendaEvent[], isoDate: string): InstructorAgendaEvent[] {
  return events.filter((e) => e.fecha === isoDate);
}

export function eventTopPercent(horaInicio: string, range: GridTimeRange = DEFAULT_GRID_RANGE): number {
  const total = range.endMinutes - range.startMinutes;
  if (total <= 0) return 0;
  const ev = parseTimeToMinutes(horaInicio);
  return Math.max(0, Math.min(100, ((ev - range.startMinutes) / total) * 100));
}

export function eventHeightPercent(
  horaInicio: string,
  horaFin: string,
  range: GridTimeRange = DEFAULT_GRID_RANGE,
): number {
  const total = range.endMinutes - range.startMinutes;
  if (total <= 0) return 0;
  const dur = Math.max(30, parseTimeToMinutes(horaFin) - parseTimeToMinutes(horaInicio));
  return Math.min(100, (dur / total) * 100);
}

export function colorClassForInstructor(
  instructorId: number | undefined,
  mode: 'instructor' | 'ficha',
  colorMap?: Map<number, string>,
): string {
  if (mode === 'instructor') {
    return 'bg-primary-600/90 border-primary-700';
  }
  if (colorMap && instructorId != null) {
    const mapped = colorMap.get(instructorId);
    if (mapped) return mapped;
  }
  return FICHA_COLORS[0];
}

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function uniqueInstructorsFromEvents(
  events: InstructorAgendaEvent[],
): { id: number; nombre: string }[] {
  const map = new Map<number, string>();
  for (const ev of events) {
    if (ev.instructor_id != null && ev.instructor_nombre) {
      map.set(ev.instructor_id, ev.instructor_nombre);
    }
  }
  return Array.from(map.entries())
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}
