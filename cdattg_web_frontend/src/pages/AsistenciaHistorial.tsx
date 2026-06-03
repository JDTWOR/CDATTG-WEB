import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { useAuth } from '../context/AuthContext';
import { LABEL_INSTRUCTOR_LIDER } from '../constants/instructorLiderLabels';
import { FichaCaracterizacionCard } from '../components/FichaCaracterizacionCard';
import type { FichaCaracterizacionResponse } from '../types';
import { asistenciaHistorialFichaPath, asistenciaPaths } from './asistencia/asistenciaPaths';

const HISTORIAL_SEARCH_ID = 'asistencia-historial-buscar-ficha';

type HistorialFichasTableProps = Readonly<{ rows: FichaCaracterizacionResponse[] }>;

function HistorialFichasTable({ rows }: HistorialFichasTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <caption className="sr-only">Listado de fichas para consultar historial de asistencia</caption>
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Ficha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Programa de formación
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {LABEL_INSTRUCTOR_LIDER}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Jornada
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Sede / Ambiente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Aprendices
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.ficha}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {item.programa_formacion_nombre || '–'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.instructor_nombre || '–'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.jornada_nombre || '–'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '–'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.cantidad_aprendices}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={asistenciaHistorialFichaPath(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <CalendarDaysIcon className="w-4 h-4" aria-hidden />
                    Ver historial
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type HistorialFichasCardsProps = Readonly<{ rows: FichaCaracterizacionResponse[] }>;

function HistorialFichasCards({ rows }: HistorialFichasCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((item) => (
        <FichaCaracterizacionCard
          key={item.id}
          ficha={item}
          actions={
            <Link
              to={asistenciaHistorialFichaPath(item.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden />
              Ver historial
            </Link>
          }
        />
      ))}
    </div>
  );
}

export const AsistenciaHistorial = () => {
  const { roles } = useAuth();
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const loadFichas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getFichasCaracterizacion(1, 500, undefined, isSuperAdmin ? undefined : true);
      setFichas(res.data);
    } catch (e: unknown) {
      setFichas([]);
      setError(axiosErrorMessage(e, 'No se pudo cargar el listado de fichas.'));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadFichas();
  }, [loadFichas]);

  const fichasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return fichas;
    return fichas.filter(
      (ficha) =>
        ficha.ficha.toLowerCase().includes(q) ||
        (ficha.programa_formacion_nombre?.toLowerCase().includes(q) ?? false)
    );
  }, [fichas, searchQuery]);

  const hayResultados = fichasFiltradas.length > 0;
  const vacioTrasFiltro = !loading && hayResultados === false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial de asistencias</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isSuperAdmin
              ? 'Consulte el historial de asistencia de cualquier ficha. Seleccione una ficha para ver detalle por fecha.'
              : 'Consulte por fecha qué aprendices asistieron o no a cada ficha. Solo puede ver el historial de las fichas en las que está asignado.'}
          </p>
        </div>
        <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-5 h-5" aria-hidden />
          Tomar asistencia
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {!loading && isSuperAdmin && (
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="w-full sm:w-auto flex-1 min-w-[250px]">
            <label
              htmlFor={HISTORIAL_SEARCH_ID}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Buscar ficha
            </label>
            <div className="relative">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                aria-hidden
              />
              <input
                id={HISTORIAL_SEARCH_ID}
                type="search"
                autoComplete="off"
                placeholder="Buscar por código de ficha o programa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
              />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando fichas…
        </div>
      )}

      {vacioTrasFiltro && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {isSuperAdmin
              ? 'No hay fichas registradas'
              : 'No tiene fichas asignadas como instructor. Solo puede ver el historial de las fichas en las que está asignado.'}
          </p>
          <Link to={asistenciaPaths.index} className="btn-primary mt-4 inline-flex">
            Ir a tomar asistencia
          </Link>
        </div>
      )}

      {!loading && hayResultados && isSuperAdmin && <HistorialFichasTable rows={fichasFiltradas} />}

      {!loading && hayResultados && !isSuperAdmin && <HistorialFichasCards rows={fichasFiltradas} />}
    </div>
  );
};
