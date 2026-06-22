import { useState, useEffect, useRef, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChartBarIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { formatNumero } from '../utils/formatFecha';
import { useAuth } from '../context/AuthContext';
import { getAsistenciaDashboardWsUrl } from '../config/api';
import type {
  AsistenciaDashboardFichaSinSesion,
  AsistenciaDashboardPorFicha,
  AsistenciaDashboardResponse,
} from '../types';
import { asistenciaPaths, bienestarPaths } from '../routes/paths';
import { canViewCasosBienestar } from './bienestar/casos/casosBienestarPermissions';
import {
  filtrarFilasFicha,
  filasPorJornada,
  FiltrosDashboard,
  jornadaInicialDesdeApi,
  useJornadasDisponibles,
} from './dashboard/dashboardFichaFilters';

const DASH_SEARCH_ID = 'asistencia-dashboard-buscar-ficha';
const DASH_JORNADA_ID = 'asistencia-dashboard-filtro-jornada';
const PAGE_SIZE = 20;

function textoResumenCasosBienestar(count: number): string {
  if (count === 0) return 'Sin aprendices que cumplan el umbral configurado (≥3 inasistencias / 30 días).';
  if (count === 1) return '1 aprendiz en umbral de riesgo por inasistencias.';
  return `${count} aprendices en umbral de riesgo por inasistencias.`;
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

type DashboardMetricas = {
  vinieron: number;
  enFormacion: number;
  totalConSesion: number;
  totalEsperado: number;
  fichasConSesion: number;
  fichasSinSesion: number;
  jornadasTexto: string;
};

function agregarTotalesConSesion(rows: AsistenciaDashboardPorFicha[]): {
  vinieron: number;
  enFormacion: number;
  totalAprendices: number;
} {
  return rows.reduce(
    (acc, row) => ({
      vinieron: acc.vinieron + (row.cantidad_vinieron ?? 0),
      enFormacion: acc.enFormacion + (row.cantidad_en_formacion ?? 0),
      totalAprendices: acc.totalAprendices + (row.total_aprendices ?? 0),
    }),
    { vinieron: 0, enFormacion: 0, totalAprendices: 0 },
  );
}

function calcularMetricasDashboard(
  data: AsistenciaDashboardResponse,
  porFicha: AsistenciaDashboardPorFicha[],
  sinSesion: AsistenciaDashboardFichaSinSesion[],
  jornadaFilter: string,
): DashboardMetricas {
  const conSesion = filasPorJornada(porFicha, jornadaFilter);
  const sinS = filasPorJornada(sinSesion, jornadaFilter);
  const totalesConSesion = agregarTotalesConSesion(conSesion);
  const totalSinSesion = sinS.reduce((sum, row) => sum + (row.total_aprendices ?? 0), 0);

  return {
    vinieron: totalesConSesion.vinieron,
    enFormacion: totalesConSesion.enFormacion,
    totalConSesion: totalesConSesion.totalAprendices,
    totalEsperado: totalesConSesion.totalAprendices + totalSinSesion,
    fichasConSesion: conSesion.length,
    fichasSinSesion: sinS.length,
    jornadasTexto: jornadaFilter || formatearJornadasActivas(data.jornadas_disponibles),
  };
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
  const metricas = calcularMetricasDashboard(data, data.por_ficha, data.fichas_sin_asistencia_hoy ?? [], jornadaFilter);
  const vinieron = metricas.vinieron;
  const enFormacion = metricas.enFormacion;
  const totalConSesion = metricas.totalConSesion;
  const totalEsperado = metricas.totalEsperado;
  const jornadasTexto = metricas.jornadasTexto;
  const fichasConSesion = metricas.fichasConSesion;
  const fichasSinSesion = metricas.fichasSinSesion;
  const porcentajeVinieron = totalConSesion > 0 ? ((vinieron / totalConSesion) * 100).toFixed(1) : null;
  const scopeJornadaLabel = jornadaFilter || jornadasTexto || 'todas las jornadas programadas';

  const totalesConSesion = agregarTotalesConSesion(fichasConSesionFiltradas);

  return (
    <>
      <FiltrosDashboard
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        jornadaFilter={jornadaFilter}
        onJornadaFilterChange={onJornadaFilterChange}
        jornadasDisponibles={jornadasDisponibles}
        searchId={DASH_SEARCH_ID}
        jornadaId={DASH_JORNADA_ID}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de corte</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{data.fecha}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asistencia efectiva</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1 tabular-nums">
                {totalConSesion > 0 ? (
                  <>
                    {formatNumero(vinieron)}
                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      {' '}
                      / {formatNumero(totalConSesion)}
                    </span>
                  </>
                ) : (
                  formatNumero(vinieron)
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {totalConSesion > 0 ? (
                  <>
                    Ratio sobre matrícula activa en fichas con sesión abierta
                    {porcentajeVinieron != null && ` (${porcentajeVinieron}%)`}
                    {scopeJornadaLabel ? ` · ámbito: ${scopeJornadaLabel}` : ''}
                    {enFormacion !== vinieron && (
                      <> · {formatNumero(enFormacion)} con ingreso sin salida</>
                    )}
                  </>
                ) : (
                  `Sin sesiones abiertas en el ámbito: ${scopeJornadaLabel}`
                )}
              </p>
              {fichasSinSesion > 0 && totalEsperado > totalConSesion && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Matrícula activa proyectada: {formatNumero(totalEsperado)} aprendices
                  ({fichasSinSesion} ficha{fichasSinSesion === 1 ? '' : 's'} sin apertura de sesión)
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas con sesión abierta</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas sin apertura de sesión</p>
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
          <span className="font-medium">Cobertura operativa ({scopeJornadaLabel}):</span>{' '}
          <span className="tabular-nums">{data.total_fichas_registradas ?? '—'}</span> fichas activas en sistema ·{' '}
          <span className="tabular-nums text-green-700 dark:text-green-400">{fichasConSesion}</span> con sesión registrada ·{' '}
          <span className="tabular-nums text-amber-700 dark:text-amber-300">{fichasSinSesion}</span> sin apertura ·{' '}
          <span className="tabular-nums text-amber-600 dark:text-amber-400">{data.pendientes_revision ?? 0}</span>{' '}
          marcaciones pendientes de revisión
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
                Seguimiento de riesgo — Bienestar al Aprendiz
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Aprendices con ≥3 inasistencias efectivas en ventana móvil de 30 días (criterio de alerta temprana).
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
            Ver módulo de casos
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Fichas con sesión registrada
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fichas con formación programada el {data.fecha} y al menos una sesión de asistencia abierta
          {jornadaFilter ? ` · jornada ${jornadaFilter}` : ''}.
        </p>

        {fichasConSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Ningún registro coincide con los criterios de búsqueda o jornada seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas con sesión de asistencia registrada en el ámbito filtrado</caption>
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
                    Asist. / Matrícula
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
                    Total sesión abierta
                    {jornadaFilter ? ` · ${jornadaFilter}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                    {formatNumero(totalesConSesion.vinieron)} /{' '}
                    {formatNumero(totalesConSesion.totalAprendices)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
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
          Fichas pendientes de apertura de sesión
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fichas con formación programada el {data.fecha} sin registro de sesión de asistencia
          {jornadaFilter ? ` · jornada ${jornadaFilter}` : ''}.
        </p>

        {fichasSinSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Cobertura completa en el ámbito filtrado, o sin coincidencias en la búsqueda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas sin apertura de sesión de asistencia en el ámbito filtrado</caption>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Matrícula activa
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
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.instructor_nombre ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300 tabular-nums">
                      {row.total_aprendices}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={asistenciaPaths.sesion(row.ficha_id)}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                      >
                        Registrar asistencia
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
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Marcaciones pendientes de revisión</p>
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
  const jornadaInicializadaRef = useRef(false);
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
      if (!jornadaInicializadaRef.current) {
        setJornadaFilter(jornadaInicialDesdeApi(res));
        jornadaInicializadaRef.current = true;
      }
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
    fetchDashboard();
  }, [fetchDashboard]);

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
  const jornadasDisponibles = useJornadasDisponibles(data?.jornadas_disponibles, porFicha, sinSesion);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-primary-600" aria-hidden />
            Dashboard de Asistencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Indicadores de cobertura de asistencia por jornada de formación. Los totales responden al filtro de jornada seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <SignalIcon className="w-4 h-4" aria-hidden />
              Sincronización en tiempo real
            </span>
          )}
          <Link to={asistenciaPaths.fichas} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
            Registrar asistencia
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
