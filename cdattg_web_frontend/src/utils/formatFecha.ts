/** Fecha legible (dd/mm/yyyy) desde ISO o yyyy-MM-dd. */
export function formatFechaVista(iso?: string | null): string {
  if (iso == null || iso === '') return '—';
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString('es-CO');
  return s;
}

/** Rango de fechas formateado; null si no hay ninguna. */
export function formatRangoFechasVista(
  inicio?: string | null,
  fin?: string | null,
  separador = ' → '
): string | null {
  if (!inicio && !fin) return null;
  const partes = [inicio, fin]
    .filter((f): f is string => Boolean(f))
    .map((f) => formatFechaVista(f));
  return partes.length ? partes.join(separador) : null;
}
