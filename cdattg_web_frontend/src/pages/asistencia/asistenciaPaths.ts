import { asistenciaPaths } from '../../routes/paths';

export { asistenciaPaths };

/** Ruta de toma de asistencia para una ficha (deep-link directo). */
export function asistenciaFichaPath(fichaId: number): string {
  return asistenciaPaths.sesion(fichaId);
}

export function asistenciaHistorialFichaPath(fichaId: number): string {
  return asistenciaPaths.historial.ficha(fichaId);
}

export function parseAsistenciaFichaIdParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
