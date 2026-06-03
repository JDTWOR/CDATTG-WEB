import type { AprendizResponse } from '../types';

/** Comparador A–Z por nombre de persona (desempate por documento). */
export function compareAprendicesAz(a: AprendizResponse, b: AprendizResponse): number {
  const byNombre = (a.persona_nombre ?? '').localeCompare(b.persona_nombre ?? '', 'es', {
    sensitivity: 'base',
  });
  if (byNombre !== 0) return byNombre;
  return (a.persona_documento ?? '').localeCompare(b.persona_documento ?? '', 'es', { sensitivity: 'base' });
}

/** Orden A–Z por nombre de persona (desempate por documento). */
export function sortAprendicesAz(aprendices: AprendizResponse[]): AprendizResponse[] {
  return [...aprendices].sort(compareAprendicesAz);
}
