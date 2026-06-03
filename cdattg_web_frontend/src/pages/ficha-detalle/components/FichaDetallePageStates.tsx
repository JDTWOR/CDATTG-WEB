import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fichasPaths } from '../../../routes/paths';

export function FichaDetalleInvalidIdState() {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-6 text-red-800 dark:text-red-200">
      <p className="font-medium">Identificador inválido.</p>
      <Link to={fichasPaths.index} className="mt-2 inline-flex items-center gap-1 text-sm underline">
        <ArrowLeftIcon className="w-4 h-4" /> Volver a fichas
      </Link>
    </div>
  );
}

export function FichaDetalleLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600 dark:text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm">Cargando ficha…</p>
    </div>
  );
}

type FichaDetalleErrorStateProps = Readonly<{
  message: string;
}>;

export function FichaDetalleErrorState({ message }: FichaDetalleErrorStateProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-6 text-red-800 dark:text-red-200">
        <p className="font-medium">{message}</p>
      </div>
      <Link
        to={fichasPaths.index}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Volver a fichas
      </Link>
    </div>
  );
}
