import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type { AsistenciaDashboardResponse } from '../types';

const DASHBOARD_ALLOWED_ROLES = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'] as const;

export const Dashboard = () => {
  const { user, roles, hasPermission } = useAuth();
  const [totalPersonas, setTotalPersonas] = useState<number | null>(null);
  const [totalInstructores, setTotalInstructores] = useState<number | null>(null);
  const [totalAprendices, setTotalAprendices] = useState<number | null>(null);
  const [asistenciaHoy, setAsistenciaHoy] = useState<number | null>(null);
  const [pendientesRevisionHoy, setPendientesRevisionHoy] = useState<number | null>(null);
  const [casosBienestar, setCasosBienestar] = useState<number | null>(null);
  const [asistenciaDashboard, setAsistenciaDashboard] = useState<AsistenciaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasRoleAccess = roles.some((r) => DASHBOARD_ALLOWED_ROLES.includes(r as (typeof DASHBOARD_ALLOWED_ROLES)[number]));

  useEffect(() => {
    if (!hasRoleAccess) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const canSeePersonasNow = hasPermission('VER PERSONAS');
        const canSeeInstructoresNow = hasPermission('VER FICHAS');
        const canSeeAprendicesNow = hasPermission('VER APRENDICES');
        const canSeeAsistenciaNow = hasPermission('VER ASISTENCIA');
        const canSeeBienestarNow = roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');

        const [personasRes, instructoresRes, aprendicesRes, asistenciaRes, casosRes] = await Promise.all([
          canSeePersonasNow ? apiService.getPersonas(1, 1) : Promise.resolve(null),
          canSeeInstructoresNow ? apiService.getInstructores(1, 1) : Promise.resolve(null),
          canSeeAprendicesNow ? apiService.getAprendices(1, 1) : Promise.resolve(null),
          canSeeAsistenciaNow ? apiService.getAsistenciaDashboard() : Promise.resolve(null),
          canSeeBienestarNow ? apiService.getCasosBienestar({ dias: 30, min_fallas: 3 }) : Promise.resolve(null),
        ]);

        setTotalPersonas(personasRes?.total ?? null);
        setTotalInstructores(instructoresRes?.total ?? null);
        setTotalAprendices(aprendicesRes?.total ?? null);
        setAsistenciaDashboard(asistenciaRes);
        setAsistenciaHoy(asistenciaRes?.total_aprendices_en_formacion ?? null);
        setPendientesRevisionHoy(asistenciaRes?.pendientes_revision ?? null);
        setCasosBienestar(
          casosRes != null && Array.isArray(casosRes.casos) ? casosRes.casos.length : null,
        );
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo cargar el resumen general.'));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [hasPermission, hasRoleAccess, roles]);

  const renderValor = (valor: number | null, canSee: boolean) => {
    if (!canSee) return '—';
    if (loading && valor === null) return '…';
    if (valor === null) return '—';
    return valor.toLocaleString('es-CO');
  };

  const canSeePersonas = hasPermission('VER PERSONAS');
  const canSeeInstructores = hasPermission('VER FICHAS'); // listado de instructores usa permiso de fichas
  const canSeeAprendices = hasPermission('VER APRENDICES');
  const canSeeAsistencia = hasPermission('VER ASISTENCIA');
  const canSeeBienestar = roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');

  const filasPorSede = useMemo(() => {
    const map = new Map<string, { vinieron: number; total: number }>();
    (asistenciaDashboard?.por_ficha ?? []).forEach((row) => {
      const key = row.sede_nombre || 'Sin sede';
      const prev = map.get(key) ?? { vinieron: 0, total: 0 };
      map.set(key, {
        vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
        total: prev.total + (row.total_aprendices ?? 0),
      });
    });
    return Array.from(map.entries())
      .map(([nombre, valores]) => ({ nombre, ...valores }))
      .sort((a, b) => b.vinieron - a.vinieron)
      .slice(0, 5);
  }, [asistenciaDashboard]);

  const filasPorJornada = useMemo(() => {
    const map = new Map<string, { vinieron: number; total: number }>();
    (asistenciaDashboard?.por_ficha ?? []).forEach((row) => {
      const key = row.jornada_nombre || 'Sin jornada';
      const prev = map.get(key) ?? { vinieron: 0, total: 0 };
      map.set(key, {
        vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
        total: prev.total + (row.total_aprendices ?? 0),
      });
    });
    return Array.from(map.entries())
      .map(([nombre, valores]) => ({ nombre, ...valores }))
      .sort((a, b) => b.vinieron - a.vinieron)
      .slice(0, 5);
  }, [asistenciaDashboard]);

  if (!hasRoleAccess) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-red-600 dark:text-red-400 text-sm">
          No tiene permiso para ver este dashboard. Solo pueden acceder los roles SUPER ADMINISTRADOR, ADMINISTRADOR y BIENESTAR AL APRENDIZ.
        </p>
        <Link to="/perfil" className="btn-secondary inline-flex items-center justify-center">
          Volver a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Bienvenido, {user?.full_name}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Fila 1: KPI rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Personas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(totalPersonas, canSeePersonas)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Instructores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(totalInstructores, canSeeInstructores)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(totalAprendices, canSeeAprendices)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asistencia hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(asistenciaHoy, canSeeAsistencia)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: riesgo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos bienestar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(casosBienestar, canSeeBienestar)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes de revisión</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(pendientesRevisionHoy, canSeeAsistencia)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* Fila 3: segmentación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asistencia por sede</h2>
          {canSeeAsistencia && filasPorSede.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Asistencia agregada por sede para hoy</caption>
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2">Sede</th>
                    <th className="pb-2 text-right">Vinieron / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPorSede.map((row) => (
                    <tr key={row.nombre} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 text-gray-700 dark:text-gray-300">{row.nombre}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                        {row.vinieron} / {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canSeeAsistencia && filasPorSede.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos para hoy.</p>
          )}
          {canSeeAsistencia ? null : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin permiso para ver asistencia.</p>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asistencia por jornada</h2>
          {canSeeAsistencia && filasPorJornada.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Asistencia agregada por jornada para hoy</caption>
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2">Jornada</th>
                    <th className="pb-2 text-right">Vinieron / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPorJornada.map((row) => (
                    <tr key={row.nombre} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 text-gray-700 dark:text-gray-300">{row.nombre}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                        {row.vinieron} / {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canSeeAsistencia && filasPorJornada.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos para hoy.</p>
          )}
          {canSeeAsistencia ? null : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin permiso para ver asistencia.</p>
          )}
        </div>
      </div>

      {/* Fila 4: acciones */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accesos directos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/asistencia" className="btn-secondary inline-flex items-center justify-center">
            Tomar asistencia
          </Link>
          <Link to="/asistencia/historial" className="btn-secondary inline-flex items-center justify-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2" aria-hidden />
            Historial asistencias
          </Link>
          <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center justify-center">
            Dashboard asistencia
          </Link>
          <Link to="/asistencia/dashboard/casos-bienestar" className="btn-secondary inline-flex items-center justify-center">
            Casos bienestar
          </Link>
          {roles.includes('SUPER ADMINISTRADOR') && (
            <Link to="/asistencia/tipos-observacion" className="btn-secondary inline-flex items-center justify-center">
              Tipos de observación
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
