import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const DASHBOARD_ALLOWED_ROLES = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'] as const;

export const Dashboard = () => {
  const { user, roles, hasPermission } = useAuth();
  const [totalPersonas, setTotalPersonas] = useState<number | null>(null);
  const [totalInstructores, setTotalInstructores] = useState<number | null>(null);
  const [totalAprendices, setTotalAprendices] = useState<number | null>(null);
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
        // Personas: usar paginación para obtener el total
        if (hasPermission('VER PERSONAS')) {
          const personasRes = await apiService.getPersonas(1, 1);
          setTotalPersonas(personasRes.total);
        }

        // Instructores: endpoint devuelve todos y no incluye total
        if (hasPermission('VER FICHAS')) {
          const instructoresRes = await apiService.getInstructores();
          setTotalInstructores(instructoresRes.length);
        }

        // Aprendices: usar paginación para obtener el total
        if (hasPermission('VER APRENDICES')) {
          const aprendicesRes = await apiService.getAprendices(1, 1);
          setTotalAprendices(aprendicesRes.total);
        }
      } catch (e: any) {
        // Si alguna llamada falla, mostrar mensaje general pero no romper la vista
        const msg = e?.response?.data?.error ?? 'No se pudo cargar el resumen general.';
        setError(typeof msg === 'string' ? msg : 'No se pudo cargar el resumen general.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasPermission, hasRoleAccess]);

  const renderValor = (valor: number | null, canSee: boolean) => {
    if (!canSee) return '—';
    if (loading && valor === null) return '...';
    if (valor === null) return '—';
    return valor.toLocaleString('es-CO');
  };

  const canSeePersonas = hasPermission('VER PERSONAS');
  const canSeeInstructores = hasPermission('VER FICHAS'); // listado de instructores usa permiso de fichas
  const canSeeAprendices = hasPermission('VER APRENDICES');

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
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Personas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {renderValor(totalPersonas, canSeePersonas)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
              <AcademicCapIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
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
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
