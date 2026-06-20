import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FichaCaracterizacionCard } from '../../components/FichaCaracterizacionCard';
import { formatRangoFechasVista } from '../../utils/formatFecha';
import { AsistenciaAprendicesListaSesion } from './AsistenciaAprendicesListaSesion';
import { AsistenciaMetodosAccordion } from './AsistenciaMetodosAccordion';
import { AsistenciaModals } from './AsistenciaModals';
import type { AsistenciaSesionPageState } from './useAsistenciaSesion';

type Props = Readonly<{ page: AsistenciaSesionPageState }>;

function SesionFichaCard({ page }: Readonly<{ page: AsistenciaSesionPageState }>) {
  const { fichaSeleccionada, sesionActual, sesionSoloLectura } = page;
  if (!fichaSeleccionada || !sesionActual) return null;

  const abrirObservacionSesion = () => {
    page.setObservacionesSesionModal({ observaciones: sesionActual.observaciones ?? '' });
  };

  const fechasFormacion = formatRangoFechasVista(
    fichaSeleccionada.fecha_inicio,
    fichaSeleccionada.fecha_fin
  );

  return (
    <FichaCaracterizacionCard
      ficha={fichaSeleccionada}
      collapsible
      defaultOpen={false}
      footerLeft={
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {page.enSesionCount} de {page.aprendicesFicha.length} con registro en sesión
        </span>
      }
      extra={
        <>
          {fechasFormacion ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Fechas: {fechasFormacion}</p>
          ) : null}
          {fichaSeleccionada.total_horas ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">Total horas: {fichaSeleccionada.total_horas}</p>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Estado de la sesión</p>
            <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span
                className={`inline-block h-2 w-2 rounded-full ${sesionSoloLectura ? 'bg-gray-400' : 'bg-green-500'}`}
                aria-hidden
              />
              <span>{sesionSoloLectura ? 'Asistencia: Cerrada' : 'Asistencia: Activa'}</span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-gray-100">Observación de la sesión:</span>{' '}
              {sesionActual.observaciones?.trim() ? sesionActual.observaciones : 'Sin observación registrada'}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {sesionSoloLectura
              ? 'La sesión se cerró automáticamente al terminar el horario de la jornada (más la extensión). Los registros se conservan.'
              : 'La sesión se cierra automáticamente al terminar el horario de la jornada (más la extensión).'}
          </p>
        </>
      }
      actions={
        <>
          <button type="button" onClick={abrirObservacionSesion} className="btn-secondary text-sm">
            Observación de sesión
          </button>
          <button type="button" onClick={page.handleVolverAFichas} className="btn-secondary text-sm">
            Volver a fichas
          </button>
        </>
      }
    />
  );
}

export function AsistenciaTomarSesionView({ page }: Props) {
  const { fichaSeleccionada, sesionActual, sesionSoloLectura } = page;

  if (!fichaSeleccionada || !sesionActual) return null;

  return (
    <div className="space-y-4 pb-8 md:pb-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {sesionSoloLectura ? 'Consultar asistencia' : 'Tomar asistencia'}
            </h1>
            <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
              Ficha {fichaSeleccionada.ficha} · {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}
            </p>
            {sesionSoloLectura ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Sesión cerrada automáticamente. Los registros se conservan; no puede agregar ingresos ni salidas.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Abra un método a la vez; al elegir otro, el anterior se cierra.
              </p>
            )}
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

      {sesionSoloLectura ? (
        <section aria-label="Registros de la sesión" className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Registros de la sesión</h2>
          <AsistenciaAprendicesListaSesion page={page} modoLista="individual" busqueda={false} />
        </section>
      ) : (
        <AsistenciaMetodosAccordion key={sesionActual.id} page={page} sesionId={sesionActual.id} />
      )}

      <AsistenciaModals page={page} />
    </div>
  );
}
