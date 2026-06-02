import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { FichaCaracterizacionCard } from '../../components/FichaCaracterizacionCard';
import { ASIST_MODAL_IDS_ROOT } from './asistenciaConstants';import { AsistenciaModals } from './AsistenciaModals';
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
          <FichaCaracterizacionCard
            key={item.id}
            ficha={item}
            actions={
              <button
                type="button"
                onClick={() => void handleTomarAsistencia(item.id)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <CalendarDaysIcon className="h-4 w-4" />
                {loading ? 'Entrando…' : 'Tomar asistencia'}
              </button>
            }
          />
        ))}
      </div>
      <AsistenciaModals page={page} estadoFieldIds={ASIST_MODAL_IDS_ROOT} />
    </div>
  );
}
