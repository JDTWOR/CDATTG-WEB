import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarDaysIcon, ChartBarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { FichaCaracterizacionResponse } from '../../../types';
import { fichasPaths } from '../../../routes/paths';
import { asistenciaFichaPath, asistenciaHistorialFichaPath } from '../../asistencia/asistenciaPaths';

type FichaDetalleHeaderProps = Readonly<{
  ficha: FichaCaracterizacionResponse;
  puedeEditarFicha: boolean;
  onEditarFicha: () => void;
}>;

export function FichaDetalleHeader({ ficha, puedeEditarFicha, onEditarFicha }: FichaDetalleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Link
          to={fichasPaths.index}
          className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          title="Volver al listado"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ficha de caracterización</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha {ficha.ficha}</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">{ficha.programa_formacion_nombre || '—'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {puedeEditarFicha && (
          <button
            type="button"
            onClick={onEditarFicha}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Editar ficha
          </button>
        )}
        {ficha.status ? (
          <Link
            to={asistenciaFichaPath(ficha.id)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Tomar asistencia
          </Link>
        ) : null}
        <Link
          to={asistenciaHistorialFichaPath(ficha.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <ChartBarIcon className="h-5 w-5" />
          Historial
        </Link>
      </div>
    </div>
  );
}
