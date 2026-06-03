import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CasosBienestarBreadcrumb } from './components/CasosBienestarBreadcrumb';
import { CasosBienestarCriteriosCard } from './components/CasosBienestarCriteriosCard';
import { CasosBienestarListaFilters } from './components/CasosBienestarListaFilters';
import { CasosBienestarResumenCards } from './components/CasosBienestarResumenCards';
import { CasosBienestarFichasGrid } from './components/CasosBienestarFichasGrid';
import { useCasosBienestarListaPage } from './hooks/useCasosBienestarListaPage';

export function CasosBienestarPage() {
  const page = useCasosBienestarListaPage();

  if (!page.canView) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">{page.permissionError}</p>
        <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CasosBienestarBreadcrumb />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden />
            Casos a tener en cuenta (Bienestar al Aprendiz)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Aprendices con indicadores de riesgo de deserción: inasistencias repetidas para seguimiento por la
            oficina de bienestar.
          </p>
        </div>
        <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al Dashboard
        </Link>
      </div>

      <CasosBienestarCriteriosCard
        dias={page.dias}
        minFallas={page.minFallas}
        onDiasChange={page.setDias}
        onMinFallasChange={page.setMinFallas}
      />

      {!page.loading && page.data && page.data.casos.length > 0 && (
        <CasosBienestarListaFilters
          searchQuery={page.searchQuery}
          onSearchQueryChange={page.setSearchQuery}
          programaFiltroIndex={page.programaFiltroIndex}
          onProgramaFiltroIndexChange={page.setProgramaFiltroIndex}
          programasOpciones={page.programasOpciones}
        />
      )}

      {page.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.error}
        </div>
      )}

      {page.loading && (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando casos…
        </div>
      )}

      {!page.loading && page.data && (
        <>
          <CasosBienestarResumenCards
            data={page.data}
            totalFichas={page.casosPorFicha.length}
            fichasFiltradas={page.gruposFiltrados.length}
            filtrosActivos={page.filtrosActivos}
          />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fichas con casos de bienestar
            </h2>
            <CasosBienestarFichasGrid
              grupos={page.gruposFiltrados}
              dias={page.dias}
              minFallas={page.minFallas}
              hayCasosEnApi={page.data.casos.length > 0}
              sinResultadosFiltro={page.data.casos.length > 0 && page.gruposFiltrados.length === 0}
            />
          </div>
        </>
      )}
    </div>
  );
}
