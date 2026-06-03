import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FilaAprendizAsistencia, TarjetaAprendizAsistencia, type ModoListaAprendiz } from './AprendizAsistenciaListItems';
import type { AsistenciaSesionPageState } from './useAsistenciaSesion';

type Props = Readonly<{
  page: AsistenciaSesionPageState;
  modoLista: ModoListaAprendiz;
  busqueda?: boolean;
}>;

export function AsistenciaAprendicesListaSesion({ page, modoLista, busqueda = true }: Props) {
  const {
    loadingAprendices,
    aprendicesFicha,
    aprendicesFiltrados,
    errorAprendices,
    sesionActual,
    registroPorAprendizId,
    selectedAprendizIds,
    busyAprendizIds,
    toggleSelectAprendiz,
    handleRegistrarIngreso,
    handleRegistrarSalida,
    onAbrirEstadoModal,
    onAbrirObservacionesModal,
    busquedaAprendiz,
    setBusquedaAprendiz,
  } = page;

  if (loadingAprendices) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
        Cargando listado de aprendices...
      </div>
    );
  }
  if (aprendicesFicha.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
        No hay aprendices en esta ficha.
      </div>
    );
  }

  const esGrupal = modoLista === 'grupal';
  const asistenciaId = sesionActual?.id ?? null;

  const itemProps = (aprendiz: (typeof aprendicesFiltrados)[0], idx: number) => ({
    modoLista,
    aprendiz,
    registros: registroPorAprendizId.get(aprendiz.id) ?? [],
    index: idx + 1,
    asistenciaId,
    selected: selectedAprendizIds.has(aprendiz.id),
    busy: busyAprendizIds.has(aprendiz.id),
    onToggleSelect: toggleSelectAprendiz,
    onRegistrarIngreso: handleRegistrarIngreso,
    onRegistrarSalida: (aaId: number) => handleRegistrarSalida(aaId, aprendiz.id),
    onAbrirEstado: onAbrirEstadoModal,
    onAbrirObservaciones: onAbrirObservacionesModal,
  });

  return (
    <>
      {errorAprendices && (
        <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          <p className="text-sm">{errorAprendices}</p>
        </div>
      )}

      {busqueda && (
        <div className="relative mb-4">
          <label htmlFor={`busqueda-aprendiz-${modoLista}`} className="sr-only">
            Buscar aprendiz
          </label>
          <input
            id={`busqueda-aprendiz-${modoLista}`}
            type="search"
            value={busquedaAprendiz}
            onChange={(e) => setBusquedaAprendiz(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="input-field w-full"
          />
        </div>
      )}

      {aprendicesFiltrados.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
          Ningún aprendiz coincide con la búsqueda.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {aprendicesFiltrados.map((a, idx) => (
              <TarjetaAprendizAsistencia key={a.id} {...itemProps(a, idx)} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-900">
                  {esGrupal ? <th className="border px-2 py-2 dark:border-gray-600" aria-label="Seleccionar" /> : null}
                  <th className="border px-3 py-2 dark:border-gray-600">#</th>
                  <th className="border px-3 py-2 dark:border-gray-600">Documento</th>
                  <th className="border px-3 py-2 dark:border-gray-600">Nombre</th>
                  <th className="border px-3 py-2 dark:border-gray-600">Ingreso</th>
                  <th className="border px-3 py-2 dark:border-gray-600">Salida</th>
                  <th className="border px-3 py-2 dark:border-gray-600">Obs.</th>
                  {esGrupal ? null : <th className="border px-3 py-2 dark:border-gray-600">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {aprendicesFiltrados.map((a, idx) => (
                  <FilaAprendizAsistencia key={a.id} {...itemProps(a, idx)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
