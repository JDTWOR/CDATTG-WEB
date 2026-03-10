import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { FichaCaracterizacionResponse } from '../types';

export const AsistenciaHistorial = () => {
  const { roles } = useAuth();
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  useEffect(() => {
    const fetchFichas = async () => {
      setLoading(true);
      setError('');
      try {
        // Superadmin ve todas las fichas; instructores solo las asignadas
        const res = await apiService.getFichasCaracterizacion(1, 500, undefined, isSuperAdmin ? undefined : true);
        setFichas(res.data);
      } catch {
        setFichas([]);
        setError('No se pudo cargar el listado de fichas.');
      } finally {
        setLoading(false);
      }
    };
    fetchFichas();
  }, [isSuperAdmin]);

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
        <Link
          to="/asistencia"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ClipboardDocumentListIcon className="w-5 h-5" />
          Tomar asistencia
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando fichas…</div>
      ) : fichas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {isSuperAdmin
              ? 'No hay fichas de caracterización registradas en el sistema.'
              : 'No tiene fichas asignadas como instructor. Solo puede ver el historial de las fichas en las que está asignado.'}
          </p>
          <Link to="/asistencia" className="btn-primary mt-4 inline-flex">
            Ir a tomar asistencia
          </Link>
        </div>
      ) : isSuperAdmin ? (
        /* Vista superadmin: tabla con todas las fichas y botón Ver historial */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Ficha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Programa de formación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Instructor líder
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
                {fichas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.ficha}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {item.programa_formacion_nombre || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.instructor_nombre || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.cantidad_aprendices}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/asistencia/historial/ficha/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <CalendarDaysIcon className="w-4 h-4" />
                        Ver historial
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista instructor: tarjetas con sus fichas asignadas */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fichas.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm leading-tight">
                    {item.programa_formacion_nombre || 'Sin programa'}
                  </h3>
                  {item.modalidad_formacion_nombre && (
                    <span className="shrink-0 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                      {item.modalidad_formacion_nombre}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Ficha {item.ficha}</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2 mb-1">
                      Información académica
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Jornada: {item.jornada_nombre || '-'}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Sede / Ambiente: {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '-'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Instructor líder
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{item.instructor_nombre || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.cantidad_aprendices} Aprendices
                  </span>
                  <Link
                    to={`/asistencia/historial/ficha/${item.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                  >
                    Ver historial de asistencias
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
