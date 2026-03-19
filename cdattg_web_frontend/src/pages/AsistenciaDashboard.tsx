import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, UserGroupIcon, ChartBarIcon, SignalIcon, ExclamationTriangleIcon, DocumentMagnifyingGlassIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAsistenciaDashboardWsUrl } from '../config/api';
import type { AsistenciaDashboardResponse } from '../types';

export const AsistenciaDashboard = () => {
  const { token, roles } = useAuth();
  const [data, setData] = useState<AsistenciaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [casosBienestarCount, setCasosBienestarCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jornadaFilter, setJornadaFilter] = useState('');
  const [page, setPage] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 20;

  const canViewBienestar = roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');

  const fetchDashboard = async () => {
    try {
      setError('');
      const [res, casosRes] = await Promise.all([
        apiService.getAsistenciaDashboard(),
        apiService.getCasosBienestar({ dias: 30, min_fallas: 3 }).catch(() => ({ casos: [] })),
      ]);
      setData(res);
      setCasosBienestarCount(Array.isArray(casosRes?.casos) ? casosRes.casos.length : 0);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 403) {
        setError('Solo el superadministrador puede ver este dashboard.');
      } else {
        setError(err.response?.data?.error || 'Error al cargar el dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewBienestar) {
      setLoading(false);
      setError('No tiene permiso para acceder al dashboard de asistencia.');
      return;
    }
    fetchDashboard();
  }, [canViewBienestar]);

  // WebSocket para actualizaciones en tiempo real
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
        // Reconectar tras 5 s
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
  }, [canViewBienestar, token]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, jornadaFilter]);

  const jornadasDisponibles = useMemo(() => {
    const set = new Set<string>();
    (data?.por_ficha ?? []).forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [data]);

  const fichasFiltradas = useMemo(() => {
    const rows = data?.por_ficha ?? [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (jornadaFilter === '' || (row.jornada_nombre ?? '') === jornadaFilter) &&
        (q === '' ||
          row.ficha_numero?.toLowerCase().includes(q) ||
          row.programa_nombre?.toLowerCase().includes(q))
    );
  }, [data, searchQuery, jornadaFilter]);

  const totalPages = Math.ceil(fichasFiltradas.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return fichasFiltradas.slice(start, start + pageSize);
  }, [fichasFiltradas, page]);

  if (!canViewBienestar) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">
          No tiene permiso para acceder al dashboard de asistencia (requiere rol de Superadministrador o Bienestar al Aprendiz).
        </p>
        <Link to="/asistencia" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Asistencia
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Inicio</Link>
        <span>/</span>
        <Link to="/asistencia" className="hover:text-primary-600 dark:hover:text-primary-400">Asistencia</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Dashboard</span>
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-primary-600" />
            Dashboard de Asistencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Números en tiempo real: aprendices en formación hoy (sede modelo / todo el SENA)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <SignalIcon className="w-4 h-4" />
              En vivo
            </span>
          )}
          <Link to="/asistencia" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" />
            Tomar asistencia
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{data.fecha}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices en formación hoy</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">{data.total_aprendices_en_formacion}</p>
                </div>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas con sesión hoy</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.por_ficha.length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes de revisión (hoy)</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {data.pendientes_revision ?? 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                  <DocumentMagnifyingGlassIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Casos a tener en cuenta (Bienestar) */}
          <div className="card border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Casos a tener en cuenta (Bienestar al Aprendiz)</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Aprendices con 3 o más inasistencias en los últimos 30 días para seguimiento y prevención de deserción.
                  </p>
                  {casosBienestarCount !== null && (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                      {casosBienestarCount === 0
                        ? 'Ningún caso detectado con el criterio actual.'
                        : `${casosBienestarCount} caso${casosBienestarCount !== 1 ? 's' : ''} detectado${casosBienestarCount !== 1 ? 's' : ''}.`}
                    </p>
                  )}
                </div>
              </div>
              <Link
                to="/asistencia/dashboard/casos-bienestar"
                className="btn-primary inline-flex items-center justify-center gap-2 shrink-0"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                Ver casos a tener en cuenta
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Por ficha (vinieron a formación hoy)</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 mb-4">
              <div className="w-full sm:w-auto flex-1 min-w-[250px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar ficha
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código de ficha o programa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto min-w-[250px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtrar por jornada
                </label>
                <select
                  value={jornadaFilter}
                  onChange={(e) => setJornadaFilter(e.target.value)}
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

            {fichasFiltradas.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay fichas registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jornada</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sede</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vinieron hoy</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {paginatedRows.map((row) => (
                      <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.ficha_numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.programa_nombre || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jornada_nombre || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600 dark:text-primary-400">
                          {row.cantidad_vinieron} / {row.total_aprendices ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Pagina {page} de {totalPages} ({fichasFiltradas.length} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
