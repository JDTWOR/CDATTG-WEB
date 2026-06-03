import { DocumentMagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { CasosBienestarResponse } from '../../../types';

type CasosBienestarResumenCardsProps = Readonly<{
  data: CasosBienestarResponse;
  totalFichas: number;
  fichasFiltradas: number;
  filtrosActivos: boolean;
}>;

export function CasosBienestarResumenCards({
  data,
  totalFichas,
  fichasFiltradas,
  filtrosActivos,
}: CasosBienestarResumenCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="card flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
          <UserGroupIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos detectados</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.casos.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Últimos {data.dias_analizados} días, con {data.min_fallas}+ inasistencias
          </p>
          {filtrosActivos && totalFichas > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mostrando {fichasFiltradas} de {totalFichas} fichas
            </p>
          )}
        </div>
      </div>
      <div className="card flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
          <DocumentMagnifyingGlassIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criterio</p>
          <p className="text-sm text-gray-900 dark:text-white">
            Riesgo de deserción: inasistencias repetidas sin justificar para seguimiento por bienestar.
          </p>
        </div>
      </div>
    </div>
  );
}
