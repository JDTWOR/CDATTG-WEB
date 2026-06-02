import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState; embedded?: boolean }>;

export function AsistenciaBulkBar({ page, embedded = false }: Props) {
  const { selectedAprendizIds, bulkCounts, bulkProcesando, handleBulkEntrada, handleBulkSalida } = page;
  if (selectedAprendizIds.size === 0) return null;

  const layoutClass = embedded
    ? 'mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900/50'
    : 'fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 md:static md:mt-4 md:rounded-xl md:border md:p-4';

  return (
    <div className={layoutClass}>
      <p className="mb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
        {selectedAprendizIds.size} seleccionado{selectedAprendizIds.size === 1 ? '' : 's'}
        {bulkCounts.entradas > 0 ? ` · ${bulkCounts.entradas} entrada(s)` : ''}
        {bulkCounts.salidas > 0 ? ` · ${bulkCounts.salidas} salida(s)` : ''}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={bulkProcesando || bulkCounts.entradas === 0}
          onClick={handleBulkEntrada}
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-lg bg-green-600 text-sm font-semibold text-white disabled:opacity-40 touch-manipulation"
        >
          Entrada grupal
        </button>
        <button
          type="button"
          disabled={bulkProcesando || bulkCounts.salidas === 0}
          onClick={handleBulkSalida}
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-lg bg-red-600 text-sm font-semibold text-white disabled:opacity-40 touch-manipulation"
        >
          Salida grupal
        </button>
      </div>
    </div>
  );
}
