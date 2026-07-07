import type { CasoBienestarItem, FichaCaracterizacionResponse } from '../../../types';

export type GrupoCasosPorFicha = {
  ficha_numero: string;
  programa_nombre: string;
  sede_nombre: string;
  jornada_nombre?: string;
  instructor_nombre?: string;
  ambiente_nombre?: string;
  modalidad_formacion_nombre?: string;
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
          jornada_nombre: caso.jornada_nombre,
          instructor_nombre: caso.instructor_nombre,
          ambiente_nombre: caso.ambiente_nombre,
          modalidad_formacion_nombre: caso.modalidad_formacion_nombre,
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
    jornada_nombre: grupo.jornada_nombre,
    instructor_nombre: grupo.instructor_nombre,
    ambiente_nombre: grupo.ambiente_nombre,
    modalidad_formacion_nombre: grupo.modalidad_formacion_nombre,
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

export function porcentajeAsistenciaAprendiz(caso: CasoBienestarItem): number {
  if (caso.total_sesiones <= 0) return 0;
  const cubiertas = caso.asistencias_efectivas + (caso.inasistencias_justificadas ?? 0);
  return Math.round((cubiertas / caso.total_sesiones) * 100);
}

export function nivelAlertaInasistencias(inasistencias: number, minFallas: number): 'alto' | 'medio' | 'base' {
  if (inasistencias >= minFallas + 3) return 'alto';
  if (inasistencias >= minFallas + 1) return 'medio';
  return 'base';
}

export function parseDiasCasosBienestarParam(raw: string | null | undefined): number {
  if (raw == null || raw === '') return 30;
  const n = Number(raw);
  if (n === 0) return 0;
  if (Number.isFinite(n) && n > 0) return n;
  return 30;
}

export function etiquetaPeriodoCasosBienestar(
  dias: number,
  fechaInicio?: string,
  fechaFin?: string,
): string {
  if (dias === 0) {
    if (fechaInicio && fechaFin) {
      return `Desde ${fechaInicio} hasta ${fechaFin}`;
    }
    return 'Histórico completo';
  }
  return `Últimos ${dias} días`;
}

export function resumenPeriodoCasosBienestar(
  dias: number,
  minFallas: number,
  fechaInicio?: string,
  fechaFin?: string,
): string {
  return `${etiquetaPeriodoCasosBienestar(dias, fechaInicio, fechaFin)}, con ${minFallas}+ inasistencias sin justificar`;
}
