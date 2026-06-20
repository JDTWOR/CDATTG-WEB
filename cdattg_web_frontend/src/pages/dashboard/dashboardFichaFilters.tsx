import { useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type {
  AsistenciaDashboardFichaSinSesion,
  AsistenciaDashboardPorFicha,
  AsistenciaDashboardResponse,
  DashboardResumenResponse,
} from '../../types';

export const DASH_FICHA_SEARCH_ID = 'dashboard-ficha-buscar';
export const DASH_FICHA_JORNADA_ID = 'dashboard-ficha-jornada';

export function filtrarFilasFicha<
  T extends { ficha_numero?: string; programa_nombre?: string; jornada_nombre?: string },
>(rows: T[], searchQuery: string, jornadaFilter: string): T[] {
  const q = searchQuery.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (jornadaFilter === '' || (row.jornada_nombre ?? '') === jornadaFilter) &&
      (q === '' ||
        row.ficha_numero?.toLowerCase().includes(q) ||
        row.programa_nombre?.toLowerCase().includes(q)),
  );
}

export function jornadaInicialDesdeApi(
  data: Pick<AsistenciaDashboardResponse | DashboardResumenResponse, 'jornadas_activas'>,
): string {
  const activas = data.jornadas_activas ?? [];
  if (activas.length === 1) return activas[0];
  return '';
}

export function useJornadasDisponibles(
  jornadasApi: string[] | undefined,
  porFicha: AsistenciaDashboardPorFicha[],
  sinSesion: AsistenciaDashboardFichaSinSesion[],
): string[] {
  return useMemo(() => {
    if (jornadasApi?.length) {
      return [...jornadasApi].sort((a, b) => a.localeCompare(b, 'es'));
    }
    const set = new Set<string>();
    porFicha.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    sinSesion.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [jornadasApi, porFicha, sinSesion]);
}

export function filasPorJornada<T extends { jornada_nombre?: string }>(rows: T[], jornadaFilter: string): T[] {
  if (!jornadaFilter) return rows;
  return rows.filter((row) => (row.jornada_nombre ?? '') === jornadaFilter);
}

export type FiltrosDashboardProps = Readonly<{
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  jornadaFilter: string;
  onJornadaFilterChange: (value: string) => void;
  jornadasDisponibles: string[];
  searchId?: string;
  jornadaId?: string;
  className?: string;
}>;

export function FiltrosDashboard({
  searchQuery,
  onSearchQueryChange,
  jornadaFilter,
  onJornadaFilterChange,
  jornadasDisponibles,
  searchId = DASH_FICHA_SEARCH_ID,
  jornadaId = DASH_FICHA_JORNADA_ID,
  className = '',
}: FiltrosDashboardProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 ${className}`.trim()}>
      <div className="w-full sm:w-auto flex-1 min-w-[250px]">
        <label htmlFor={searchId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Búsqueda de ficha
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            autoComplete="off"
            placeholder="Código de ficha o nombre de programa…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
          />
        </div>
      </div>
      <div className="w-full sm:w-auto min-w-[250px]">
        <label htmlFor={jornadaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Jornada de formación
        </label>
        <select
          id={jornadaId}
          value={jornadaFilter}
          onChange={(e) => onJornadaFilterChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
        >
          <option value="">Todas las jornadas</option>
          {jornadasDisponibles.map((jornada) => (
            <option key={jornada} value={jornada}>
              {jornada}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type DashboardMetricasFiltradas = {
  enFormacion: number;
  esperados: number;
  fichasConSesion: number;
  fichasSinSesion: number;
  pctCobertura: number;
  porSede: Array<{ nombre: string; regional_nombre: string; vinieron: number; total: number; pct: number }>;
  porJornada: Array<{ nombre: string; vinieron: number; total: number; pct: number }>;
};

export function calcularMetricasDesdeResumen(
  data: DashboardResumenResponse,
  jornadaFilter: string,
): DashboardMetricasFiltradas {
  const porFicha = filasPorJornada(data.por_ficha ?? [], jornadaFilter);
  const sinSesion = filasPorJornada(data.fichas_sin_sesion ?? [], jornadaFilter);

  let vinieron = 0;
  let totalConSesion = 0;
  porFicha.forEach((row) => {
    vinieron += row.cantidad_vinieron ?? 0;
    totalConSesion += row.total_aprendices ?? 0;
  });
  const totalSinSesion = sinSesion.reduce((sum, row) => sum + (row.total_aprendices ?? 0), 0);
  const esperados = totalConSesion + totalSinSesion;
  const fichasConSesion = porFicha.length;
  const fichasSinSesion = sinSesion.length;
  const pctCobertura =
    fichasConSesion + fichasSinSesion > 0
      ? Math.round((fichasConSesion / (fichasConSesion + fichasSinSesion)) * 1000) / 10
      : 0;

  const sedeMap = new Map<string, { regional: string; vinieron: number; total: number }>();
  porFicha.forEach((row) => {
    const key = row.sede_nombre || 'Sin sede';
    const prev = sedeMap.get(key) ?? { regional: '', vinieron: 0, total: 0 };
    sedeMap.set(key, {
      regional: prev.regional,
      vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
      total: prev.total + (row.total_aprendices ?? 0),
    });
  });
  (data.por_sede ?? []).forEach((s) => {
    const prev = sedeMap.get(s.nombre);
    if (prev && !prev.regional) {
      prev.regional = s.regional_nombre;
    }
  });

  const porSede = Array.from(sedeMap.entries()).map(([nombre, acc]) => ({
    nombre,
    regional_nombre: acc.regional,
    vinieron: acc.vinieron,
    total: acc.total,
    pct: acc.total > 0 ? Math.round((acc.vinieron / acc.total) * 1000) / 10 : 0,
  }));

  const jornadaMap = new Map<string, { vinieron: number; total: number }>();
  porFicha.forEach((row) => {
    const key = row.jornada_nombre || 'Sin jornada';
    const prev = jornadaMap.get(key) ?? { vinieron: 0, total: 0 };
    jornadaMap.set(key, {
      vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
      total: prev.total + (row.total_aprendices ?? 0),
    });
  });
  const porJornada = Array.from(jornadaMap.entries()).map(([nombre, acc]) => ({
    nombre,
    vinieron: acc.vinieron,
    total: acc.total,
    pct: acc.total > 0 ? Math.round((acc.vinieron / acc.total) * 1000) / 10 : 0,
  }));

  let enFormacion = 0;
  porFicha.forEach((row) => {
    enFormacion += row.cantidad_en_formacion ?? 0;
  });

  return {
    enFormacion,
    esperados,
    fichasConSesion,
    fichasSinSesion,
    pctCobertura,
    porSede,
    porJornada,
  };
}
