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
