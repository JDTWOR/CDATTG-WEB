import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type FichaDetalleAprendicesToolbarProps = Readonly<{
  stats: { total: number; ocultos: number };
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  puedeGestionar: boolean;
  onAsignarClick: () => void;
}>;

export function FichaDetalleAprendicesToolbar({
  stats,
  busqueda,
  onBusquedaChange,
  puedeGestionar,
  onAsignarClick,
}: FichaDetalleAprendicesToolbarProps) {
  const statsLabel =
    stats.ocultos > 0
      ? `${stats.total} activos · ${stats.ocultos} ocultos en asistencia`
      : `${stats.total} activos`;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aprendices asignados</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{statsLabel}</p>
        </div>
        {puedeGestionar && (
          <button type="button" onClick={onAsignarClick} className="btn-primary shrink-0">
            Asignar aprendices
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por nombre o documento…"
          className="input-field w-full pl-9"
          aria-label="Buscar aprendices"
        />
      </div>

      {puedeGestionar && (
        <details className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900/40">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
            ¿Ocultar vs desasignar?
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-400">
            <li>
              <strong>Ocultar de asistencia</strong> simplifica la toma del día; sigue en la ficha y cuenta
              inasistencias.
            </li>
            <li>
              <strong>Desasignar</strong> lo quita del listado e historial en pantalla.
            </li>
          </ul>
        </details>
      )}
    </div>
  );
}
