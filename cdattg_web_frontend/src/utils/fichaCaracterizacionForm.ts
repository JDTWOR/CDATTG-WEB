import type {
  DiaFormacionItem,
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
  FichaDiaFormacionItem,
  ProgramaFormacionResponse,
} from '../types';
import { horariosFromFicha, validarSinSolape } from './fichaCaracterizacionHorarios';
import { MSG_INSTRUCTOR_LIDER_OBLIGATORIO } from '../constants/instructorLiderLabels';

function sliceHoraInput(value?: string | null): string | undefined {
  if (value == null || value === '') return undefined;
  return value.trim().slice(0, 5);
}

export function buildDiasFormacionPayload(
  horarios: FichaDiaFormacionItem[],
): FichaDiaFormacionItem[] | undefined {
  if (!horarios.length) return undefined;
  return horarios.map((h, i) => ({
    dia_formacion_id: h.dia_formacion_id,
    hora_inicio: sliceHoraInput(h.hora_inicio) ?? '',
    hora_fin: sliceHoraInput(h.hora_fin) ?? '',
    orden: h.orden ?? i,
    jornada_id: h.jornada_id ?? null,
  }));
}

export function diasIdsFromHorarios(horarios: FichaDiaFormacionItem[]): number[] {
  const ids = new Set<number>();
  for (const h of horarios) {
    if (h.dia_formacion_id > 0) ids.add(h.dia_formacion_id);
  }
  return [...ids];
}

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
  const horarios = horariosFromFicha(item);
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
    dias_formacion_ids: diasIdsFromHorarios(horarios),
    horarios,
    dias_formacion: horarios,
  };
}

export function validarFormFicha(
  form: FichaCaracterizacionRequest,
  editing: FichaCaracterizacionResponse | null,
): string | null {
  if (!editing && (!form.instructor_id || form.instructor_id === 0)) {
    return MSG_INSTRUCTOR_LIDER_OBLIGATORIO;
  }
  if (!form.ficha?.trim()) {
    return 'El número de ficha es obligatorio.';
  }
  const horarios = form.horarios ?? form.dias_formacion ?? [];
  if (horarios.length === 0) {
    return 'Debe configurar al menos un bloque horario de formación.';
  }
  return validarSinSolape(horarios);
}

export function construirPayloadFicha(
  form: FichaCaracterizacionRequest,
  editing: FichaCaracterizacionResponse | null,
  programas: ProgramaFormacionResponse[],
): FichaCaracterizacionRequest {
  const horarios = form.horarios ?? form.dias_formacion ?? [];
  const diasNorm = diasIdsFromHorarios(horarios);
  const fechaInicio =
    (form.fecha_inicio?.trim() && toDateInputString(form.fecha_inicio.trim())) ||
    (editing ? toDateInputString(editing.fecha_inicio) : undefined);
  const fechaFin =
    (form.fecha_fin?.trim() && toDateInputString(form.fecha_fin.trim())) ||
    (editing ? toDateInputString(editing.fecha_fin) : undefined);
  const programaFormacionId = form.programa_formacion_id || programas[0]?.id || 0;
  const horariosPayload = buildDiasFormacionPayload(horarios);

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
    dias_formacion: horariosPayload,
    horarios: horariosPayload,
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
  const horarios = horariosFromFicha(item);
  if (horarios.length) return diasIdsFromHorarios(horarios);
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
  const horarios = horariosFromFicha(item);
  if (horarios.length) {
    return horarios
      .map((h) => {
        const nombre = diasFormacion.find((d) => Number(d.id) === h.dia_formacion_id)?.nombre ?? String(h.dia_formacion_id);
        const inicio = sliceHoraInput(h.hora_inicio);
        const fin = sliceHoraInput(h.hora_fin);
        if (inicio && fin) return `${nombre} ${inicio}–${fin}`;
        return nombre;
      })
      .join(', ');
  }
  const ids = diasIdsFromListItem(item);
  const nombresApi = item.dias_formacion_nombres?.filter((n) => n?.trim());
  if (nombresApi?.length) return nombresApi.join(', ');
  if (!ids.length) return '—';
  return ids
    .map((id) => diasFormacion.find((d) => Number(d.id) === id)?.nombre ?? String(id))
    .join(', ');
}

export function mergeListAfterSave(
  prev: FichaCaracterizacionResponse[],
  saved: FichaCaracterizacionResponse,
  editing: FichaCaracterizacionResponse | null,
): FichaCaracterizacionResponse[] {
  if (editing) {
    return prev.map((row) => (row.id === saved.id ? { ...row, ...saved } : row));
  }
  return [saved, ...prev];
}
