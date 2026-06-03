import { formatDiasEnTabla } from '../../utils/fichaCaracterizacionForm';
import type { FichaCaracterizacionResponse, InstructorFichaItem, DiaFormacionItem } from '../../types';

export function diasTexto(ficha: FichaCaracterizacionResponse, catalogo: DiaFormacionItem[]): string {
  return formatDiasEnTabla(ficha, catalogo);
}

export function toggleDiaEnInstructores(
  items: InstructorFichaItem[],
  instructorId: number,
  diaId: number,
): InstructorFichaItem[] {
  return items.map((item) => {
    if (item.instructor_id !== instructorId) {
      return item;
    }
    const current = item.dias_formacion_ids ?? [];
    const next = current.includes(diaId) ? current.filter((id) => id !== diaId) : [...current, diaId];
    return { ...item, dias_formacion_ids: next };
  });
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fechaInputValue(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function vigenciaInstructorDefault(
  inst: { fecha_inicio?: string; fecha_fin?: string },
  ficha: { fecha_inicio?: string; fecha_fin?: string } | null,
): { inicio: string; fin: string } {
  const inicio = fechaInputValue(inst.fecha_inicio) || fechaInputValue(ficha?.fecha_inicio) || hoyISO();
  const fin = fechaInputValue(inst.fecha_fin) || fechaInputValue(ficha?.fecha_fin) || hoyISO();
  return { inicio, fin };
}
