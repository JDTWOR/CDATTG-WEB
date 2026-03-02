import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  FunnelIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { CasosBienestarResponse, CasoBienestarItem } from '../types';

export const CasosBienestar = () => {
  const { roles } = useAuth();
  const [data, setData] = useState<CasosBienestarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dias, setDias] = useState(30);
  const [minFallas, setMinFallas] = useState(3);

  const canViewBienestar = roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');

  const casosPorFicha =
    data && Array.isArray(data.casos)
      ? Object.entries(
          data.casos.reduce<
            Record<
              string,
              {
                ficha_numero: string;
                sede_nombre: string;
                casos: CasoBienestarItem[];
                totalInasistencias: number;
                totalSesiones: number;
                totalAsistencias: number;
              }
            >
          >((acc, caso) => {
            const key = `${caso.ficha_numero}||${caso.sede_nombre || ''}`;
            if (!acc[key]) {
              acc[key] = {
                ficha_numero: caso.ficha_numero,
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
          }, {})
        ).map(([groupKey, group]) => ({ ...group, groupKey }))
      : [];

  const fetchCasos = async () => {
    if (!canViewBienestar) return;
    try {
      setError('');
      const res = await apiService.getCasosBienestar({ dias, min_fallas: minFallas });
      setData(res);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 403) {
        setError('Solo el superadministrador puede ver los casos de bienestar.');
      } else {
        setError(err.response?.data?.error || 'Error al cargar los casos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewBienestar) {
      setLoading(false);
      setError('No tiene permiso para acceder a los casos de bienestar.');
      return;
    }
    fetchCasos();
  }, [canViewBienestar, dias, minFallas]);

  if (!canViewBienestar) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">
          No tiene permiso para acceder a los casos de bienestar (requiere rol de Superadministrador o Bienestar al Aprendiz).
        </p>
        <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver al Dashboard
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
        <Link to="/asistencia/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Casos a tener en cuenta</span>
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
            Casos a tener en cuenta (Bienestar al Aprendiz)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Aprendices con indicadores de riesgo de deserción: inasistencias repetidas para seguimiento por la oficina de bienestar.
          </p>
        </div>
        <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver al Dashboard
        </Link>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <FunnelIcon className="w-5 h-5" />
          Criterios de análisis
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Últimos</span>
            <select
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mínimo de inasistencias</span>
            <select
              value={minFallas}
              onChange={(e) => setMinFallas(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value={1}>1 o más</option>
              <option value={2}>2 o más</option>
              <option value={3}>3 o más</option>
              <option value={5}>5 o más</option>
              <option value={10}>10 o más</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">Cargando casos...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos detectados</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.casos.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Últimos {data.dias_analizados} días, con {data.min_fallas}+ inasistencias
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <DocumentMagnifyingGlassIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criterio</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Riesgo de deserción: inasistencias repetidas sin justificar para seguimiento por bienestar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fichas con casos de bienestar
            </h2>
            {data.casos.length === 0 ? (
              <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
                No se encontraron aprendices que cumplan los criterios en el período seleccionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {casosPorFicha.map((ficha) => {
                  return (
                    <div key={ficha.groupKey} className="card p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Ficha
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {ficha.ficha_numero}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {ficha.sede_nombre || 'Sede sin especificar'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Aprendices en riesgo
                          </p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {ficha.casos.length}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 gap-2">
                        <span>
                          Sesiones analizadas:{' '}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {ficha.totalSesiones}
                          </span>
                        </span>
                        <span>
                          Total inasistencias:{' '}
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {ficha.totalInasistencias}
                          </span>
                        </span>
                      </div>
                      <Link
                        to={`/asistencia/dashboard/casos-bienestar/ficha/${encodeURIComponent(
                          ficha.ficha_numero
                        )}?sede=${encodeURIComponent(
                          ficha.sede_nombre || ''
                        )}&dias=${dias}&min_fallas=${minFallas}`}
                        className="btn-primary mt-1 text-center"
                      >
                        Ver aprendices
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
