import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { ASIST_MODAL_IDS_ROOT } from './asistenciaConstants';
import { AsistenciaModals } from './AsistenciaModals';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState }>;

export function AsistenciaFichasListView({ page }: Props) {
  const {
    fichas,
    error,
    errorSesionMsg,
    pendientesLoading,
    pendientesError,
    pendientesRevision,
    loading,
    isSuperAdmin,
    handleTomarAsistencia,
    onAbrirEstadoModal,
  } = page;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asistencia</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Tomar asistencia por ficha e instructor</p>
        </div>
        <div className="flex gap-2">
          <Link to="/asistencia/historial" className="btn-secondary inline-flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5" />
            Historial
          </Link>
          {isSuperAdmin && (
            <Link to="/asistencia/dashboard" className="btn-secondary inline-flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {errorSesionMsg && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">{errorSesionMsg}</div>
      )}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Ajustes pendientes</h2>
        {pendientesLoading && <span className="text-xs text-gray-500">Cargando…</span>}
        {pendientesError && <p className="text-sm text-amber-700">{pendientesError}</p>}
        {!pendientesLoading && pendientesRevision.length === 0 && (
          <p className="text-sm text-gray-500">No hay ajustes pendientes para hoy.</p>
        )}
        {pendientesRevision.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-800">
                  <th className="border px-3 py-2">Ficha</th>
                  <th className="border px-3 py-2">Documento</th>
                  <th className="border px-3 py-2">Aprendiz</th>
                  <th className="border px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientesRevision.map((p) => (
                  <tr key={p.id} className="bg-white dark:bg-gray-800">
                    <td className="border px-3 py-2">{p.ficha_numero || '–'}</td>
                    <td className="border px-3 py-2">{p.numero_documento || '–'}</td>
                    <td className="border px-3 py-2">{p.aprendiz_nombre || '–'}</td>
                    <td className="border px-3 py-2">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() =>
                          onAbrirEstadoModal({
                            asistenciaAprendizId: p.id,
                            nombre: p.aprendiz_nombre || 'Aprendiz',
                            estado: p.estado || 'ASISTENCIA_COMPLETA',
                            motivo: p.motivo_ajuste || '',
                          })
                        }
                      >
                        Resolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fichas.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold uppercase leading-tight text-gray-900 dark:text-white">
                  {item.programa_formacion_nombre || 'Sin programa'}
                </h3>
                {item.modalidad_formacion_nombre ? (
                  <span className="shrink-0 rounded bg-primary-600 px-2.5 py-1 text-xs font-medium text-white">
                    {item.modalidad_formacion_nombre}
                  </span>
                ) : null}
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Ficha {item.ficha}</p>
              <div className="mb-4 space-y-3">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Información académica
                  </p>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Jornada: {item.jornada_nombre || '–'}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Sede / Ambiente: {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '–'}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Instructor líder</p>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{item.instructor_nombre || '–'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.cantidad_aprendices} aprendices</span>
                <button
                  type="button"
                  onClick={() => void handleTomarAsistencia(item.id)}
                  disabled={loading}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Entrando…' : 'Tomar asistencia'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AsistenciaModals page={page} estadoFieldIds={ASIST_MODAL_IDS_ROOT} />
    </div>
  );
}
