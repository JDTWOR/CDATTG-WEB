/** ficha.instructor_id es la fuente de verdad del Instructor Líder. */
export function isInstructorLiderDeFicha(
  ficha: { instructor_id?: number | null },
  instructorId: number,
): boolean {
  return ficha.instructor_id != null && ficha.instructor_id === instructorId;
}

/** Resuelve líder efectivo cuando hay instructores asignados (ModalAsignarFicha). */
export function resolveInstructorLiderId(
  ficha: { instructor_id?: number | null },
  asignados: { instructor_id: number }[],
): number | undefined {
  if (asignados.length === 0) return undefined;
  const ids = new Set(asignados.map((i) => i.instructor_id));
  if (ficha.instructor_id != null && ficha.instructor_id > 0 && ids.has(ficha.instructor_id)) {
    return ficha.instructor_id;
  }
  return asignados[0].instructor_id;
}
