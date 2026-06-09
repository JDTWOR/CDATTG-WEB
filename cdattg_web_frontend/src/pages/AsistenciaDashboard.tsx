import { useState, useEffect, useRef, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChartBarIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { useAuth } from '../context/AuthContext';
import { getAsistenciaDashboardWsUrl } from '../config/api';
import type {
  AsistenciaDashboardFichaSinSesion,
  AsistenciaDashboardPorFicha,
  AsistenciaDashboardResponse,
} from '../types';
import { asistenciaPaths, bienestarPaths } from '../routes/paths';
import { canViewCasosBienestar } from './bienestar/casos/casosBienestarPermissions';

const DASH_SEARCH_ID = 'asistencia-dashboard-buscar-ficha';
const DASH_JORNADA_ID = 'asistencia-dashboard-filtro-jornada';
const PAGE_SIZE = 20;

function textoResumenCasosBienestar(count: number): string {
  if (count === 0) return 'Ningún caso detectado con el criterio actual.';
  if (count === 1) return '1 caso detectado.';
  return `${count} casos detectados.`;
}

function formatearJornadasActivas(jornadas: string[] | undefined): string {
  if (!jornadas?.length) return '';
  return jornadas
    .map((j) =>
      j
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    )
    .join(', ');
}

function filtrarFilasFicha<T extends { ficha_numero?: string; programa_nombre?: string; jornada_nombre?: string }>(
  rows: T[],
  searchQuery: string,
  jornadaFilter: string,
): T[] {
  const q = searchQuery.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (jornadaFilter === '' || (row.jornada_nombre ?? '') === jornadaFilter) &&
      (q === '' ||
        row.ficha_numero?.toLowerCase().includes(q) ||
        row.programa_nombre?.toLowerCase().includes(q)),
  );
}

function useJornadasDisponibles(
  porFicha: AsistenciaDashboardPorFicha[],
  sinSesion: AsistenciaDashboardFichaSinSesion[],
): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    porFicha.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    sinSesion.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [porFicha, sinSesion]);
}

type FiltrosDashboardProps = Readonly<{
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  jornadaFilter: string;
  onJornadaFilterChange: (value: string) => void;
  jornadasDisponibles: string[];
}>;

