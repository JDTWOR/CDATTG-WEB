import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { asistenciaPaths } from '../../routes/paths';

export function AsistenciaSinFichasView() {
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
        <Link to={asistenciaPaths.index} className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700">
          <ArrowLeftIcon className="h-5 w-5" />
          Volver
        </Link>
      </div>
    </div>
  );
}
