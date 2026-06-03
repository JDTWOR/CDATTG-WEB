import { FunnelIcon } from '@heroicons/react/24/outline';
import { CASOS_BIEN_DIAS_ID, CASOS_BIEN_MIN_FALLAS_ID } from '../casosBienestarConstants';

type CasosBienestarCriteriosCardProps = Readonly<{
  dias: number;
  minFallas: number;
  onDiasChange: (dias: number) => void;
  onMinFallasChange: (minFallas: number) => void;
}>;

export function CasosBienestarCriteriosCard({
  dias,
  minFallas,
  onDiasChange,
  onMinFallasChange,
}: CasosBienestarCriteriosCardProps) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <FunnelIcon className="h-5 w-5" aria-hidden />
        Criterios de análisis
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor={CASOS_BIEN_DIAS_ID} className="text-sm text-gray-600 dark:text-gray-400">
            Últimos
          </label>
          <select
            id={CASOS_BIEN_DIAS_ID}
            value={dias}
            onChange={(e) => onDiasChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={CASOS_BIEN_MIN_FALLAS_ID} className="text-sm text-gray-600 dark:text-gray-400">
            Mínimo de inasistencias
          </label>
          <select
            id={CASOS_BIEN_MIN_FALLAS_ID}
            value={minFallas}
            onChange={(e) => onMinFallasChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value={1}>1 o más</option>
            <option value={2}>2 o más</option>
            <option value={3}>3 o más</option>
            <option value={5}>5 o más</option>
            <option value={10}>10 o más</option>
          </select>
        </div>
      </div>
    </div>
  );
}
