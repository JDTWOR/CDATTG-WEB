import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AsistenciaMetodosAccordion } from './AsistenciaMetodosAccordion';
import { AsistenciaModals } from './AsistenciaModals';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState }>;

function SesionFichaCard({ page }: Readonly<{ page: AsistenciaPageState }>) {
  const { fichaSeleccionada, sesionActual } = page;
  if (!fichaSeleccionada || !sesionActual) return null;

  const abrirObservacionSesion = () => {
    page.setObservacionesSesionModal({ observaciones: sesionActual.observaciones ?? '' });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {fichaSeleccionada.modalidad_formacion_nombre ? (
            <span className="inline-block rounded-md bg-primary-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
              {fichaSeleccionada.modalidad_formacion_nombre}
            </span>
          ) : null}
          <h2 className="mt-2 text-lg font-bold uppercase text-gray-900 dark:text-white">
            {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Ficha {fichaSeleccionada.ficha}</p>
          {fichaSeleccionada.instructor_nombre ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-800 dark:text-gray-100">Instructor líder:</span>{' '}
              {fichaSeleccionada.instructor_nombre}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {page.enSesionCount} de {page.aprendicesFicha.length} con registro en sesión
          </p>
          {sesionActual.observaciones ? (
            <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-800 dark:text-gray-100">Observación de la sesión:</span>{' '}
              {sesionActual.observaciones}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={abrirObservacionSesion} className="btn-secondary text-sm">
            Observación de sesión
          </button>
          <button type="button" onClick={page.handleVolverAFichas} className="btn-secondary text-sm">
            Volver a fichas
          </button>
        </div>
      </div>
    </div>
  );
}

export function AsistenciaTomarSesionView({ page }: Props) {
  const { fichaSeleccionada, sesionActual } = page;

  if (!fichaSeleccionada || !sesionActual) return null;

  return (
    <div className="space-y-4 pb-8 md:pb-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Tomar asistencia</h1>
            <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
              Ficha {fichaSeleccionada.ficha} · {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Abra un método a la vez; al elegir otro, el anterior se cierra.
            </p>
          </div>
          <button type="button" onClick={page.handleVolverAFichas} className="btn-secondary shrink-0 text-sm lg:hidden">
            Volver
          </button>
        </div>
      </div>

      <SesionFichaCard page={page} />

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <label htmlFor="busqueda-aprendiz-global" className="sr-only">
          Buscar aprendiz en la ficha
        </label>
        <input
          id="busqueda-aprendiz-global"
          type="search"
          value={page.busquedaAprendiz}
          onChange={(e) => page.setBusquedaAprendiz(e.target.value)}
          placeholder="Buscar aprendiz por nombre o documento (aplica a listas)..."
          className="input-field w-full pl-10"
        />
      </div>

      <AsistenciaMetodosAccordion key={sesionActual.id} page={page} sesionId={sesionActual.id} />

      <AsistenciaModals page={page} />
    </div>
  );
}
