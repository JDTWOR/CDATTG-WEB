import type { CasoBienestarItem, FichaCaracterizacionResponse } from '../../../types';

export type GrupoCasosPorFicha = {
  ficha_numero: string;
  programa_nombre: string;
  sede_nombre: string;
  casos: CasoBienestarItem[];
  totalInasistencias: number;
  totalSesiones: number;
  totalAsistencias: number;
  groupKey: string;
};

export type FiltrosListaCasosBienestar = {
  searchQuery: string;
  programaNombre: string;
};

export function agruparCasosPorFicha(casos: CasoBienestarItem[]): GrupoCasosPorFicha[] {
  const grupos = casos.reduce<Record<string, Omit<GrupoCasosPorFicha, 'groupKey'>>>(
    (acc, caso) => {
      const key = `${caso.ficha_numero}||${caso.sede_nombre || ''}`;
      if (!acc[key]) {
        acc[key] = {
          ficha_numero: caso.ficha_numero,
          programa_nombre: caso.programa_nombre || '',
          sede_nombre: caso.sede_nombre,
          casos: [],
          totalInasistencias: 0,
          totalSesiones: 0,
          totalAsistencias: 0,
        };
      }
      acc[key].casos.push(caso);
      acc[key].totalInasistencias += caso.inasistencias;
      acc[key].totalSesiones += caso.total_sesiones;
      acc[key].totalAsistencias += caso.asistencias_efectivas;
      return acc;
    },
    {},
  );
  return Object.entries(grupos).map(([groupKey, group]) => ({ ...group, groupKey }));
}

export function grupoCasosToFichaCard(grupo: GrupoCasosPorFicha): FichaCaracterizacionResponse {
  return {
    id: 0,
    programa_formacion_id: 0,
    ficha: grupo.ficha_numero,
    programa_formacion_nombre: grupo.programa_nombre,
    sede_nombre: grupo.sede_nombre,
    cantidad_aprendices: grupo.casos.length,
    status: true,
  };
}

export function programasUnicosDesdeGrupos(grupos: GrupoCasosPorFicha[]): string[] {
  const set = new Set<string>();
  for (const g of grupos) {
    const nombre = g.programa_nombre?.trim();
    if (nombre) set.add(nombre);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filtrarGruposPorLista(
  grupos: GrupoCasosPorFicha[],
  filtros: FiltrosListaCasosBienestar,
): GrupoCasosPorFicha[] {
  const q = filtros.searchQuery.trim().toLowerCase();
  const programa = filtros.programaNombre.trim();

  return grupos.filter((g) => {
    if (programa && g.programa_nombre !== programa) return false;
    if (!q) return true;
    const ficha = g.ficha_numero.toLowerCase();
    const prog = (g.programa_nombre || '').toLowerCase();
    return ficha.includes(q) || prog.includes(q);
  });
}

export function tieneFiltrosListaActivos(filtros: FiltrosListaCasosBienestar): boolean {
  return Boolean(filtros.searchQuery.trim() || filtros.programaNombre.trim());
}

export function filtrarCasosAprendiz(casos: CasoBienestarItem[], searchQuery: string): CasoBienestarItem[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return casos;
  return casos.filter(
    (c) =>
      c.numero_documento.toLowerCase().includes(q) ||
      c.persona_nombre.toLowerCase().includes(q),
  );
}

export function casosDeFicha(
  casos: CasoBienestarItem[],
  fichaNumero: string,
  sedeNombreParam: string,
): CasoBienestarItem[] {
  return casos.filter(
    (c) =>
      c.ficha_numero === fichaNumero &&
      (!sedeNombreParam || (c.sede_nombre || '') === sedeNombreParam),
  );
}
