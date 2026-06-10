import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { asistenciaPaths } from '../../routes/paths';
import { useAsistenciaSesion } from './useAsistenciaSesion';
import { AsistenciaTomarSesionView } from './AsistenciaTomarSesionView';

export function AsistenciaSesionPage() {
  const page = useAsistenciaSesion();

  if (page.entrando) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">Entrando a la sesión…</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Preparando la toma de asistencia.</p>
      </div>
    );
  }

  if (page.errorEntrada || !page.showTomarSesion) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tomar asistencia</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {page.errorEntrada || 'No se pudo abrir la sesión de asistencia.'}
        </div>
        <Link
          to={asistenciaPaths.fichas}
          className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Volver al listado de fichas
        </Link>
      </div>
    );
  }

  return <AsistenciaTomarSesionView page={page} />;
}
