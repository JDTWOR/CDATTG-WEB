import type { AprendizResponse, AsistenciaAprendizResponse } from '../../types';

export type AccionRegistroDocumento = 'ingreso' | 'salida';

/** Normaliza texto leído del QR (solo dígitos si hay suficientes). */
export function normalizarDocumentoEscaneado(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const soloDigitos = trimmed.replace(/\D/g, '');
  return soloDigitos.length >= 5 ? soloDigitos : trimmed;
}

export function inferirAccionPorDocumento(
  documento: string,
  aprendicesFicha: AprendizResponse[],
  registroPorAprendizId: Map<number, AsistenciaAprendizResponse[]>,
): AccionRegistroDocumento | null {
  const doc = normalizarDocumentoEscaneado(documento);
  if (!doc) return null;
  const aprendiz = aprendicesFicha.find(
    (a) => normalizarDocumentoEscaneado(a.persona_documento ?? '') === doc,
  );
  if (!aprendiz) return null;
  const { open } = summaryRegistros(registroPorAprendizId.get(aprendiz.id) ?? []);
  return open ? 'salida' : 'ingreso';
}

/** Re-export legacy; usar utils/sortAprendices o apiService para listas normalizadas. */
export { sortAprendicesAz } from '../../utils/sortAprendices';

export function groupRegistrosByAprendiz(list: AsistenciaAprendizResponse[]): Map<number, AsistenciaAprendizResponse[]> {
  const map = new Map<number, AsistenciaAprendizResponse[]>();
  for (const aa of list) {
    const id = aa.aprendiz_id;
    const existing = map.get(id);
    if (existing) {
      existing.push(aa);
    } else {
      map.set(id, [aa]);
    }
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      if (a.hora_ingreso && b.hora_ingreso) {
        return new Date(a.hora_ingreso).getTime() - new Date(b.hora_ingreso).getTime();
      }
      return a.id - b.id;
    });
  }
  return map;
}

type RegistroConHoraIngreso = AsistenciaAprendizResponse & { hora_ingreso: string };
type RegistroConHoraSalida = AsistenciaAprendizResponse & { hora_salida: string };

function tieneHoraIngresoValida(r: AsistenciaAprendizResponse): r is RegistroConHoraIngreso {
  return !!r.hora_ingreso && !Number.isNaN(new Date(r.hora_ingreso).getTime());
}

function tieneHoraSalidaValida(r: AsistenciaAprendizResponse): r is RegistroConHoraSalida {
  return !!r.hora_salida && !Number.isNaN(new Date(r.hora_salida).getTime());
}

export function summaryRegistros(registros: AsistenciaAprendizResponse[]) {
  const open = registros.find((r) => r.hora_ingreso && !r.hora_salida) ?? null;
  const conIngreso = registros.filter(tieneHoraIngresoValida);
  const conSalida = registros.filter(tieneHoraSalidaValida);

  let firstIngreso: string | null = null;
  if (conIngreso.length > 0) {
    const earliest = conIngreso.reduce((best, cur) =>
      new Date(cur.hora_ingreso).getTime() < new Date(best.hora_ingreso).getTime() ? cur : best,
      conIngreso[0],
    );
    firstIngreso = new Date(earliest.hora_ingreso).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  let lastSalida: string | null = null;
  if (conSalida.length > 0) {
    const latest = conSalida.reduce((best, cur) =>
      new Date(cur.hora_salida).getTime() > new Date(best.hora_salida).getTime() ? cur : best,
      conSalida[0],
    );
    lastSalida = new Date(latest.hora_salida).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const lastReg = registros.length > 0 ? registros.at(-1) : undefined;
  const observaciones = open?.observaciones ?? (lastReg?.observaciones ?? '');
  const tiposObservacion = open?.tipos_observacion ?? lastReg?.tipos_observacion ?? [];
  const requiereRevisionRecord = registros.find((r) => r.requiere_revision) ?? null;
  return { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord };
}

export function estadoAprendizVisual(open: AsistenciaAprendizResponse | null, lastSalida: string | null) {
  if (open) {
    return {
      label: 'En formación',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    };
  }
  if (lastSalida) {
    return {
      label: 'Salida registrada',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    };
  }
  return {
    label: 'Sin entrada',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
}

export function buildRangoText(firstIngreso: string | null, lastSalida: string | null, open: AsistenciaAprendizResponse | null): string {
  const left = firstIngreso ?? '–';
  if (lastSalida) return `${left} → ${lastSalida}`;
  if (open) return `${left} → —`;
  return left;
}

function formatHoraRegistro(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function formatTramoRegistro(registro: AsistenciaAprendizResponse): string {
  const ingreso = formatHoraRegistro(registro.hora_ingreso);
  const salida = registro.hora_salida ? formatHoraRegistro(registro.hora_salida) : '—';
  return `${ingreso} → ${salida}`;
}

export function mensajeRegistroPorTipo(data: { mensaje?: string | null; tipo_registro?: string }): string {
  if (data.mensaje) return data.mensaje;
  if (data.tipo_registro === 'ingreso') return 'Ingreso registrado';
  if (data.tipo_registro === 'salida') return 'Salida registrada';
  return 'Asistencia completa';
}

export function sameRegistrosList(a: AsistenciaAprendizResponse[], b: AsistenciaAprendizResponse[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((aa, i) => {
    const bb = b[i];
    if (!bb) return false;
    const tiposA = (aa.tipos_observacion ?? []).map((t) => t.id).sort((x, y) => x - y);
    const tiposB = (bb.tipos_observacion ?? []).map((t) => t.id).sort((x, y) => x - y);
    const mismosTipos = tiposA.length === tiposB.length && tiposA.every((id, idx) => id === tiposB[idx]);
    return (
      aa.id === bb.id &&
      aa.hora_ingreso === bb.hora_ingreso &&
      aa.hora_salida === bb.hora_salida &&
      aa.observaciones === bb.observaciones &&
      mismosTipos
    );
  });
}

export function computeBulkCounts(
  selectedAprendizIds: Set<number>,
  registroPorAprendizId: Map<number, AsistenciaAprendizResponse[]>,
): { entradas: number; salidas: number } {
  let entradas = 0;
  let salidas = 0;
  for (const id of selectedAprendizIds) {
    const { open } = summaryRegistros(registroPorAprendizId.get(id) ?? []);
    if (open) {
      salidas += 1;
    } else {
      entradas += 1;
    }
  }
  return { entradas, salidas };
}
