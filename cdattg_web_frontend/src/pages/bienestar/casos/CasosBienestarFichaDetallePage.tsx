import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { bienestarPaths } from '../bienestarPaths';
import { CasosBienestarAprendicesFilters } from './components/CasosBienestarAprendicesFilters';
import { CasosBienestarAprendicesTable } from './components/CasosBienestarAprendicesTable';
import { CasosBienestarCriteriosCard } from './components/CasosBienestarCriteriosCard';
import { CasosBienestarInasistenciasModal } from './components/CasosBienestarInasistenciasModal';
import { useCasosBienestarFichaDetalle } from './hooks/useCasosBienestarFichaDetalle';
import { resumenPeriodoCasosBienestar } from './casosBienestarUtils';

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
          Volver al listado de casos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Seguimiento de asistencia · Ficha {page.fichaNumero}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Listado de aprendices que reúnen los criterios de alerta por inasistencias reiteradas, orientado
            a la gestión del equipo de Bienestar al Aprendiz.
          </p>
          {page.sedeNombre && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Sede: </span>
              {page.sedeNombre}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-500">
            Metodología: se evalúan únicamente sesiones registradas en días con formación programada según el
            calendario de la ficha. Se excluyen festivos nacionales y suspensiones de formación por sede (PARO).
          </p>
        </div>
        <Link
          to={bienestarPaths.casos.index}
          className="btn-secondary inline-flex shrink-0 items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al listado
        </Link>
      </div>

      <CasosBienestarCriteriosCard
        dias={page.dias}
        minFallas={page.minFallas}
        onDiasChange={page.setDias}
        onMinFallasChange={page.setMinFallas}
      />

      {page.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.error}
        </div>
      )}

      {page.pdfError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.pdfError}
        </div>
      )}

      {page.loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando información de seguimiento…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <UserGroupIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices en seguimiento</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {page.casosFichaTotal}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {resumenPeriodoCasosBienestar(
                    page.dias,
                    page.minFallas,
                    page.data?.fecha_inicio,
                    page.data?.fecha_fin,
                  )}
                </p>
                {page.busquedaActiva && page.casosFichaTotal > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Visualizando {page.casosFicha.length} de {page.casosFichaTotal} registros
                  </p>
                )}
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
                <ChartBarIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Consolidado del período</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Sesiones evaluadas:{' '}
                  <span className="font-semibold tabular-nums">{page.totalSesiones}</span>
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  Inasistencias sin justificar:{' '}
                  <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    {page.totalInasistencias}
                  </span>
                </p>
                {page.totalInasistenciasJustificadas > 0 && (
                  <p className="text-sm text-gray-900 dark:text-white">
                    Inasistencias justificadas:{' '}
                    <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                      {page.totalInasistenciasJustificadas}
                    </span>
                  </p>
                )}
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
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registro de aprendices en alerta
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Consulte el detalle de inasistencias o descargue el reporte PDF individual por aprendiz.
              </p>
            </div>
            <CasosBienestarAprendicesTable
              fichaNumero={page.fichaNumero ?? ''}
              casos={page.casosFicha}
              casosTotal={page.casosFichaTotal}
              minFallas={page.minFallas}
              busquedaActiva={page.busquedaActiva}
              pdfDescargandoId={page.pdfDescargandoId}
              onVerDetalle={(c) => void page.abrirDetalleAprendiz(c)}
              onDescargarPdf={(c) => void page.descargarReportePdfAprendiz(c)}
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
          inasistenciasJustificadas={page.detalleInasistenciasJustificadas}
          dias={page.dias}
          minFallas={page.minFallas}
          periodo={page.detallePeriodo}
          pdfDescargando={page.pdfDescargandoId === page.aprendizDetalle.aprendiz_id}
          onDescargarPdf={() =>
            void page.descargarReportePdfAprendiz(page.aprendizDetalle!, {
              inasistencias: page.detalleInasistencias,
              inasistenciasJustificadas: page.detalleInasistenciasJustificadas,
              periodo: page.detallePeriodo,
            })
          }
          onClose={page.cerrarDetalleAprendiz}
        />
      )}
    </div>
  );
}
