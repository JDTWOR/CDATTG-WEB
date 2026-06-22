export const LOCALE_CO = 'es-CO' as const;
export const TZ_COLOMBIA = 'America/Bogota' as const;

type DateInput = string | Date | null | undefined;

function parseDate(input: DateInput): Date | null {
  if (input == null || input === '') return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const s = String(input).trim();
  if (!s) return null;
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatWithOptions(
  input: DateInput,
  options: Intl.DateTimeFormatOptions,
  fallback = '—',
): string {
  const dt = parseDate(input);
  if (!dt) return fallback;
  return new Intl.DateTimeFormat(LOCALE_CO, {
    timeZone: TZ_COLOMBIA,
    ...options,
  }).format(dt);
}

function capitalizeEs(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Fecha de hoy en Colombia (yyyy-MM-dd). */
export function hoyISOColombia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ_COLOMBIA });
}

/** Año actual en zona horaria Colombia. */
export function anioActualColombia(): number {
  const y = formatWithOptions(new Date(), { year: 'numeric' }, '');
  return Number(y) || new Date().getFullYear();
}

/** Fecha ISO (yyyy-MM-dd) en zona horaria Colombia. */
export function formatLocalISOColombia(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ_COLOMBIA });
}

/** Indica si la fecha ISO corresponde al día actual en Colombia. */
export function esFechaHoyColombia(fecha: string): boolean {
  return fecha.slice(0, 10) === hoyISOColombia();
}

/** Etiqueta contextual: "hoy" o "el dd/mm/yyyy" para textos del dashboard. */
export function etiquetaDiaConsulta(fecha: string): string {
  if (esFechaHoyColombia(fecha)) return 'hoy';
  return `el ${formatFechaVista(fecha)}`;
}

/** Fecha legible (dd/mm/yyyy) desde ISO, yyyy-MM-dd o timestamp. */
export function formatFechaVista(iso?: string | null): string {
  if (iso == null || iso === '') return '—';
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return formatWithOptions(s, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }, s);
}

/** Hora legible (HH:mm) en zona horaria Colombia. */
export function formatHoraVista(iso?: string | null): string {
  if (iso == null || iso === '') return '—';
  return formatWithOptions(iso, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Fecha corta + hora corta en zona horaria Colombia. */
export function formatFechaHoraVista(iso?: string | null): string {
  if (iso == null || iso === '') return '—';
  const fecha = formatWithOptions(iso, { dateStyle: 'short' });
  const hora = formatWithOptions(iso, { timeStyle: 'short' });
  return `${fecha} ${hora}`;
}

/** Timestamp legible completo (fecha y hora) en zona horaria Colombia. */
export function formatFechaHoraCompleta(d: Date = new Date()): string {
  return formatWithOptions(d, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

/** Fecha larga: "lunes, 21 de junio de 2026". */
export function formatFechaLarga(fechaIso: string): string {
  const iso = fechaIso.slice(0, 10);
  return formatWithOptions(`${iso}T12:00:00`, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }, iso);
}

/** Día de la semana capitalizado: "Lunes". */
export function formatDiaSemana(fechaIso: string): string {
  const iso = fechaIso.slice(0, 10);
  const dia = formatWithOptions(`${iso}T12:00:00`, { weekday: 'long' }, '');
  return capitalizeEs(dia);
}

/** Etiqueta de mes y año: "Junio 2026". */
export function formatMesAnioLabel(d: Date): string {
  const raw = new Intl.DateTimeFormat(LOCALE_CO, {
    timeZone: TZ_COLOMBIA,
    month: 'long',
    year: 'numeric',
  }).format(d);
  return capitalizeEs(raw);
}

/** Etiqueta de mes y año desde ISO yyyy-MM o yyyy-MM-dd. */
export function formatMesAnioDesdeIso(fechaIso: string): string {
  const dt = parseDate(`${fechaIso.slice(0, 7)}-01T12:00:00`);
  if (!dt) return fechaIso.slice(0, 7);
  return formatMesAnioLabel(dt);
}

/** Número con separador de miles según locale Colombia. */
export function formatNumero(n: number | null | undefined, fallback = '—'): string {
  if (n == null || Number.isNaN(n)) return fallback;
  return n.toLocaleString(LOCALE_CO);
}

/** Valor para input datetime-local interpretado en zona horaria Colombia. */
export function toDatetimeLocalColombia(value?: string): string {
  if (!value) return '';
  const dt = parseDate(value);
  if (!dt) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Convierte valor de input datetime-local (hora de pared Colombia) a ISO UTC.
 * El string del input no incluye zona horaria; se interpreta como America/Bogota (UTC-5).
 */
export function fromDatetimeLocalColombia(value: string): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, ys, mos, ds, hs, mis] = match;
  const y = Number(ys);
  const mo = Number(mos);
  const d = Number(ds);
  const h = Number(hs);
  const mi = Number(mis);
  const utc = new Date(Date.UTC(y, mo - 1, d, h + 5, mi, 0, 0));
  if (Number.isNaN(utc.getTime())) return null;
  return utc.toISOString();
}

/** Rango de fechas formateado; null si no hay ninguna. */
export function formatRangoFechasVista(
  inicio?: string | null,
  fin?: string | null,
  separador = ' → ',
): string | null {
  if (!inicio && !fin) return null;
  const partes = [inicio, fin]
    .filter((f): f is string => Boolean(f))
    .map((f) => formatFechaVista(f));
  return partes.length ? partes.join(separador) : null;
}
