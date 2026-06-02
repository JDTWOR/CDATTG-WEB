import type {
  DiaFormacionItem,
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
  ProgramaFormacionResponse,
} from '../types';

/** API puede devolver ISO (RFC3339); input type=date exige yyyy-MM-DD */
export function toDateInputString(iso?: string | null): string | undefined {
  if (iso == null || iso === '') return undefined;
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return undefined;
}

export function normalizeDiaIds(ids?: (number | string)[] | null): number[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(Number).filter((n) => !Number.isNaN(n) && n > 0))];
}

export function formStateFromFicha(item: FichaCaracterizacionResponse): FichaCaracterizacionRequest {
  return {
    programa_formacion_id: item.programa_formacion_id,
    ficha: item.ficha,
    instructor_id: item.instructor_id,
    fecha_inicio: toDateInputString(item.fecha_inicio),
    fecha_fin: toDateInputString(item.fecha_fin),
    sede_id: item.sede_id,
    modalidad_formacion_id: item.modalidad_formacion_id,
    ambiente_id: item.ambiente_id,
    jornada_id: item.jornada_id,
    total_horas: item.total_horas,
    status: item.status,
    dias_formacion_ids: normalizeDiaIds(item.dias_formacion_ids),
  };
}

export function validarFormFicha(
  form: FichaCaracterizacionRequest,
  editing: FichaCaracterizacionResponse | null
): string | null {
  if (!editing && (!form.instructor_id || form.instructor_id === 0)) {
    return 'El instructor líder es obligatorio.';
  }
  if (!form.ficha?.trim()) {
    return 'El número de ficha es obligatorio.';
  }
  return null;
}

export function construirPayloadFicha(
  form: FichaCaracterizacionRequest,
  editing: FichaCaracterizacionResponse | null,
  programas: ProgramaFormacionResponse[]
): FichaCaracterizacionRequest {
  const diasNorm = normalizeDiaIds(form.dias_formacion_ids);
  const fechaInicio =
    (form.fecha_inicio?.trim() && toDateInputString(form.fecha_inicio.trim())) ||
    (editing ? toDateInputString(editing.fecha_inicio) : undefined);
  const fechaFin =
    (form.fecha_fin?.trim() && toDateInputString(form.fecha_fin.trim())) ||
    (editing ? toDateInputString(editing.fecha_fin) : undefined);
  const programaFormacionId = form.programa_formacion_id || programas[0]?.id || 0;
  return {
    programa_formacion_id: programaFormacionId,
    ficha: form.ficha.trim(),
    instructor_id: form.instructor_id ?? null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    sede_id: form.sede_id ?? null,
    modalidad_formacion_id: form.modalidad_formacion_id ?? null,
    ambiente_id: form.ambiente_id ?? null,
    jornada_id: form.jornada_id ?? null,
    total_horas: form.total_horas,
    status: form.status,
    dias_formacion_ids: diasNorm,
  };
}

export function labelBotonGuardarFicha(saving: boolean, editing: FichaCaracterizacionResponse | null): string {
  if (saving) return 'Guardando…';
  if (editing !== null) return 'Guardar';
  return 'Crear Ficha';
}

export const FICHA_ADMIN_ROLES = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR'] as const;

export function canManageFichas(roles: string[]): boolean {
  return FICHA_ADMIN_ROLES.some((r) => roles.includes(r));
}

export function diasIdsFromListItem(item: FichaCaracterizacionResponse): number[] {
  const anyItem = item as unknown as Record<string, unknown>;
  const raw =
    item.dias_formacion_ids ??
    anyItem.dias_formacion_ids ??
    anyItem.DiasFormacionIDs ??
    anyItem.diasFormacionIds;
  if (Array.isArray(raw)) return normalizeDiaIds(raw as (number | string)[]);
  return [];
}

export function formatDiasEnTabla(item: FichaCaracterizacionResponse, diasFormacion: DiaFormacionItem[]): string {
  const ids = diasIdsFromListItem(item);
  if (!ids.length) return '—';
  return ids
    .map((id) => diasFormacion.find((d) => Number(d.id) === id)?.nombre ?? String(id))
    .join(', ');
}

export function mergeListAfterSave(
  prev: FichaCaracterizacionResponse[],
  saved: FichaCaracterizacionResponse,
  editing: FichaCaracterizacionResponse | null
): FichaCaracterizacionResponse[] {
  if (editing) {
    return prev.map((row) => (row.id === saved.id ? { ...row, ...saved } : row));
  }
  return [saved, ...prev];
}
