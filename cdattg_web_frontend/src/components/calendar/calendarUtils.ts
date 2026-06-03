import type { InstructorAgendaEvent } from '../../types/agenda';

export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 23;
export const GRID_SLOT_MINUTES = 60;

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

export function parseTimeToMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  const h = Number.parseInt(parts[0] ?? '0', 10);
  const m = Number.parseInt(parts[1] ?? '0', 10);
  return h * 60 + m;
}

export function weekDaysFromStart(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function eventsForDay(events: InstructorAgendaEvent[], isoDate: string): InstructorAgendaEvent[] {
  return events.filter((e) => e.fecha === isoDate);
}

export function eventTopPercent(horaInicio: string): number {
  const startMin = GRID_START_HOUR * 60;
  const endMin = GRID_END_HOUR * 60;
  const total = endMin - startMin;
  const ev = parseTimeToMinutes(horaInicio);
  return Math.max(0, Math.min(100, ((ev - startMin) / total) * 100));
}

export function eventHeightPercent(horaInicio: string, horaFin: string): number {
  const startMin = GRID_START_HOUR * 60;
  const endMin = GRID_END_HOUR * 60;
  const total = endMin - startMin;
  const dur = Math.max(30, parseTimeToMinutes(horaFin) - parseTimeToMinutes(horaInicio));
  return Math.min(100, (dur / total) * 100);
}

const FICHA_COLORS = [
  'bg-primary-500/90 border-primary-600',
  'bg-emerald-500/90 border-emerald-600',
  'bg-violet-500/90 border-violet-600',
  'bg-amber-500/90 border-amber-600',
  'bg-rose-500/90 border-rose-600',
  'bg-cyan-500/90 border-cyan-600',
];

export function colorClassForInstructor(instructorId: number | undefined, mode: 'instructor' | 'ficha'): string {
  if (mode === 'instructor') {
    return 'bg-primary-600/90 border-primary-700';
  }
  const id = instructorId ?? 0;
  return FICHA_COLORS[id % FICHA_COLORS.length];
}

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
