import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { CasosBienestarResponse, CasoBienestarItem } from '../types';

export const CasosBienestarFichaDetalle = () => {
  const { roles } = useAuth();
  const { fichaNumero } = useParams<{ fichaNumero: string }>();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<CasosBienestarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const diasParam = Number(searchParams.get('dias') || '');
  const minFallasParam = Number(searchParams.get('min_fallas') || '');
  const dias = Number.isFinite(diasParam) && diasParam > 0 ? diasParam : 30;
  const minFallas = Number.isFinite(minFallasParam) && minFallasParam > 0 ? minFallasParam : 3;
  const sedeNombreParam = searchParams.get('sede') || '';

  const canViewBienestar = roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');

  useEffect(() => {
    if (!canViewBienestar) {
      setLoading(false);
      setError('No tiene permiso para acceder a los casos de bienestar.');
      return;
    }
    if (!fichaNumero) {
      setLoading(false);
      setError('Ficha no especificada.');
      return;
    }

    const fetchData = async () => {
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

    fetchData();
  }, [canViewBienestar, fichaNumero, dias, minFallas]);

  if (!canViewBienestar) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">
          No tiene permiso para acceder a los casos de bienestar (requiere rol de Superadministrador o Bienestar al Aprendiz).
        </p>
        <Link to="/asistencia/dashboard/casos-bienestar" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Casos de Bienestar
        </Link>
      </div>
    );
  }

  const casosFicha: CasoBienestarItem[] =
    data?.casos.filter(
      (c) =>
        c.ficha_numero === fichaNumero &&
        (!sedeNombreParam || (c.sede_nombre || '') === sedeNombreParam)
    ) ?? [];

  const sedeNombre =
    sedeNombreParam || (casosFicha.length > 0 ? casosFicha[0].sede_nombre : '');

  const totalSesiones = casosFicha.reduce((sum, c) => sum + c.total_sesiones, 0);
  const totalInasistencias = casosFicha.reduce((sum, c) => sum + c.inasistencias, 0);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">
          Inicio
        </Link>
        <span>/</span>
        <Link to="/asistencia" className="hover:text-primary-600 dark:hover:text-primary-400">
          Asistencia
        </Link>
        <span>/</span>
        <Link
          to="/asistencia/dashboard"
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link
          to="/asistencia/dashboard/casos-bienestar"
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          Casos a tener en cuenta
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          Ficha {fichaNumero}
        </span>
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
            Ficha {fichaNumero} - Casos de bienestar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detalle de aprendices con indicadores de riesgo de deserción en esta ficha.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Período: últimos {dias} días · Mínimo de inasistencias: {minFallas}+
          </p>
          {sedeNombre && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sede: {sedeNombre}
            </p>
          )}
        </div>
        <Link
          to="/asistencia/dashboard/casos-bienestar"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Casos de Bienestar
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          Cargando casos de la ficha...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aprendices en riesgo
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {casosFicha.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Últimos {dias} días, con {minFallas}+ inasistencias
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Resumen de inasistencias
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Total sesiones analizadas:{' '}
                  <span className="font-semibold">{totalSesiones}</span>
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Total inasistencias:{' '}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {totalInasistencias}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-4 pt-4">
              Aprendices de la ficha {fichaNumero} a tener en cuenta
            </h2>
            {casosFicha.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No se encontraron aprendices que cumplan los criterios en esta ficha para el
                período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sede
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sesiones
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Asistió
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Inasistencias
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {casosFicha.map((c: CasoBienestarItem) => (
                      <tr
                        key={c.aprendiz_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {c.numero_documento}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {c.persona_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {c.sede_nombre || '–'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                          {c.total_sesiones}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                          {c.asistencias_efectivas}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-amber-600 dark:text-amber-400">
                          {c.inasistencias}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

