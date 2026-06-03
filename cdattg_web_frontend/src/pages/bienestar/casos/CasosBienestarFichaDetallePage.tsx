import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { bienestarPaths } from '../bienestarPaths';
import { CasosBienestarAprendicesFilters } from './components/CasosBienestarAprendicesFilters';
import { CasosBienestarAprendicesTable } from './components/CasosBienestarAprendicesTable';
import { CasosBienestarInasistenciasModal } from './components/CasosBienestarInasistenciasModal';
import { useCasosBienestarFichaDetalle } from './hooks/useCasosBienestarFichaDetalle';

export function CasosBienestarFichaDetallePage() {
  const page = useCasosBienestarFichaDetalle();

  if (!page.canView) {
    return (
      <div className="space-y-6">
        <p role="alert" className="text-red-600 dark:text-red-400">
          {page.permissionError}
        </p>
        <Link
          to={bienestarPaths.casos.index}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver a Casos de Bienestar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden />
            Ficha {page.fichaNumero} - Casos de bienestar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detalle de aprendices con indicadores de riesgo de deserción en esta ficha.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Período: últimos {page.dias} días · Mínimo de inasistencias: {page.minFallas}+
          </p>
          {page.sedeNombre && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sede: {page.sedeNombre}</p>
          )}
        </div>
        <Link
          to={bienestarPaths.casos.index}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver a Casos de Bienestar
        </Link>
      </div>

      {page.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.error}
        </div>
      )}

      {page.loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          Cargando casos de la ficha...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <UserGroupIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices en riesgo</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{page.casosFichaTotal}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Últimos {page.dias} días, con {page.minFallas}+ inasistencias
                </p>
                {page.busquedaActiva && page.casosFichaTotal > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mostrando {page.casosFicha.length} de {page.casosFichaTotal} aprendices
                  </p>
                )}
              </div>
            </div>
            <div className="card flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resumen de inasistencias</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Total sesiones analizadas:{' '}
                  <span className="font-semibold">{page.totalSesiones}</span>
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Total inasistencias:{' '}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {page.totalInasistencias}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {page.casosFichaTotal > 0 && (
            <CasosBienestarAprendicesFilters
              searchQuery={page.searchQuery}
              onSearchQueryChange={page.setSearchQuery}
            />
          )}

          <div className="card overflow-hidden">
            <h2 className="mb-4 px-4 pt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Aprendices de la ficha {page.fichaNumero} a tener en cuenta
            </h2>
            <CasosBienestarAprendicesTable
              fichaNumero={page.fichaNumero ?? ''}
              casos={page.casosFicha}
              casosTotal={page.casosFichaTotal}
              busquedaActiva={page.busquedaActiva}
              onVerDetalle={(c) => void page.abrirDetalleAprendiz(c)}
            />
          </div>
        </>
      )}

      {page.aprendizDetalle && (
        <CasosBienestarInasistenciasModal
          aprendiz={page.aprendizDetalle}
          loading={page.detalleLoading}
          error={page.detalleError}
          inasistencias={page.detalleInasistencias}
          onClose={page.cerrarDetalleAprendiz}
        />
      )}
    </div>
  );
}
