import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { asistenciaPaths } from '../../routes/paths';
import { getInicioNavigationPath } from '../../utils/roles';

export function AsistenciaSinFichasView() {
  const { roles, permissions } = useAuth();
  const volverTo = getInicioNavigationPath(roles, permissions, asistenciaPaths.index);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asistencia</h1>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No tienes fichas asignadas</h2>
        <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
          Contacta al administrador para que te asigne las fichas correspondientes.
        </p>
        <Link
          to={volverTo}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