function FiltrosDashboard({
  searchQuery,
  onSearchQueryChange,
  jornadaFilter,
  onJornadaFilterChange,
  jornadasDisponibles,
}: FiltrosDashboardProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 mb-4">
      <div className="w-full sm:w-auto flex-1 min-w-[250px]">
        <label htmlFor={DASH_SEARCH_ID} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Buscar ficha
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            aria-hidden
          />
          <input
            id={DASH_SEARCH_ID}
            type="search"
            autoComplete="off"
            placeholder="Buscar por código de ficha o programa..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
          />
        </div>
      </div>
      <div className="w-full sm:w-auto min-w-[250px]">
        <label htmlFor={DASH_JORNADA_ID} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filtrar por jornada
        </label>
        <select
          id={DASH_JORNADA_ID}
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

type PaginacionTablaProps = Readonly<{
  page: number;
  totalPages: number;
  totalFilas: number;
  setPage: Dispatch<SetStateAction<number>>;
}>;

function PaginacionTabla({ page, totalPages, totalFilas, setPage }: PaginacionTablaProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex justify-between items-center">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Página {page} de {totalPages} ({totalFilas} total)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50"
          aria-label="Ir a la página anterior"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="btn-secondary disabled:opacity-50"
          aria-label="Ir a la página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

type AsistenciaDashboardDataViewProps = Readonly<{
  data: AsistenciaDashboardResponse;
  casosBienestarCount: number | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  jornadaFilter: string;
  onJornadaFilterChange: (value: string) => void;
  jornadasDisponibles: string[];
  fichasConSesionFiltradas: AsistenciaDashboardPorFicha[];
  paginatedConSesion: AsistenciaDashboardPorFicha[];
  totalPagesConSesion: number;
  pageConSesion: number;
  setPageConSesion: Dispatch<SetStateAction<number>>;
  fichasSinSesionFiltradas: AsistenciaDashboardFichaSinSesion[];
  paginatedSinSesion: AsistenciaDashboardFichaSinSesion[];
  totalPagesSinSesion: number;
  pageSinSesion: number;
  setPageSinSesion: Dispatch<SetStateAction<number>>;
}>;

function AsistenciaDashboardDataView({
  data,
  casosBienestarCount,
  searchQuery,
  onSearchQueryChange,
  jornadaFilter,
  onJornadaFilterChange,
  jornadasDisponibles,
  fichasConSesionFiltradas,
  paginatedConSesion,
  totalPagesConSesion,
  pageConSesion,
  setPageConSesion,
  fichasSinSesionFiltradas,
  paginatedSinSesion,
  totalPagesSinSesion,
  pageSinSesion,
  setPageSinSesion,
}: AsistenciaDashboardDataViewProps) {
  const real = data.total_aprendices_en_formacion;
  const esperado = data.total_aprendices_esperados ?? 0;
  const jornadasTexto = formatearJornadasActivas(data.jornadas_activas);
  const fichasConSesion = data.fichas_con_sesion_hoy ?? data.por_ficha.length;
  const fichasSinSesion = data.fichas_sin_asistencia_hoy?.length ?? 0;
  const porcentaje = esperado > 0 ? ((real / esperado) * 100).toFixed(1) : null;

  const totalesConSesion = fichasConSesionFiltradas.reduce(
    (acc, row) => ({
      vinieron: acc.vinieron + (row.cantidad_vinieron ?? 0),
      enFichasConSesion: acc.enFichasConSesion + (row.total_aprendices ?? 0),
    }),
    { vinieron: 0, enFichasConSesion: 0 },
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{data.fecha}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices en formación hoy</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1 tabular-nums">
                {esperado > 0 ? (
                  <>
                    {real.toLocaleString('es-CO')}
                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      {' '}
                      / {esperado.toLocaleString('es-CO')}
                    </span>
                  </>
                ) : (
                  real.toLocaleString('es-CO')
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {esperado > 0 ? (
                  <>
                    En formación ahora
                    {porcentaje != null && ` (${porcentaje}%)`}
                    {jornadasTexto ? ` · jornadas activas: ${jornadasTexto}` : ''}
                  </>
                ) : (
                  'Ninguna jornada activa en este momento'
                )}
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas con sesión (jornada activa)</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums">{fichasConSesion}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <ClipboardDocumentCheckIcon className="w-7 h-7 text-green-600 dark:text-green-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas sin sesión (jornada activa)</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{fichasSinSesion}</p>
            </div>
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className="card py-3 px-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Resumen de cobertura:</span>{' '}
          <span className="tabular-nums">{data.total_fichas_registradas ?? '—'}</span> fichas activas ·{' '}
          <span className="tabular-nums text-green-700 dark:text-green-400">{fichasConSesion}</span> con sesión hoy ·{' '}
          <span className="tabular-nums text-amber-700 dark:text-amber-300">{fichasSinSesion}</span> pendientes en
          jornada activa ·{' '}
          <span className="tabular-nums text-amber-600 dark:text-amber-400">{data.pendientes_revision ?? 0}</span>{' '}
          pendientes de revisión
        </p>
      </div>

      <div className="card border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Casos a tener en cuenta (Bienestar al Aprendiz)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Aprendices con 3 o más inasistencias en los últimos 30 días para seguimiento y prevención de deserción.
              </p>
              {casosBienestarCount !== null && (
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                  {textoResumenCasosBienestar(casosBienestarCount)}
                </p>
              )}
            </div>
          </div>
          <Link
            to={bienestarPaths.casos.index}
            className="btn-primary inline-flex items-center justify-center gap-2 shrink-0"
          >
            <ExclamationTriangleIcon className="w-5 h-5" aria-hidden />
            Ver casos a tener en cuenta
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Fichas con sesión (jornada activa)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Solo fichas con formación hoy y jornada en curso que ya abrieron sesión el {data.fecha}
          {jornadasTexto ? ` (${jornadasTexto})` : ''}. No se listan fichas de otras jornadas (ej. noche en horario de
          mañana).
        </p>

        <FiltrosDashboard
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          jornadaFilter={jornadaFilter}
          onJornadaFilterChange={onJornadaFilterChange}
          jornadasDisponibles={jornadasDisponibles}
        />

        {fichasConSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Ninguna ficha de la jornada activa tiene sesión de asistencia abierta.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas con sesión en jornada activa</caption>
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ficha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Programa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Jornada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sede
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Vinieron hoy
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {paginatedConSesion.map((row) => (
                  <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.ficha_numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.programa_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jornada_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                      {row.cantidad_vinieron} / {row.total_aprendices ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={asistenciaPaths.historial.ficha(row.ficha_id)}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                      >
                        Historial
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total en fichas con sesión (jornada activa)
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                    {totalesConSesion.vinieron.toLocaleString('es-CO')} /{' '}
                    {totalesConSesion.enFichasConSesion.toLocaleString('es-CO')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              La card superior compara en formación ahora ({real.toLocaleString('es-CO')}) frente al esperado en toda la
              jornada activa ({esperado.toLocaleString('es-CO')}), incluidas fichas que aún no abrieron sesión.
            </p>
          </div>
        )}
        <PaginacionTabla
          page={pageConSesion}
          totalPages={totalPagesConSesion}
          totalFilas={fichasConSesionFiltradas.length}
          setPage={setPageConSesion}
        />
      </div>

      <div className="card border-amber-200 dark:border-amber-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Fichas sin sesión de asistencia hoy
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fichas con formación programada hoy y jornada activa en este momento que aún no tienen sesión de asistencia
          para el día {data.fecha}.
          {jornadasTexto ? ` Jornadas consideradas: ${jornadasTexto}.` : ''}
        </p>

        <FiltrosDashboard
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          jornadaFilter={jornadaFilter}
          onJornadaFilterChange={onJornadaFilterChange}
          jornadasDisponibles={jornadasDisponibles}
        />

        {fichasSinSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Todas las fichas esperadas en la jornada activa ya tienen sesión, o ninguna jornada está activa ahora.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas sin sesión de asistencia en jornada activa</caption>
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ficha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Programa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Jornada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sede
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Aprendices
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-36">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {paginatedSinSesion.map((row) => (
                  <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.ficha_numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.programa_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jornada_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300 tabular-nums">
                      {row.total_aprendices}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={asistenciaPaths.sesion(row.ficha_id)}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                      >
                        Tomar asistencia
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginacionTabla
          page={pageSinSesion}
          totalPages={totalPagesSinSesion}
          totalFilas={fichasSinSesionFiltradas.length}
          setPage={setPageSinSesion}
        />
      </div>

      {(data.pendientes_revision ?? 0) > 0 && (
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
            <DocumentMagnifyingGlassIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes de revisión (hoy)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {data.pendientes_revision}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export const AsistenciaDashboard = () => {
  const { token, roles } = useAuth();
  const [data, setData] = useState<AsistenciaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [casosBienestarCount, setCasosBienestarCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jornadaFilter, setJornadaFilter] = useState('');
  const [pageConSesion, setPageConSesion] = useState(1);
  const [pageSinSesion, setPageSinSesion] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canViewBienestar = canViewCasosBienestar(roles);

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const [res, casosRes] = await Promise.all([
        apiService.getAsistenciaDashboard(),
        apiService.getCasosBienestar({ dias: 30, min_fallas: 3 }).catch(() => ({ casos: [] })),
      ]);
      setData(res);
      setCasosBienestarCount(Array.isArray(casosRes?.casos) ? casosRes.casos.length : 0);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('Solo el superadministrador puede ver este dashboard.');
      } else {
        setError(axiosErrorMessage(e, 'Error al cargar el dashboard.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewBienestar) {
      setLoading(false);
      setError('No tiene permiso para acceder al dashboard de asistencia.');
      return;
    }
    fetchDashboard();
  }, [canViewBienestar, fetchDashboard]);

  useEffect(() => {
    if (!canViewBienestar || !token) return;

    const connect = () => {
      const url = getAsistenciaDashboardWsUrl(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.type === 'refresh') fetchDashboard();
        } catch {
          // ignorar
        }
      };
    };

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [canViewBienestar, token, fetchDashboard]);

  useEffect(() => {
    setPageConSesion(1);
    setPageSinSesion(1);
  }, [searchQuery, jornadaFilter]);

  const porFicha = data?.por_ficha ?? [];
  const sinSesion = data?.fichas_sin_asistencia_hoy ?? [];
  const jornadasDisponibles = useJornadasDisponibles(porFicha, sinSesion);

  const fichasConSesionFiltradas = useMemo(
    () => filtrarFilasFicha(porFicha, searchQuery, jornadaFilter),
    [porFicha, searchQuery, jornadaFilter],
  );

  const fichasSinSesionFiltradas = useMemo(
    () => filtrarFilasFicha(sinSesion, searchQuery, jornadaFilter),
    [sinSesion, searchQuery, jornadaFilter],
  );

  const totalPagesConSesion = Math.ceil(fichasConSesionFiltradas.length / PAGE_SIZE);
  const totalPagesSinSesion = Math.ceil(fichasSinSesionFiltradas.length / PAGE_SIZE);

  const paginatedConSesion = useMemo(() => {
    const start = (pageConSesion - 1) * PAGE_SIZE;
    return fichasConSesionFiltradas.slice(start, start + PAGE_SIZE);
  }, [fichasConSesionFiltradas, pageConSesion]);

  const paginatedSinSesion = useMemo(() => {
    const start = (pageSinSesion - 1) * PAGE_SIZE;
    return fichasSinSesionFiltradas.slice(start, start + PAGE_SIZE);
  }, [fichasSinSesionFiltradas, pageSinSesion]);

  if (!canViewBienestar) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">
          No tiene permiso para acceder al dashboard de asistencia (requiere rol de Superadministrador o Bienestar al
          Aprendiz).
        </p>
        <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" aria-hidden />
          Volver a Asistencia
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-primary-600" aria-hidden />
            Dashboard de Asistencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cobertura en tiempo real según jornada activa (mañana, tarde, noche o jornada continua)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <SignalIcon className="w-4 h-4" aria-hidden />
              En vivo
            </span>
          )}
          <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
            Tomar asistencia
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando…
        </div>
      )}
      {!loading && data && (
        <AsistenciaDashboardDataView
          data={data}
          casosBienestarCount={casosBienestarCount}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          jornadaFilter={jornadaFilter}
          onJornadaFilterChange={setJornadaFilter}
          jornadasDisponibles={jornadasDisponibles}
          fichasConSesionFiltradas={fichasConSesionFiltradas}
          paginatedConSesion={paginatedConSesion}
          totalPagesConSesion={totalPagesConSesion}
          pageConSesion={pageConSesion}
          setPageConSesion={setPageConSesion}
          fichasSinSesionFiltradas={fichasSinSesionFiltradas}
          paginatedSinSesion={paginatedSinSesion}
          totalPagesSinSesion={totalPagesSinSesion}
          pageSinSesion={pageSinSesion}
          setPageSinSesion={setPageSinSesion}
        />
      )}
    </div>
  );
};
