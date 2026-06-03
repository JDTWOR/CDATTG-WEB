import { Link } from 'react-router-dom';
import { UsersIcon } from '@heroicons/react/24/outline';
import { bienestarPaths } from '../../bienestarPaths';
import { FichaCaracterizacionCard } from '../../../../components/FichaCaracterizacionCard';
import { grupoCasosToFichaCard, type GrupoCasosPorFicha } from '../casosBienestarUtils';

type CasosBienestarFichasGridProps = Readonly<{
  grupos: GrupoCasosPorFicha[];
  dias: number;
  minFallas: number;
  sinResultadosFiltro: boolean;
  hayCasosEnApi: boolean;
}>;

export function CasosBienestarFichasGrid({
  grupos,
  dias,
  minFallas,
  sinResultadosFiltro,
  hayCasosEnApi,
}: CasosBienestarFichasGridProps) {
  if (!hayCasosEnApi) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        No se encontraron aprendices que cumplan los criterios en el período seleccionado.
      </div>
    );
  }

  if (sinResultadosFiltro) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        Ninguna ficha coincide con la búsqueda o el programa seleccionado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {grupos.map((grupo) => (
        <FichaCaracterizacionCard
          key={grupo.groupKey}
          ficha={grupoCasosToFichaCard(grupo)}
          footerLeft={
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <UsersIcon className="h-4 w-4" aria-hidden />
              {grupo.casos.length} Aprendices en riesgo
            </span>
          }
          extra={
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Sesiones analizadas:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{grupo.totalSesiones}</span>
              </span>
              <span>
                Total inasistencias:{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {grupo.totalInasistencias}
                </span>
              </span>
            </div>
          }
          actions={
            <Link
              to={bienestarPaths.casos.ficha(grupo.ficha_numero, {
                sede: grupo.sede_nombre || '',
                dias,
                min_fallas: minFallas,
              })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Ver aprendices
            </Link>
          }
        />
      ))}
    </div>
  );
}
